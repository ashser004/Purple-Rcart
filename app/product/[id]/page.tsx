'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getProduct, getUserProfile, isSubscribed, subscribeToSeller, unsubscribeFromSeller, type Product, type UserProfile } from '@/lib/firestore';
import { createOrGetChatRoom } from '@/lib/chat';
import { formatDistance } from '@/lib/location';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Calendar, MessageCircle, MapPin, Flag, ExternalLink, Bell, BellOff, ChevronLeft, ChevronRight, Share2 } from 'lucide-react';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [rentDays, setRentDays] = useState(7);
  const [reportReason, setReportReason] = useState('');
  const [imgIdx, setImgIdx] = useState(0);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      const p = await getProduct(id);
      setProduct(p);
      if (p) {
        const s = await getUserProfile(p.sellerId);
        setSeller(s);
        if (profile) {
          const sub = await isSubscribed(profile.uid, p.sellerId);
          setSubscribed(sub);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBuy = async () => {
    if (!profile || !product || !seller) return;
    setBuying(true);
    try {
      const res = await fetch('/api/wallet/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: profile.uid,
          sellerId: product.sellerId,
          productId: product.id,
          amount: product.price,
          productTitle: product.title,
          productImage: product.images?.[0] || '',
          type: 'purchase',
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success('Purchase successful! 🎉');
      setShowBuyModal(false);
      router.push(`/qr/${data.orderId}`);
    } catch (err: any) {
      toast.error(err.message || 'Payment failed');
    } finally { setBuying(false); }
  };

  const handleRent = async () => {
    if (!profile || !product || !seller) return;
    setBuying(true);
    try {
      const returnDate = new Date();
      returnDate.setDate(returnDate.getDate() + rentDays);
      const res = await fetch('/api/wallet/rent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buyerId: profile.uid,
          sellerId: product.sellerId,
          productId: product.id,
          pricePerDay: product.rentalPricePerDay || product.price,
          days: rentDays,
          productTitle: product.title,
          productImage: product.images?.[0] || '',
          returnDate: returnDate.toISOString(),
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Rented for ${rentDays} days! Total: ₹${data.amount}`);
      setShowRentModal(false);
      router.push(`/qr/${data.orderId}`);
    } catch (err: any) {
      toast.error(err.message || 'Rental failed');
    } finally { setBuying(false); }
  };

  const handleReport = async () => {
    if (!profile || !product || !reportReason.trim()) return;
    try {
      await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reporterId: profile.uid,
          productId: product.id,
          sellerId: product.sellerId,
          reason: reportReason,
        }),
      });
      toast.success('Report submitted');
      setShowReportModal(false);
      setReportReason('');
    } catch (e) { toast.error('Failed to submit report'); }
  };

  const handleChat = async () => {
    if (!profile || !product || !seller) return;
    const roomId = await createOrGetChatRoom(
      profile.uid, product.sellerId,
      profile.displayName, seller.displayName,
      profile.avatarUrl || '', seller.avatarUrl || '',
      product.id, product.title,
    );
    router.push(`/chat/${roomId}`);
  };

  const handleSubscribe = async () => {
    if (!profile || !product) return;
    if (subscribed) {
      await unsubscribeFromSeller(profile.uid, product.sellerId);
      setSubscribed(false);
      toast.success('Unsubscribed');
    } else {
      await subscribeToSeller(profile.uid, product.sellerId);
      setSubscribed(true);
      toast.success('Subscribed! You\'ll get notifications');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div>;
  if (!product) return <div className="page-container"><div className="empty-state"><h3>Product not found</h3></div></div>;

  const isMine = profile?.uid === product.sellerId;
  const isSold = product.status !== 'available';

  return (
    <div style={{ paddingBottom: 100 }}>
      {/* Image gallery */}
      <div style={{ position: 'relative' }}>
        <img
          src={product.images?.[imgIdx] || 'https://via.placeholder.com/600x400?text=No+Image'}
          alt={product.title}
          style={{ width: '100%', height: 320, objectFit: 'cover' }}
        />
        <button onClick={() => router.back()} style={{
          position: 'absolute', top: 16, left: 16,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white',
        }}>
          <ArrowLeft size={20} />
        </button>
        {product.images && product.images.length > 1 && (
          <>
            <button onClick={() => setImgIdx(i => Math.max(0, i - 1))} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={18} /></button>
            <button onClick={() => setImgIdx(i => Math.min(product.images.length - 1, i + 1))} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={18} /></button>
            <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>
              {product.images.map((_, i) => (
                <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: i === imgIdx ? 'white' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          </>
        )}
        {isSold && (
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <span className="badge badge-danger" style={{ fontSize: 13, padding: '6px 12px' }}>{product.status.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="page-container" style={{ paddingTop: 20 }}>
        {/* Title & Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, flex: 1 }}>{product.title}</h1>
          <span className={`badge ${product.type === 'rent' ? 'badge-warning' : 'badge-primary'}`} style={{ marginLeft: 8 }}>
            {product.type === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--primary-light)', marginBottom: 16 }}>
          ₹{product.price}
          {product.type === 'rent' && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>/day</span>}
        </div>

        {/* Category */}
        <div style={{ marginBottom: 16 }}>
          <span className="chip active" style={{ cursor: 'default' }}>{product.category}</span>
        </div>

        {/* Description */}
        {product.description && (
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Description</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6 }}>{product.description}</p>
          </div>
        )}

        {/* Seller Card */}
        {seller && (
          <div className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <img src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.displayName)}&background=7c3aed&color=fff`} alt="" className="avatar" style={{ cursor: 'pointer' }} onClick={() => router.push(`/seller/${seller.uid}`)} />
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push(`/seller/${seller.uid}`)}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{seller.storeName || seller.displayName}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle' }} /> {seller.location?.address?.split(',')[0] || 'Unknown'}
              </div>
            </div>
            <button onClick={handleSubscribe} className="btn-ghost" style={{ padding: 8 }}>
              {subscribed ? <BellOff size={18} /> : <Bell size={18} />}
            </button>
          </div>
        )}

        {/* Location */}
        {seller && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${product.location.lat},${product.location.lng}`}
            target="_blank" rel="noopener"
            className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 14, marginBottom: 20, textDecoration: 'none', color: 'var(--foreground)' }}
          >
            <MapPin size={18} color="var(--primary-light)" />
            <span style={{ flex: 1, fontSize: 13 }}>Open in Google Maps</span>
            <ExternalLink size={14} color="var(--muted)" />
          </a>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button onClick={() => setShowReportModal(true)} className="btn-ghost" style={{ color: 'var(--danger)' }}>
            <Flag size={14} /> Report
          </button>
        </div>
      </div>

      {/* Bottom action bar */}
      {!isMine && !isSold && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px', background: 'rgba(10,10,18,0.95)',
          borderTop: '1px solid var(--border-color)', backdropFilter: 'blur(20px)',
          display: 'flex', gap: 10,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}>
          <button onClick={handleChat} className="btn-secondary" style={{ padding: '12px 16px' }}>
            <MessageCircle size={18} />
          </button>
          {product.type === 'sell' ? (
            <button onClick={() => setShowBuyModal(true)} className="btn-primary" style={{ flex: 1, padding: 14 }}>
              <ShoppingCart size={18} /> Buy Now — ₹{product.price}
            </button>
          ) : (
            <button onClick={() => setShowRentModal(true)} className="btn-primary" style={{ flex: 1, padding: 14 }}>
              <Calendar size={18} /> Rent Now — ₹{product.rentalPricePerDay || product.price}/day
            </button>
          )}
        </div>
      )}

      {/* Buy Modal */}
      {showBuyModal && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Confirm Purchase</h3>
            <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Item</span><span>{product.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Price</span><span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{product.price}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Your Balance</span><span>₹{profile?.wallet?.toLocaleString()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowBuyModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={handleBuy} className="btn-primary" style={{ flex: 1, padding: 12 }} disabled={buying}>
                {buying ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Pay ₹' + product.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rent Modal */}
      {showRentModal && (
        <div className="modal-overlay" onClick={() => setShowRentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Rent This Item</h3>
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Rental Duration (days)</label>
              <input className="input-field" type="number" min="1" value={rentDays} onChange={e => setRentDays(Number(e.target.value))} />
            </div>
            <div className="glass-card" style={{ padding: 14, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Rate</span><span>₹{product.rentalPricePerDay || product.price}/day</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Days</span><span>{rentDays}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span><span style={{ color: 'var(--primary-light)' }}>₹{(product.rentalPricePerDay || product.price) * rentDays}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
                Return by: {new Date(Date.now() + rentDays * 86400000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRentModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={handleRent} className="btn-primary" style={{ flex: 1, padding: 12 }} disabled={buying}>
                {buying ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : 'Rent Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="modal-overlay" onClick={() => setShowReportModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Report Product</h3>
            <textarea className="input-field" placeholder="Describe the issue..." value={reportReason} onChange={e => setReportReason(e.target.value)} rows={4} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setShowReportModal(false)} className="btn-secondary" style={{ flex: 1, padding: 12 }}>Cancel</button>
              <button onClick={handleReport} className="btn-danger" style={{ flex: 1, padding: 12 }}>Submit Report</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
