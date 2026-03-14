'use client';

import { useAuth } from '@/lib/auth-context';
import { getOrdersByBuyer, type Order } from '@/lib/firestore';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function WalletPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) loadOrders();
  }, [profile]);

  const loadOrders = async () => {
    if (!profile) return;
    try {
      const o = await getOrdersByBuyer(profile.uid);
      setOrders(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Wallet</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container">
        <div className="wallet-card" style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Available Balance</div>
          <div className="wallet-balance">₹{profile?.wallet?.toLocaleString() || '0'}</div>
          <div style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>Signup credit • No external top-up</div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Transaction History</h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spinner-lg" /></div>
        ) : orders.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}><p>No transactions yet</p></div>
        ) : (
          orders.map(o => (
            <div key={o.id} className="glass-card" style={{ padding: 14, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src={o.productImage || 'https://via.placeholder.com/40'} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{o.productTitle || 'Product'}</div>
                <span className={`badge ${o.type === 'rental' ? 'badge-warning' : 'badge-primary'}`}>{o.type}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, color: 'var(--danger)' }}>-₹{o.amount}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : 'Pending'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
