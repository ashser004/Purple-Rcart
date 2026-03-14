'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAllAvailableProducts, getAllSellers, type Product, type UserProfile } from '@/lib/firestore';
import { getCurrentLocation, filterByDistance, formatDistance, type Coordinates } from '@/lib/location';
import { useRouter } from 'next/navigation';
import { MapPin, List, Map as MapIcon, ExternalLink } from 'lucide-react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

export default function ExplorePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<'map' | 'list'>('map');
  const [sellers, setSellers] = useState<(UserProfile & { distance: number })[]>([]);
  const [products, setProducts] = useState<(Product & { distance: number })[]>([]);
  const [userLoc, setUserLoc] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      let loc: Coordinates;
      try { loc = await getCurrentLocation(); } catch {
        loc = { lat: profile?.location?.lat || 0, lng: profile?.location?.lng || 0 };
      }
      setUserLoc(loc);

      const [allProducts, allSellers] = await Promise.all([
        getAllAvailableProducts(),
        getAllSellers(),
      ]);

      setSellers(filterByDistance(
        allSellers.filter(s => s.uid !== profile?.uid).map(s => ({ ...s, location: s.storeLocation || s.location })),
        loc, 5
      ) as any);
      setProducts(filterByDistance(allProducts, loc, 5));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="top-header">
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Explore</h1>
        <div className="tab-bar" style={{ width: 'auto' }}>
          <button className={`tab-item ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}><MapIcon size={14} /> Map</button>
          <button className={`tab-item ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={14} /> List</button>
        </div>
      </div>
      <div className="page-container">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner spinner-lg" /></div>
        ) : view === 'map' && userLoc ? (
          <div>
            <MapView
              center={userLoc}
              sellers={sellers}
              products={products}
              radiusKm={5}
              onSellerClick={(id) => router.push(`/seller/${id}`)}
              onProductClick={(id) => router.push(`/product/${id}`)}
            />
            <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
              Showing sellers and products within 5km radius
            </p>
          </div>
        ) : (
          <div>
            {sellers.length > 0 && (
              <>
                <h2 className="section-title">Sellers Nearby</h2>
                {sellers.map(s => (
                  <div key={s.uid} className="glass-card" style={{ padding: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => router.push(`/seller/${s.uid}`)}>
                    <img src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.displayName)}&background=7c3aed&color=fff`} alt="" className="avatar" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600 }}>{s.storeName || s.displayName}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDistance(s.distance)}</div>
                    </div>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}`}
                      target="_blank"
                      rel="noopener"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: 'var(--primary-light)' }}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                ))}
              </>
            )}
            {products.length > 0 && (
              <>
                <h2 className="section-title" style={{ marginTop: 20 }}>Products Nearby</h2>
                {products.map(p => (
                  <div key={p.id} className="glass-card" style={{ padding: 12, marginBottom: 10, display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'center' }} onClick={() => router.push(`/product/${p.id}`)}>
                    <img src={p.images?.[0] || 'https://via.placeholder.com/60'} alt="" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                      <div style={{ color: 'var(--primary-light)', fontWeight: 700 }}>₹{p.price}</div>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDistance(p.distance)}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
