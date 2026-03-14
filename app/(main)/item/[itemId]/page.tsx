"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { getDocument, addDocument, updateDocument, queryDocuments, where } from "@/lib/firebase/db";
import { getUserLocation, calculateDistance, formatDistance } from "@/lib/utils/location";
import { useToast } from "@/components/shared/Toast";
import { Item, CURRENCY_SYMBOL } from "@/types";
import { ArrowLeft, Heart, Share2, MapPin, MessageCircle, ShoppingCart, Flag, Star, Truck, Tag, Clock } from "lucide-react";

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile, updateProfile } = useAuthStore();
  const { showToast } = useToast();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [distance, setDistance] = useState("");

  useEffect(() => {
    async function load() {
      const itemId = params.itemId as string;
      const data = await getDocument<Item>("items", itemId);
      setItem(data);
      setLoading(false);
      if (data?.location) {
        try {
          const loc = await getUserLocation();
          setDistance(formatDistance(calculateDistance(loc.lat, loc.lng, data.location.lat, data.location.lng)));
        } catch { setDistance(""); }
      }
    }
    load();
  }, [params.itemId]);

  async function handleReserve() {
    if (!user || !item || !profile) return;
    if (item.sellerId === user.uid) { showToast("You can't reserve your own item", "warning"); return; }
    if (item.status !== "available") { showToast("This item is not available", "warning"); return; }

    const advanceCost = Math.ceil(item.price * 0.05);
    if ((profile.credits ?? 0) < advanceCost) {
      showToast("Insufficient credits", "error"); return;
    }

    setReserving(true);
    try {
      await addDocument("reservations", {
        itemId: item.id, buyerId: user.uid, sellerId: item.sellerId,
        advancePaid: advanceCost, status: "reserved",
        itemTitle: item.title, itemImage: item.images?.[0] || "", itemPrice: item.price,
      });
      await updateDocument("items", item.id, { status: "reserved" });
      await updateProfile(user.uid, { credits: (profile.credits ?? 1000) - advanceCost } as any);
      setItem({ ...item, status: "reserved" });
      showToast(`Reserved! ${advanceCost} credits deducted`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to reserve", "error");
    } finally { setReserving(false); }
  }

  async function handleChat() {
    if (!user || !item) return;
    const participants = [user.uid, item.sellerId].sort();
    const existing = await queryDocuments("chats", [
      where("participants", "==", participants), where("itemId", "==", item.id),
    ]);
    if (existing.length > 0) {
      router.push(`/chat?id=${(existing[0] as any).id}`);
    } else {
      const chatId = await addDocument("chats", {
        participants, itemId: item.id, itemTitle: item.title,
        itemImage: item.images?.[0] || "", itemPrice: item.price,
        lastMessage: "", lastUpdated: new Date(), unreadCount: {},
      });
      router.push(`/chat?id=${chatId}`);
    }
  }

  async function handleReport() {
    if (!user || !item || !reportReason.trim()) return;
    await addDocument("reports", {
      reporterId: user.uid, itemId: item.id, sellerId: item.sellerId, reason: reportReason.trim(),
    });
    setShowReport(false); setReportReason("");
    showToast("Report submitted", "success");
  }

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!item) return <div className="container page"><p>Item not found</p></div>;

  return (
    <div className="container page">
      <div className="flex items-center justify-between mb-3">
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: 6 }}><ArrowLeft size={22} /></button>
        <div className="flex gap-2">
          <button className="btn-ghost" style={{ padding: 6 }}><Heart size={22} /></button>
          <button className="btn-ghost" style={{ padding: 6 }}><Share2 size={22} /></button>
        </div>
      </div>

      {/* Images */}
      <div style={{ borderRadius: "var(--radius)", overflow: "hidden", marginBottom: 16 }}>
        <img src={item.images?.[activeImage] || "/placeholder.png"} alt={item.title}
          style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
        {item.images && item.images.length > 1 && (
          <div className="flex gap-2 mt-2" style={{ overflowX: "auto" }}>
            {item.images.map((img, i) => (
              <img key={i} src={img} alt="" onClick={() => setActiveImage(i)}
                style={{ width: 60, height: 60, objectFit: "cover", borderRadius: "var(--radius-sm)",
                  border: i === activeImage ? "2px solid var(--primary)" : "2px solid transparent", cursor: "pointer" }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-center justify-between mb-2">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>{item.title}</h1>
        <span className={`badge badge-${item.status}`}>{item.status}</span>
      </div>

      <div style={{ fontSize: 24, fontWeight: 800, color: "var(--primary)", marginBottom: 8 }}>
        {CURRENCY_SYMBOL}{item.price}
        {item.type === "rent" && <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" }}> /{item.rentType === "hourly" ? "hr" : "day"}</span>}
      </div>

      <div className="flex gap-2 mb-3" style={{ flexWrap: "wrap" }}>
        {item.negotiable && <span className="badge" style={{ background: "#FEF3C7", color: "#92400E" }}><Tag size={10} /> Negotiable</span>}
        {item.deliveryAvailable && <span className="badge" style={{ background: "#DCFCE7", color: "#166534" }}><Truck size={10} /> Delivery</span>}
        {item.type === "rent" && <span className="badge" style={{ background: "#E0E7FF", color: "#3730A3" }}><Clock size={10} /> For Rent</span>}
        {item.condition && <span className={`badge badge-${item.condition}`}>{item.condition}</span>}
      </div>

      <div className="flex items-center gap-2 mb-3" style={{ color: "var(--text-secondary)", fontSize: 14 }}>
        <MapPin size={14} /><span>{item.location?.city || "Unknown"}</span>
        {distance && <span>• {distance}</span>}
      </div>

      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--text-secondary)", marginBottom: 20 }}>{item.description}</p>

      {/* Actions */}
      {user?.uid !== item.sellerId && (
        <div className="flex gap-2 mb-3">
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={handleChat}><MessageCircle size={18} /> Chat</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleReserve} disabled={reserving || item.status !== "available"}>
            <ShoppingCart size={18} /> {reserving ? "Reserving..." : item.status === "available" ? `Reserve (${Math.ceil(item.price * 0.05)} cr)` : item.status}
          </button>
        </div>
      )}

      <button className="btn btn-ghost btn-block text-sm" onClick={() => setShowReport(true)} style={{ color: "var(--danger)" }}>
        <Flag size={14} /> Report this listing
      </button>

      {/* Report Modal */}
      {showReport && (
        <div className="modal-overlay" onClick={() => setShowReport(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Report Listing</h3>
              <button className="btn-ghost" onClick={() => setShowReport(false)} style={{ padding: 4 }}>&times;</button>
            </div>
            <textarea className="input textarea mb-3" placeholder="Why are you reporting this?" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
            <button className="btn btn-danger btn-block" onClick={handleReport}>Submit Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
