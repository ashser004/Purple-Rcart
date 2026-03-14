'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getOrder, updateOrder } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, CheckCircle2, QrCode } from 'lucide-react';

export default function ScanPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!code.trim()) return toast.error('Enter or scan a QR code');
    setLoading(true);
    try {
      // Find order by QR code - search through orders
      // For simplicity we just try to find the order
      const parts = code.split('-');
      // QR format: RCART-{productId}-{timestamp} or RCART-RENT-{productId}-{timestamp}
      // We'll search by iterating... but for hackathon, we'll accept orderId directly too

      // Try as order ID first
      const order = await getOrder(code.includes('RCART') ? '' : code);
      if (order) {
        await updateOrder(order.id, { status: 'completed' });
        setResult('success');
        toast.success('Exchange confirmed! ✅');
      } else {
        toast.error('Invalid code. Ask buyer for the order ID.');
        setResult('error');
      }
    } catch (e) {
      toast.error('Verification failed');
      setResult('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Scan QR Code</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container" style={{ textAlign: 'center' }}>
        <div style={{ margin: '20px auto', color: 'var(--primary-light)' }}>
          <QrCode size={56} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Verify Product Exchange</h2>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>
          Enter the order ID from the buyer&apos;s QR code
        </p>

        <div style={{ marginBottom: 16 }}>
          <input className="input-field" placeholder="Enter Order ID" value={code} onChange={e => setCode(e.target.value)} style={{ textAlign: 'center', fontSize: 16 }} />
        </div>

        <button onClick={handleVerify} className="btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><CheckCircle2 size={18} /> Verify & Complete</>}
        </button>

        {result === 'success' && (
          <div className="glass-card slide-up" style={{ marginTop: 24, padding: 20 }}>
            <CheckCircle2 size={40} color="var(--success)" />
            <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 12, color: 'var(--success)' }}>Exchange Complete!</h3>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>The order has been marked as completed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
