'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { Coordinates } from '@/lib/location';
import type { UserProfile, Product } from '@/lib/firestore';
import 'leaflet/dist/leaflet.css';

// Fix default icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const sellerIcon = L.divIcon({
  html: '<div style="width:32px;height:32px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;border:3px solid white;font-size:16px;">🏪</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: '',
});

const productIcon = L.divIcon({
  html: '<div style="width:28px;height:28px;border-radius:50%;background:#22c55e;display:flex;align-items:center;justify-content:center;border:2px solid white;font-size:14px;">📦</div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  className: '',
});

const userIcon = L.divIcon({
  html: '<div style="width:36px;height:36px;border-radius:50%;background:#ef4444;display:flex;align-items:center;justify-content:center;border:3px solid white;font-size:18px;">📍</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  className: '',
});

interface MapViewProps {
  center: Coordinates;
  sellers: (UserProfile & { distance: number })[];
  products: (Product & { distance: number })[];
  radiusKm: number;
  onSellerClick: (id: string) => void;
  onProductClick: (id: string) => void;
}

function FitBounds({ center, radiusKm }: { center: Coordinates; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 14);
  }, [center, radiusKm, map]);
  return null;
}

export default function MapView({ center, sellers, products, radiusKm, onSellerClick, onProductClick }: MapViewProps) {
  return (
    <div className="map-container" style={{ height: 450 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds center={center} radiusKm={radiusKm} />

        {/* Radius circles */}
        <Circle center={[center.lat, center.lng]} radius={radiusKm * 1000} pathOptions={{ color: '#8b5cf6', fillColor: '#8b5cf6', fillOpacity: 0.05, weight: 1 }} />
        <Circle center={[center.lat, center.lng]} radius={2000} pathOptions={{ color: '#a78bfa', fillColor: '#a78bfa', fillOpacity: 0.08, weight: 1, dashArray: '5,5' }} />

        {/* User marker */}
        <Marker position={[center.lat, center.lng]} icon={userIcon}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Seller markers */}
        {sellers.map(s => (
          <Marker key={s.uid} position={[s.location.lat, s.location.lng]} icon={sellerIcon} eventHandlers={{ click: () => onSellerClick(s.uid) }}>
            <Popup>
              <div style={{ color: '#111', fontWeight: 600 }}>{s.storeName || s.displayName}</div>
              <div style={{ fontSize: 12 }}>{(s.distance).toFixed(1)}km away</div>
            </Popup>
          </Marker>
        ))}

        {/* Product markers */}
        {products.slice(0, 30).map(p => (
          <Marker key={p.id} position={[p.location.lat, p.location.lng]} icon={productIcon} eventHandlers={{ click: () => onProductClick(p.id) }}>
            <Popup>
              <div style={{ color: '#111', fontWeight: 600 }}>{p.title}</div>
              <div style={{ color: '#7c3aed', fontWeight: 700 }}>₹{p.price}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
