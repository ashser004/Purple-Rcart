'use client';

import { useAuth } from '@/lib/auth-context';
import { getOrdersByBuyer, getOrdersBySeller, type Order } from '@/lib/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, QrCode } from 'lucide-react';

export default function OrdersPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'purchases' | 'sales'>('purchases');
  const [purchases, setPurchases] = useState<Order[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) load();
  }, [profile]);

  const load = async () => {
    if (!profile) return;
    try {
      const [p, s] = await Promise.all([
        getOrdersByBuyer(profile.uid),
        getOrdersBySeller(profile.uid),
      ]);
      setPurchases(p);
      setSales(s);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const currentOrders = tab === 'purchases' ? purchases : sales;

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>My Orders</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container">
        <div className="tab-bar" style={{ marginBottom: 20 }}>
          <button className={`tab-item ${tab === 'purchases' ? 'active' : ''}`} onClick={() => setTab('purchases')}>Purchases</button>
          <button className={`tab-item ${tab === 'sales' ? 'active' : ''}`} onClick={() => setTab('sales')}>Sales</button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spinner-lg" /></div>
        ) : currentOrders.length === 0 ? (
          <div className="empty-state">
            <ShoppingBag size={48} />
            <h3>No {tab} yet</h3>
          </div>
        ) : (
          currentOrders.map(o => (
            <div key={o.id} className="glass-card" style={{ padding: 14, marginBottom: 10, display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={o.productImage || 'https://via.placeholder.com/50'} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{o.productTitle}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                  <span className={`badge ${o.type === 'rental' ? 'badge-warning' : 'badge-primary'}`}>{o.type}</span>
                  <span className={`badge ${o.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>{o.status}</span>
                </div>
                {o.returnDate && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                    Return by: {new Date(o.returnDate.seconds ? o.returnDate.seconds * 1000 : o.returnDate).toLocaleDateString()}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{o.amount}</div>
                {tab === 'purchases' && o.status === 'pending' && (
                  <button className="btn-ghost" style={{ padding: 4, marginTop: 4 }} onClick={() => router.push(`/qr/${o.id}`)}>
                    <QrCode size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
