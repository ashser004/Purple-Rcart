"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { queryDocuments, where } from "@/lib/firebase/db";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import { useToast } from "@/components/shared/Toast";
import { Item, Reservation, CURRENCY_SYMBOL } from "@/types";
import { ArrowLeft, Settings, Star, MapPin, Camera, LogOut, CreditCard, Package, ShoppingBag, X, Check } from "lucide-react";
import { signOut } from "@/lib/firebase/auth";

export default function ProfilePage() {
  const { user, profile, updateProfile, setUser, setProfile } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "orders">("listings");
  const [myItems, setMyItems] = useState<Item[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");

  useEffect(() => {
    if (!user) { router.replace("/login"); return; }
    fetchData();
  }, [user]);

  useEffect(() => {
    setEditName(profile?.name || "");
    setEditCity(profile?.city || "");
  }, [profile]);

  async function fetchData() {
    if (!user) return;
    setLoading(true);
    try {
      const items = await queryDocuments<Item>("items", [where("sellerId", "==", user.uid)]);
      setMyItems(items);
      const reservations = await queryDocuments<Reservation>("reservations", [where("buyerId", "==", user.uid)]);
      setMyReservations(reservations);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadToCloudinary(file, `marketplace-app/users/${user.uid}/profile`);
      await updateProfile(user.uid, { profileImage: url } as any);
      showToast("Profile picture updated!", "success");
    } catch { showToast("Failed to update picture", "error"); }
  }

  async function handleSaveProfile() {
    if (!user) return;
    try {
      await updateProfile(user.uid, { name: editName.trim(), city: editCity.trim() } as any);
      setEditing(false);
      showToast("Profile updated!", "success");
    } catch { showToast("Failed to update", "error"); }
  }

  async function handleLogout() {
    await signOut(); setUser(null); setProfile(null); router.replace("/login");
  }

  if (!profile) return <div className="loading-screen"><div className="spinner" /></div>;

  return (
    <div className="container page">
      <div className="flex items-center justify-between mb-3">
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: 6 }}><ArrowLeft size={22} /></button>
        <h1 className="header-title">Profile</h1>
        <button className="btn-ghost" onClick={() => setEditing(!editing)} style={{ padding: 6 }}>
          {editing ? <X size={22} /> : <Settings size={22} />}
        </button>
      </div>

      <div className="profile-header">
        <div style={{ position: "relative", display: "inline-block" }}>
          {profile.profileImage ? (
            <img className="profile-avatar" src={profile.profileImage} alt={profile.name} />
          ) : (
            <div className="profile-avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "var(--primary)", background: "var(--primary-light)" }}>
              {(profile.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <button onClick={() => fileInputRef.current?.click()} style={{ position: "absolute", bottom: 0, right: 0, background: "var(--primary)", color: "white", border: "3px solid white", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={14} />
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleProfileImageChange} />

        {editing ? (
          <div style={{ marginTop: 12 }}>
            <input className="input mb-2" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" style={{ textAlign: "center" }} />
            <input className="input mb-2" value={editCity} onChange={(e) => setEditCity(e.target.value)} placeholder="Your city" style={{ textAlign: "center" }} />
            <button className="btn btn-primary btn-sm" onClick={handleSaveProfile}><Check size={16} /> Save</button>
          </div>
        ) : (
          <>
            <h2 className="profile-name">{profile.name || "New User"}</h2>
            <div className="profile-location"><MapPin size={14} /><span>{profile.city || "Set location"}</span></div>
            {profile.rating > 0 && <div className="profile-rating"><Star size={14} fill="var(--warning)" color="var(--warning)" /><span>{profile.rating.toFixed(1)}</span></div>}
          </>
        )}
        <div className="credits-badge mt-2"><CreditCard size={16} />{profile.credits ?? 1000} Credits</div>
        <div className="profile-stats mt-4">
          <div><div className="profile-stat-value">{myItems.length}</div><div>Items</div></div>
          <div><div className="profile-stat-value">{myReservations.length}</div><div>Orders</div></div>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === "listings" ? "active" : ""}`} onClick={() => setActiveTab("listings")}><Package size={16} style={{ marginRight: 6, display: "inline" }} />My Listings</button>
        <button className={`tab ${activeTab === "orders" ? "active" : ""}`} onClick={() => setActiveTab("orders")}><ShoppingBag size={16} style={{ marginRight: 6, display: "inline" }} />My Orders</button>
      </div>

      {loading ? <div className="loading-screen" style={{ minHeight: "20vh" }}><div className="spinner" /></div>
      : activeTab === "listings" ? (
        myItems.length === 0 ? <div className="empty-state"><Package size={40} /><p>No listings yet</p><button className="btn btn-primary mt-2" onClick={() => router.push("/sell")}>List an item</button></div>
        : <div className="items-grid">{myItems.map((item) => (
            <div key={item.id} className="card item-card" onClick={() => router.push(`/item/${item.id}`)}>
              <img className="item-card-image" src={item.images?.[0] || "/placeholder.png"} alt={item.title} />
              <div className="item-card-body">
                <div className="item-card-title">{item.title}</div>
                <div className="item-card-price">{CURRENCY_SYMBOL}{item.price}</div>
                <span className={`badge badge-${item.status}`}>{item.status}</span>
              </div>
            </div>
          ))}</div>
      ) : (
        myReservations.length === 0 ? <div className="empty-state"><ShoppingBag size={40} /><p>No orders yet</p></div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{myReservations.map((res) => (
            <div key={res.id} className="card" style={{ padding: 16 }}>
              <div className="flex items-center gap-3">
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{res.itemTitle || "Item"}</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Advance: {res.advancePaid} credits</div>
                </div>
                <span className={`badge badge-${res.status}`}>{res.status}</span>
              </div>
            </div>
          ))}</div>
      )}

      <button className="btn btn-ghost btn-block mt-4" onClick={handleLogout} style={{ color: "var(--danger)", gap: 8 }}><LogOut size={18} />Logout</button>
    </div>
  );
}
