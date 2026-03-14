'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getAllAvailableProducts, getAllSellers, type Product, type UserProfile } from '@/lib/firestore';
import { getCurrentLocation, filterByDistance, formatDistance, type Coordinates } from '@/lib/location';
import { Search, Bell, MapPin, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Electronics', 'Books', 'Clothing', 'Furniture', 'Sports', 'Stationery', 'Food', 'Services', 'Other'];

export default function HomePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<(Product & { distance: number })[]>([]);
  const [sellers, setSellers] = useState<(UserProfile & { distance: number })[]>([]);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userLoc, setUserLoc] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(5);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      let loc: Coordinates;
      try {
        loc = await getCurrentLocation();
      } catch {
        loc = { lat: profile?.location?.lat || 0, lng: profile?.location?.lng || 0 };
      }
      setUserLoc(loc);

      const [allProducts, allSellers] = await Promise.all([
        getAllAvailableProducts(),
        getAllSellers(),
      ]);

      const nearbyProducts = filterByDistance(allProducts, loc, radius);
      setProducts(nearbyProducts);

      const nearbySellers = filterByDistance(
        allSellers.filter(s => s.uid !== profile?.uid).map(s => ({
          ...s,
          location: s.storeLocation || s.location,
        })),
        loc,
        radius
      );
      setSellers(nearbySellers as any);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCat = category === 'All' || p.category === category;
    const matchSearch = !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="top-header">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Radius Cart</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)', fontSize: 12 }}>
            <MapPin size={12} />
            <span>{profile?.location?.address?.split(',')[0] || 'Unknown'}</span>
            <span style={{ color: 'var(--primary-light)', fontWeight: 600 }}>· {radius}km</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/notifications" style={{
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--surface)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--foreground)', textDecoration: 'none',
          }}>
            <Bell size={18} />
          </Link>
        </div>
      </div>

      <div className="page-container">
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 40 }}
            placeholder="Search products..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Categories */}
        <div className="scroll-row" style={{ marginBottom: 24 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} className={`chip ${category === cat ? 'active' : ''}`} onClick={() => setCategory(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Nearby Sellers */}
        {sellers.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 className="section-title" style={{ margin: 0 }}>Nearby Sellers</h2>
              <Link href="/explore" style={{ color: 'var(--primary-light)', fontSize: 13, textDecoration: 'none' }}>See all →</Link>
            </div>
            <div className="scroll-row">
              {sellers.slice(0, 10).map(seller => (
                <div key={seller.uid} className="seller-card" onClick={() => router.push(`/seller/${seller.uid}`)}>
                  <img
                    src={seller.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.displayName)}&background=7c3aed&color=fff`}
                    alt=""
                    className="avatar-lg"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{seller.storeName || seller.displayName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{formatDistance(seller.distance)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        <div style={{ marginBottom: 16 }}>
          <h2 className="section-title">
            {category === 'All' ? 'Nearby Products' : category}
            <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
              {filteredProducts.length} items
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="product-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="product-card">
                <div className="skeleton" style={{ height: 180 }} />
                <div style={{ padding: 14 }}>
                  <div className="skeleton" style={{ height: 16, marginBottom: 8, width: '80%' }} />
                  <div className="skeleton" style={{ height: 20, width: '40%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <MapPin size={48} />
            <h3>No products nearby</h3>
            <p>Try increasing your radius or changing the category</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card" onClick={() => router.push(`/product/${product.id}`)} style={{ position: 'relative' }}>
                <img
                  src={product.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                  alt={product.title}
                  className="product-card-image"
                />
                <div className="product-card-badge">
                  <span className={`badge ${product.type === 'rent' ? 'badge-warning' : 'badge-primary'}`}>
                    {product.type === 'rent' ? 'Rent' : 'Buy'}
                  </span>
                </div>
                <div className="product-card-body">
                  <div className="product-card-title">{product.title}</div>
                  <div className="product-card-price">
                    ₹{product.price}
                    {product.type === 'rent' && <span style={{ fontSize: 12, fontWeight: 400 }}>/day</span>}
                  </div>
                  <div className="product-card-distance">
                    <MapPin size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
                    {formatDistance(product.distance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
