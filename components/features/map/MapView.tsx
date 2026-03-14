"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Shop, Item } from "@/types";

interface MapViewProps {
  userLocation: { lat: number; lng: number };
  shops: Shop[];
  items: Item[];
  onSelect: (item: Shop | Item) => void;
}

export default function MapView({ userLocation, shops, items, onSelect }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current).setView([userLocation.lat, userLocation.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // User location marker
    const userIcon = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(59,130,246,0.5);"></div>',
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);

    mapInstance.current = map;

    return () => { map.remove(); mapInstance.current = null; };
  }, [userLocation]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    // Clear old markers (keep user marker)
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        const pos = layer.getLatLng();
        if (pos.lat !== userLocation.lat || pos.lng !== userLocation.lng) {
          map.removeLayer(layer);
        }
      }
    });

    // Item markers (blue)
    const itemIcon = L.divIcon({
      html: '<div style="width:14px;height:14px;background:#3B82F6;border:2px solid white;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
      className: "",
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });

    items.forEach((item) => {
      if (!item.location) return;
      L.marker([item.location.lat, item.location.lng], { icon: itemIcon })
        .addTo(map)
        .on("click", () => onSelect(item));
    });

    // Shop markers (red)
    const shopIcon = L.divIcon({
      html: '<div style="width:16px;height:16px;background:#EF4444;border:2px solid white;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>',
      className: "",
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    shops.forEach((shop) => {
      if (!shop.location) return;
      L.marker([shop.location.lat, shop.location.lng], { icon: shopIcon })
        .addTo(map)
        .on("click", () => onSelect(shop));
    });
  }, [shops, items, userLocation, onSelect]);

  return <div ref={mapRef} className="map-container" />;
}
