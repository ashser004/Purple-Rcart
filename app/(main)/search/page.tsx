"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { queryDocuments, where, orderBy } from "@/lib/firebase/db";
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/utils/location";
import { Item, CATEGORIES, CURRENCY_SYMBOL } from "@/types";
import { Search, MapPin, SlidersHorizontal, ArrowLeft, Map } from "lucide-react";

export default function SearchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<Item[]>([]);
  const [filtered, setFiltered] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 });
  const [maxDistance, setMaxDistance] = useState(50);

  useEffect(() => {
    getUserLocation()
      .then(setUserLocation)
      .catch(() => setUserLocation({ lat: 28.6139, lng: 77.209 }));
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const constraints = [where("status", "==", "available"), orderBy("createdAt", "desc")];
      const fetched = await queryDocuments<Item>("items", constraints);
      setItems(fetched);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    let result = [...items];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q)
      );
    }

    if (activeCategory !== "All") {
      result = result.filter((item) => item.category === activeCategory);
    }

    result = result.filter(
      (item) => item.price >= priceRange.min && item.price <= priceRange.max
    );

    if (userLocation) {
      result = result
        .map((item) => ({
          ...item,
          _distance: item.location
            ? calculateDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
            : 999,
        }))
        .filter((item: any) => item._distance <= maxDistance)
        .sort((a: any, b: any) => a._distance - b._distance);
    }

    setFiltered(result);
  }, [items, searchQuery, activeCategory, priceRange, maxDistance, userLocation]);

  function getDistance(item: Item): string {
    if (!userLocation || !item.location) return "";
    const d = calculateDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng);
    return formatDistance(d);
  }

  return (
    <div className="container page">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: 6 }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="header-title" style={{ flex: 1 }}>Search</h1>
        <button className="btn-ghost" onClick={() => router.push("/map")} style={{ padding: 6 }}>
          <Map size={22} />
        </button>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} />
        <input
          placeholder="Search items, shops..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        <button onClick={() => setShowFilters(!showFilters)} style={{ background: "none", border: "none" }}>
          <SlidersHorizontal size={20} style={{ color: showFilters ? "var(--primary)" : "var(--text-muted)" }} />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          background: "var(--bg-secondary)",
          borderRadius: "var(--radius)",
          padding: 16,
          marginBottom: 16,
          border: "1px solid var(--border)",
        }}>
          <div className="input-group">
            <label>Price Range ({CURRENCY_SYMBOL})</label>
            <div className="flex gap-2">
              <input
                className="input"
                type="number"
                placeholder="Min"
                value={priceRange.min || ""}
                onChange={(e) => setPriceRange((p) => ({ ...p, min: Number(e.target.value) || 0 }))}
              />
              <input
                className="input"
                type="number"
                placeholder="Max"
                value={priceRange.max || ""}
                onChange={(e) => setPriceRange((p) => ({ ...p, max: Number(e.target.value) || 100000 }))}
              />
            </div>
          </div>
          <div className="input-group">
            <label>Max Distance: {maxDistance} km</label>
            <input
              type="range"
              min="1"
              max="100"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              style={{ width: "100%" }}
            />
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="chips mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`chip ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results */}
      <p className="text-sm text-muted mb-3">{filtered.length} results found</p>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: "30vh" }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <Search size={48} />
          <p>No items found</p>
          <p className="text-sm">Try different keywords or adjust filters</p>
        </div>
      ) : (
        <div className="items-grid">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card item-card"
              onClick={() => router.push(`/item/${item.id}`)}
            >
              <img
                className="item-card-image"
                src={item.images?.[0] || "/placeholder.png"}
                alt={item.title}
              />
              <div className="item-card-body">
                <div className="item-card-title">{item.title}</div>
                <div className="item-card-price">
                  {CURRENCY_SYMBOL}{item.price}
                </div>
                {item.condition && (
                  <span className={`badge badge-${item.condition}`} style={{ marginBottom: 4 }}>
                    {item.condition === "like-new" ? "Like New" : item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                  </span>
                )}
                <div className="item-card-distance">
                  <MapPin size={12} />
                  {getDistance(item)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
