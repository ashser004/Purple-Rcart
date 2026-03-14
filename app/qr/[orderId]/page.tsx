'use client';

import { useState, useEffect, use } from 'react';
import { getOrder, type Order } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, CheckCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QRPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const o = await getOrder(orderId);
      setOrder(o);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const copyCode = () => {
    if (order?.qrCode) {
      navigator.clipboard.writeText(order.qrCode);
      toast.success('Copied!');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner spinner-lg" /></div>;
  if (!order) return <div className="page-container"><div className="empty-state"><h3>Order not found</h3></div></div>;

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 16, fontWeight: 700 }}>Order Confirmation</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container" style={{ textAlign: 'center' }}>
        <div className="slide-up">
          <div style={{ margin: '20px auto 24px', color: 'var(--success)' }}>
            <CheckCircle size={56} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
            {order.type === 'rental' ? 'Rental Confirmed!' : 'Purchase Successful!'}
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
            Show this QR code to the seller for product exchange
          </p>

          <div className="glass-card" style={{ padding: 24, display: 'inline-block', marginBottom: 20 }}>
            <div className="qr-container">
              <QRCodeSVG
                value={order.qrCode}
                size={200}
                level="H"
                includeMargin
                bgColor="white"
                fgColor="#1a1a2e"
              />
            </div>
          </div>

          <div className="glass-card" style={{ padding: 16, textAlign: 'left', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>Item</span><span style={{ fontWeight: 600 }}>{order.productTitle}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>Amount</span><span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>₹{order.amount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--muted)' }}>Type</span>
              <span className={`badge ${order.type === 'rental' ? 'badge-warning' : 'badge-primary'}`}>{order.type}</span>
            </div>
            {order.returnDate && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Return by</span>
                <span>{new Date(order.returnDate.seconds ? order.returnDate.seconds * 1000 : order.returnDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center', color: 'var(--muted)', fontSize: 12 }}>
            <span>Code: {order.qrCode}</span>
            <button onClick={copyCode} className="btn-ghost" style={{ padding: 4 }}><Copy size={14} /></button>
          </div>

          <button onClick={() => router.push('/home')} className="btn-primary" style={{ marginTop: 24, padding: '12px 32px' }}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
