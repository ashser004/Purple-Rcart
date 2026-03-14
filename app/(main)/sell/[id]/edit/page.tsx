'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getProduct, updateProduct, type Product } from '@/lib/firestore';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, X, Save } from 'lucide-react';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Stationery', 'Food', 'Services', 'Other'];

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [type, setType] = useState<'sell' | 'rent'>('sell');
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    const p = await getProduct(id);
    if (p) {
      setProduct(p);
      setTitle(p.title);
      setDescription(p.description);
      setPrice(String(p.price));
      setCategory(p.category);
      setType(p.type);
      setExistingImages(p.images || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return toast.error('Title and price required');
    setLoading(true);
    try {
      await updateProduct(id, {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        type,
        images: existingImages,
        rentalPricePerDay: type === 'rent' ? Number(price) : undefined,
      });
      toast.success('Product updated!');
      router.push('/sell');
    } catch (err: any) {
      toast.error(err.message);
    } finally { setLoading(false); }
  };

  if (!product) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Edit Product</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Images</label>
            <div className="image-upload-grid">
              {existingImages.map((url, i) => (
                <div key={i} className="image-upload-slot">
                  <img src={url} alt="" />
                  <button type="button" className="image-upload-remove" onClick={() => setExistingImages(prev => prev.filter((_, idx) => idx !== i))}><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Title *</label>
            <input className="input-field" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Description</label>
            <textarea className="input-field" value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Price (₹)</label>
            <input className="input-field" type="number" value={price} onChange={e => setPrice(e.target.value)} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={16} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
}
