"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { queryDocuments, where } from "@/lib/firebase/db";
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/utils/location";
import { Shop, Item, CURRENCY_SYMBOL } from "@/types";
import { ArrowLeft, Search, MapPin, List } from "lucide-react";
import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/features/map/MapView"), { ssr: false });

export default function MapPage() {
  const router = useRouter();
  const [shops, setShops] = useState<Shop[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selected, setSelected] = useState<Shop | Item | null>(null);
  const [filter, setFilter] = useState<"all" | "items" | "shops">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation()
      .then(setUserLocation)
      .catch(() => setUserLocation({ lat: 28.6139, lng: 77.209 }));
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [fetchedShops, fetchedItems] = await Promise.all([
          queryDocuments<Shop>("shops", []),
          queryDocuments<Item>("items", [where("status", "==", "available")]),
        ]);
        setShops(fetchedShops);
        setItems(fetchedItems);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  function getDistance(lat: number, lng: number): string {
    if (!userLocation) return "";
    return formatDistance(calculateDistance(userLocation.lat, userLocation.lng, lat, lng));
  }

  const filters = ["all", "items", "shops", "new", "featured"] as const;

  return (
    <div className="container page" style={{ padding: 0, maxWidth: "100%" }}>
      <div style={{ padding: "12px 16px 0" }}>
        <div className="flex items-center gap-3 mb-3">
          <button className="btn-ghost" onClick={() => router.back()} style={{ padding: 6 }}><ArrowLeft size={22} /></button>
          <h1 className="header-title" style={{ flex: 1, textAlign: "center" }}>Nearby Map</h1>
          <button className="btn-ghost" style={{ padding: 6 }}><List size={22} /></button>
        </div>

        <div className="map-search mb-2">
          <Search size={20} style={{ color: "var(--text-muted)" }} />
          <input placeholder="Search location..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <MapPin size={20} style={{ color: "var(--primary)" }} />
        </div>

        <div className="map-filter-bar mb-2">
          {filters.map((f) => (
            <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f as any)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {userLocation && (
        <MapView
          userLocation={userLocation}
          shops={filter === "items" ? [] : shops}
          items={filter === "shops" ? [] : items}
          onSelect={setSelected}
        />
      )}

      {selected && "shopName" in selected && (
        <div className="chat-item-banner" style={{ margin: "0 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
          <div style={{ width: 50, height: 50, borderRadius: "var(--radius-sm)", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏪</div>
          <div className="chat-item-banner-info">
            <div className="chat-item-banner-title">{(selected as Shop).shopName}</div>
            <div className="chat-item-banner-detail"><MapPin size={10} style={{ display: "inline" }} /> {getDistance((selected as Shop).location.lat, (selected as Shop).location.lng)}</div>
          </div>
          <ArrowLeft size={18} style={{ transform: "rotate(180deg)", color: "var(--text-muted)" }} />
        </div>
      )}

      {selected && "title" in selected && (
        <div className="chat-item-banner" style={{ margin: "0 16px", borderRadius: "var(--radius)", border: "1px solid var(--border)" }} onClick={() => router.push(`/item/${(selected as Item).id}`)}>
          <img src={(selected as Item).images?.[0] || "/placeholder.png"} alt={(selected as Item).title} style={{ width: 50, height: 50, borderRadius: "var(--radius-sm)", objectFit: "cover" }} />
          <div className="chat-item-banner-info">
            <div className="chat-item-banner-title">{(selected as Item).title}</div>
            <div className="chat-item-banner-price">{CURRENCY_SYMBOL}{(selected as Item).price}</div>
            <div className="chat-item-banner-detail"><MapPin size={10} style={{ display: "inline" }} /> {getDistance((selected as Item).location.lat, (selected as Item).location.lng)}</div>
          </div>
          <ArrowLeft size={18} style={{ transform: "rotate(180deg)", color: "var(--text-muted)" }} />
        </div>
      )}
    </div>
  );
}
