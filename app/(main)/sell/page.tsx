'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getProductsBySeller, deleteProduct, type Product } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Plus, Package, Edit, Trash2, Eye, Store } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function SellPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.uid) loadProducts();
  }, [profile]);

  const loadProducts = async () => {
    if (!profile) return;
    try {
      const prods = await getProductsBySeller(profile.uid);
      setProducts(prods);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch (e: any) { toast.error(e.message); }
  };

  if (!profile?.isSeller) {
    return (
      <div>
        <div className="top-header"><h1 style={{ fontSize: 20, fontWeight: 800 }}>Sell</h1></div>
        <div className="page-container">
          <div className="empty-state">
            <Store size={56} />
            <h3>Start Selling on Radius Cart</h3>
            <p style={{ marginBottom: 20 }}>Set up your seller account to list products</p>
            <Link href="/profile/become-seller" className="btn-primary" style={{ textDecoration: 'none' }}>
              <Store size={16} /> Become a Seller
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="top-header">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>My Products</h1>
        <Link href="/sell/new" className="btn-primary" style={{ padding: '8px 16px', textDecoration: 'none', fontSize: 13 }}>
          <Plus size={16} /> Add
        </Link>
      </div>
      <div className="page-container">
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Total', value: products.length, color: 'var(--primary-light)' },
            { label: 'Available', value: products.filter(p => p.status === 'available').length, color: 'var(--success)' },
            { label: 'Sold', value: products.filter(p => p.status === 'sold').length, color: 'var(--warning)' },
          ].map(stat => (
            <div key={stat.label} className="glass-card" style={{ padding: 14, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner spinner-lg" /></div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <Package size={48} />
            <h3>No products yet</h3>
            <p>Add your first product to start selling</p>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id} className="glass-card" style={{ padding: 14, marginBottom: 12, display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={p.images?.[0] || 'https://via.placeholder.com/60'} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                <div style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: 15 }}>₹{p.price}</div>
                <span className={`badge ${p.status === 'available' ? 'badge-success' : p.status === 'sold' ? 'badge-danger' : 'badge-warning'}`}>{p.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" style={{ padding: 8 }} onClick={() => router.push(`/product/${p.id}`)}><Eye size={16} /></button>
                <button className="btn-ghost" style={{ padding: 8 }} onClick={() => router.push(`/sell/${p.id}/edit`)}><Edit size={16} /></button>
                <button className="btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => handleDelete(p.id)}><Trash2 size={16} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
