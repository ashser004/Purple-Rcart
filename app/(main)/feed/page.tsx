"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { queryDocuments, where, orderBy, limit } from "@/lib/firebase/db";
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/utils/location";
import { Item, CATEGORIES, CURRENCY_SYMBOL } from "@/types";
import { MapPin, Bell, Search, ChevronDown } from "lucide-react";

export default function FeedPage() {
  const { user, profile, loading: authLoading } = useAuthStore();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState(profile?.city || "Your Location");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const constraints = [where("status", "==", "available"), orderBy("createdAt", "desc"), limit(20)];
      let fetched = await queryDocuments<Item>("items", constraints);

      if (activeCategory !== "All") {
        fetched = fetched.filter((item) => item.category === activeCategory);
      }

      if (userLocation) {
        fetched = fetched
          .map((item) => ({
            ...item,
            _distance: item.location
              ? calculateDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng)
              : 999,
          }))
          .sort((a: any, b: any) => a._distance - b._distance);
      }

      setItems(fetched);
    } catch (err) {
      console.error("Failed to fetch items:", err);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, userLocation]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
      return;
    }
    getUserLocation()
      .then((loc) => {
        setUserLocation(loc);
        setCity(profile?.city || "Your Location");
      })
      .catch(() => {
        setUserLocation({ lat: 28.6139, lng: 77.209 });
        setCity("Delhi");
      });
  }, [authLoading, user, router, profile]);

  useEffect(() => {
    if (userLocation) {
      fetchItems();
    }
  }, [userLocation, fetchItems]);

  function getDistance(item: Item): string {
    if (!userLocation || !item.location) return "";
    const d = calculateDistance(userLocation.lat, userLocation.lng, item.location.lat, item.location.lng);
    return formatDistance(d);
  }

  if (authLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="container page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="header-location" onClick={() => {}}>
          <MapPin size={18} />
          <span>{city}</span>
          <ChevronDown size={14} />
        </div>
        <button className="btn-ghost" style={{ padding: 8, borderRadius: "50%" }}>
          <Bell size={22} />
        </button>
      </div>

      {/* Search */}
      <div
        className="search-bar"
        onClick={() => router.push("/search")}
        style={{ cursor: "pointer" }}
      >
        <Search size={20} />
        <input placeholder="Search for items..." readOnly />
      </div>

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

      {/* Nearby Items */}
      <div className="section-header">
        <h2 className="section-title">Nearby Items</h2>
        <span className="section-link" onClick={() => router.push("/search")}>
          See all
        </span>
      </div>

      {loading ? (
        <div className="loading-screen" style={{ minHeight: "30vh" }}>
          <div className="spinner" />
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <p>No items found nearby</p>
          <p className="text-sm">Be the first to list something!</p>
          <button className="btn btn-primary mt-4" onClick={() => router.push("/sell")}>
            Sell an Item
          </button>
        </div>
      ) : (
        <>
          <div className="items-grid mb-4">
            {items.slice(0, 4).map((item) => (
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
                  <div className="item-card-distance">
                    <MapPin size={12} />
                    {getDistance(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recommended */}
          {items.length > 4 && (
            <>
              <div className="section-header mt-4">
                <h2 className="section-title">Recommended for You</h2>
              </div>
              <div className="items-grid">
                {items.slice(4).map((item) => (
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
                      <div className="item-card-distance">
                        <MapPin size={12} />
                        {getDistance(item)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
