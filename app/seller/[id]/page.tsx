'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getUserProfile, getProductsBySeller, isSubscribed, subscribeToSeller, unsubscribeFromSeller, type Product, type UserProfile } from '@/lib/firestore';
import { createOrGetChatRoom } from '@/lib/chat';
import { formatDistance } from '@/lib/location';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, MapPin, Bell, BellOff, MessageCircle, ExternalLink, Package } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function SellerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    try {
      const s = await getUserProfile(id);
      setSeller(s);
      if (s) {
        const prods = await getProductsBySeller(id);
        setProducts(prods.filter(p => p.status === 'available'));
        if (profile) {
          const sub = await isSubscribed(profile.uid, id);
          setSubscribed(sub);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubscribe = async () => {
    if (!profile) return;
    if (subscribed) {
      await unsubscribeFromSeller(profile.uid, id);
      setSubscribed(false);
      toast.success('Unsubscribed');
    } else {
      await subscribeToSeller(profile.uid, id);
      setSubscribed(true);
      toast.success('Subscribed!');
    }
  };

  const handleChat = async () => {
    if (!profile || !seller) return;
    const roomId = await createOrGetChatRoom(
      profile.uid, seller.uid,
      profile.displayName, seller.displayName,
      profile.avatarUrl || '', seller.avatarUrl || '',
    );
    router.push(`/chat/${roomId}`);
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div>;
  if (!seller) return <div className="page-container"><div className="empty-state"><h3>Seller not found</h3></div></div>;

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>{seller.storeName || seller.displayName}</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container">
        {/* Profile */}
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <img src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.displayName)}&background=7c3aed&color=fff&size=96`} alt="" className="avatar-xl" style={{ margin: '0 auto 12px', width: 80, height: 80 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{seller.storeName || seller.displayName}</h2>
          {seller.storeDescription && <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{seller.storeDescription}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 8, color: 'var(--muted)', fontSize: 13 }}>
            <MapPin size={13} /> {seller.location?.address?.split(',').slice(0, 2).join(',') || 'Unknown'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
            <button onClick={handleSubscribe} className={subscribed ? 'btn-secondary' : 'btn-primary'} style={{ padding: '8px 20px', fontSize: 13 }}>
              {subscribed ? <><BellOff size={14} /> Unsubscribe</> : <><Bell size={14} /> Subscribe</>}
            </button>
            <button onClick={handleChat} className="btn-secondary" style={{ padding: '8px 20px', fontSize: 13 }}>
              <MessageCircle size={14} /> Chat
            </button>
          </div>
        </div>

        {/* Location map */}
        {seller.location && seller.location.lat !== 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ height: 200, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <MapView
                center={seller.storeLocation || seller.location}
                sellers={[{ ...seller, distance: 0 }] as any}
                products={[]}
                radiusKm={2}
                onSellerClick={() => {}}
                onProductClick={() => {}}
              />
            </div>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${seller.location.lat},${seller.location.lng}`}
              target="_blank" rel="noopener"
              style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, color: 'var(--primary-light)', fontSize: 13, textDecoration: 'none' }}
            >
              <ExternalLink size={13} /> Open in Google Maps
            </a>
          </div>
        )}

        {/* Products */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
          <Package size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Products ({products.length})
        </h3>
        {products.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <p>No products listed yet</p>
          </div>
        ) : (
          <div className="product-grid">
            {products.map(product => (
              <div key={product.id} className="product-card" onClick={() => router.push(`/product/${product.id}`)} style={{ position: 'relative' }}>
                <img src={product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'} alt={product.title} className="product-card-image" />
                <div className="product-card-badge">
                  <span className={`badge ${product.type === 'rent' ? 'badge-warning' : 'badge-primary'}`}>{product.type}</span>
                </div>
                <div className="product-card-body">
                  <div className="product-card-title">{product.title}</div>
                  <div className="product-card-price">₹{product.price}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
