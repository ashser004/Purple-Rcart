'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createProduct } from '@/lib/firestore';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import { getCurrentLocation } from '@/lib/location';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ArrowLeft, Camera, X, Upload } from 'lucide-react';

const CATEGORIES = ['Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Stationery', 'Food', 'Services', 'Other'];

export default function NewProductPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [type, setType] = useState<'sell' | 'rent'>('sell');
  const [rentalDuration, setRentalDuration] = useState('7');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const addImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) return toast.error('Max 5 images');
    setImages(prev => [...prev, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!title.trim() || !price) return toast.error('Title and price are required');
    if (images.length === 0) return toast.error('Add at least one image');

    setLoading(true);
    try {
      // Upload images
      const urls: string[] = [];
      for (const img of images) {
        const url = await uploadImageToCloudinary(img, profile.uid, 'products');
        urls.push(url);
      }

      let loc;
      try { loc = await getCurrentLocation(); } catch {
        loc = { lat: profile.location.lat, lng: profile.location.lng };
      }

      await createProduct({
        sellerId: profile.uid,
        sellerName: profile.displayName,
        sellerAvatar: profile.avatarUrl || '',
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        images: urls,
        type,
        rentalPricePerDay: type === 'rent' ? Number(price) : undefined,
        rentalDuration: type === 'rent' ? Number(rentalDuration) : undefined,
        status: 'available',
        location: loc,
      });

      toast.success('Product listed! 🎉');
      router.push('/sell');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="top-header">
        <button onClick={() => router.back()} className="btn-ghost" style={{ padding: 8 }}><ArrowLeft size={20} /></button>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Add Product</h1>
        <div style={{ width: 36 }} />
      </div>
      <div className="page-container" style={{ paddingBottom: 40 }}>
        <form onSubmit={handleSubmit}>
          {/* Images */}
          <div style={{ marginBottom: 20 }}>
            <label className="input-label">Photos (max 5)</label>
            <div className="image-upload-grid">
              {previews.map((p, i) => (
                <div key={i} className="image-upload-slot">
                  <img src={p} alt="" />
                  <button type="button" className="image-upload-remove" onClick={() => removeImage(i)}><X size={14} /></button>
                </div>
              ))}
              {previews.length < 5 && (
                <label className="image-upload-slot">
                  <input type="file" accept="image/*" onChange={addImage} style={{ display: 'none' }} />
                  <Camera size={24} color="var(--muted)" />
                </label>
              )}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Listing Type</label>
            <div className="tab-bar">
              <button type="button" className={`tab-item ${type === 'sell' ? 'active' : ''}`} onClick={() => setType('sell')}>Sell</button>
              <button type="button" className={`tab-item ${type === 'rent' ? 'active' : ''}`} onClick={() => setType('rent')}>Rent</button>
            </div>
          </div>

          {/* Title */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Title *</label>
            <input className="input-field" placeholder="What are you selling?" value={title} onChange={e => setTitle(e.target.value)} />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Description</label>
            <textarea className="input-field" placeholder="Describe your item, condition, etc." value={description} onChange={e => setDescription(e.target.value)} rows={3} />
          </div>

          {/* Price */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">{type === 'rent' ? 'Price per day (₹) *' : 'Price (₹) *'}</label>
            <input className="input-field" type="number" min="1" placeholder="0" value={price} onChange={e => setPrice(e.target.value)} />
          </div>

          {/* Rental duration */}
          {type === 'rent' && (
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">Default rental duration (days)</label>
              <input className="input-field" type="number" min="1" value={rentalDuration} onChange={e => setRentalDuration(e.target.value)} />
            </div>
          )}

          {/* Category */}
          <div style={{ marginBottom: 24 }}>
            <label className="input-label">Category</label>
            <select className="input-field" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', padding: 14 }} disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading...</> : <><Upload size={16} /> List Product</>}
          </button>
        </form>
      </div>
    </div>
  );
}
