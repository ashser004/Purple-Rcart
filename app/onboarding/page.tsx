'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createUserProfile } from '@/lib/firestore';
import { getCurrentLocation } from '@/lib/location';
import { uploadImageToCloudinary } from '@/lib/cloudinary';
import toast from 'react-hot-toast';
import { MapPin, Store, Camera, ArrowRight, ArrowLeft, Check, Navigation } from 'lucide-react';

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.photoURL || '');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  // Optional seller setup
  const [wantsSeller, setWantsSeller] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleGetLocation = async () => {
    setLocLoading(true);
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      // Reverse geocode (basic)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.lat}&lon=${loc.lng}&format=json`);
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch {}
      toast.success('Location captured!');
    } catch (err: any) {
      toast.error('Could not get location. Please enter manually.');
    } finally {
      setLocLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    if (!displayName.trim()) return toast.error('Enter your name');
    if (!location && !address) return toast.error('Please provide your location');

    setLoading(true);
    try {
      let avatarUrl = avatarPreview || '';
      if (avatarFile) {
        avatarUrl = await uploadImageToCloudinary(avatarFile, user.uid, 'avatar');
      }

      await createUserProfile(user.uid, {
        uid: user.uid,
        email: user.email || '',
        displayName: displayName.trim(),
        avatarUrl,
        phone,
        location: {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          address: address,
        },
        isSeller: wantsSeller,
        ...(wantsSeller && storeName ? { storeName } : {}),
        ...(wantsSeller && storeDescription ? { storeDescription } : {}),
        ...(wantsSeller && location ? { storeLocation: { lat: location.lat, lng: location.lng, address } } : {}),
      });

      await refreshProfile();
      toast.success('Welcome to Radius Cart! 🎉 You got ₹1,000 free credit!');
      router.push('/home');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    // Step 0: Basic Info
    <div key="basic" className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome! 👋</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>Let&apos;s set up your profile</p>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <label style={{ cursor: 'pointer', position: 'relative' }}>
          <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          {avatarPreview ? (
            <img src={avatarPreview} alt="" className="avatar-xl" style={{ width: 96, height: 96 }} />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'var(--surface)', border: '2px dashed var(--border-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Camera size={28} color="var(--muted)" />
            </div>
          )}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Camera size={14} color="white" />
          </div>
        </label>
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="input-label">Full Name *</label>
        <input className="input-field" placeholder="John Doe" value={displayName} onChange={e => setDisplayName(e.target.value)} />
      </div>
      <div>
        <label className="input-label">Phone Number</label>
        <input className="input-field" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} />
      </div>
    </div>,

    // Step 1: Location
    <div key="location" className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>📍 Your Location</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>We need this to show you nearby products</p>

      <button onClick={handleGetLocation} className="btn-primary" style={{ width: '100%', marginBottom: 16, padding: 14 }} disabled={locLoading}>
        {locLoading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Navigation size={18} /> Detect My Location</>}
      </button>

      {location && (
        <div className="glass-card" style={{ padding: 12, marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--success)' }}>✓ Location captured</span>
          <span style={{ color: 'var(--muted)', marginLeft: 8 }}>({location.lat.toFixed(4)}, {location.lng.toFixed(4)})</span>
        </div>
      )}

      <div>
        <label className="input-label">Address / Area Name</label>
        <input className="input-field" placeholder="e.g. MG Road, Bangalore" value={address} onChange={e => setAddress(e.target.value)} />
        <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4 }}>This helps others find your approximate area</p>
      </div>
    </div>,

    // Step 2: Seller setup (optional)
    <div key="seller" className="fade-in">
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>🏪 Sell on Radius Cart?</h2>
      <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 24 }}>You can also set this up later from your profile</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button onClick={() => setWantsSeller(false)} className={`btn-${!wantsSeller ? 'primary' : 'secondary'}`} style={{ flex: 1, padding: 14 }}>
          Just Buying
        </button>
        <button onClick={() => setWantsSeller(true)} className={`btn-${wantsSeller ? 'primary' : 'secondary'}`} style={{ flex: 1, padding: 14 }}>
          <Store size={16} /> I Want to Sell
        </button>
      </div>

      {wantsSeller && (
        <div className="fade-in">
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">Store / Business Name *</label>
            <input className="input-field" placeholder="My Awesome Store" value={storeName} onChange={e => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="input-label">Description</label>
            <textarea className="input-field" placeholder="What do you sell?" value={storeDescription} onChange={e => setStoreDescription(e.target.value)} />
          </div>
        </div>
      )}
    </div>,
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'radial-gradient(ellipse at top, rgba(139,92,246,0.1) 0%, transparent 50%), var(--gradient-bg)',
    }}>
      <div className="glass-card" style={{ maxWidth: 460, width: '100%', padding: 32 }}>
        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: i <= step ? 'var(--primary)' : 'var(--border-color)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {steps[step]}

        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="btn-secondary" style={{ padding: '12px 20px' }}>
              <ArrowLeft size={16} /> Back
            </button>
          )}
          <button
            onClick={step < steps.length - 1 ? () => setStep(step + 1) : handleFinish}
            className="btn-primary"
            style={{ flex: 1, padding: 14 }}
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
            ) : step < steps.length - 1 ? (
              <>Continue <ArrowRight size={16} /></>
            ) : (
              <>Get Started <Check size={16} /></>
            )}
          </button>
        </div>

        {/* Free credit banner */}
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 12,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
          textAlign: 'center', fontSize: 13,
        }}>
          🎉 You&apos;ll receive <strong style={{ color: 'var(--success)' }}>₹1,000</strong> free credit on signup!
        </div>
      </div>
    </div>
  );
}
