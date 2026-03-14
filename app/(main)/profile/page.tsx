'use client';

import { useAuth } from '@/lib/auth-context';
import { updateUserProfile } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { Wallet, ShoppingBag, Package, Store, Settings, LogOut, ChevronRight, Bell, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (!profile) return null;

  const menuItems = [
    { icon: Wallet, label: 'Wallet', href: '/profile/wallet', subtitle: `₹${profile.wallet?.toLocaleString()}` },
    { icon: ShoppingBag, label: 'My Orders', href: '/profile/orders', subtitle: 'Purchases & rentals' },
    ...(profile.isSeller ? [
      { icon: Package, label: 'My Products', href: '/sell', subtitle: 'Manage listings' },
    ] : [
      { icon: Store, label: 'Become a Seller', href: '/profile/become-seller', subtitle: 'Start selling on Radius Cart' },
    ]),
    { icon: Bell, label: 'Notifications', href: '/notifications', subtitle: 'View all notifications' },
    { icon: MapPin, label: 'Update Location', href: '/profile/location', subtitle: profile.location?.address?.split(',')[0] || '' },
  ];

  return (
    <div>
      <div className="top-header"><h1 style={{ fontSize: 20, fontWeight: 800 }}>Profile</h1></div>
      <div className="page-container">
        {/* Profile Card */}
        <div className="glass-card" style={{ padding: 24, textAlign: 'center', marginBottom: 20 }}>
          <img
            src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName)}&background=7c3aed&color=fff&size=96`}
            alt=""
            className="avatar-xl"
            style={{ margin: '0 auto 12px', width: 80, height: 80 }}
          />
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>{profile.displayName}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>{profile.email}</p>
          {profile.isSeller && (
            <span className="badge badge-primary" style={{ marginTop: 8 }}>
              <Store size={11} style={{ marginRight: 4 }} /> Seller · {profile.storeName}
            </span>
          )}
        </div>

        {/* Wallet Card */}
        <div className="wallet-card" style={{ marginBottom: 20, cursor: 'pointer' }} onClick={() => router.push('/profile/wallet')}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>Available Balance</div>
          <div className="wallet-balance">₹{profile.wallet?.toLocaleString() || '0'}</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>Tap to view transactions</div>
        </div>

        {/* Menu */}
        <div className="glass-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          {menuItems.map((item, i) => (
            <Link key={item.label} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px',
              borderBottom: i < menuItems.length - 1 ? '1px solid var(--border-color)' : 'none',
              textDecoration: 'none', color: 'var(--foreground)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'rgba(139,92,246,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary-light)',
              }}>
                <item.icon size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{item.label}</div>
                {item.subtitle && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{item.subtitle}</div>}
              </div>
              <ChevronRight size={16} color="var(--muted)" />
            </Link>
          ))}
        </div>

        <button onClick={handleLogout} className="btn-danger" style={{ width: '100%', padding: 14 }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
