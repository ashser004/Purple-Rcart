"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { addDocument } from "@/lib/firebase/db";
import { uploadMultipleImages } from "@/lib/cloudinary/upload";
import { getUserLocation } from "@/lib/utils/location";
import { useToast } from "@/components/shared/Toast";
import { CATEGORIES, ItemCondition, CURRENCY_SYMBOL } from "@/types";
import { ArrowLeft, Camera, X, MapPin } from "lucide-react";

export default function SellPage() {
  const { user, profile } = useAuthStore();
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<ItemCondition>("like-new");
  const [type, setType] = useState<"sell" | "rent">("sell");
  const [rentType, setRentType] = useState<"hourly" | "daily">("daily");
  const [negotiable, setNegotiable] = useState(false);
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [city, setCity] = useState(profile?.city || "Your Location");

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      showToast("Maximum 5 images allowed", "warning");
      return;
    }
    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !price || !category) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    if (images.length === 0) {
      showToast("Please add at least one image", "error");
      return;
    }
    if (!user) {
      showToast("Please login first", "error");
      router.push("/login");
      return;
    }

    setLoading(true);
    try {
      let location = { lat: 28.6139, lng: 77.209, city: city };
      try {
        const loc = await getUserLocation();
        location = { ...loc, city: city };
      } catch {
        // Use default location
      }

      // Generate a temp ID for folder path
      const tempId = `item_${Date.now()}`;
      const imageUrls = await uploadMultipleImages(
        images,
        `marketplace-app/items/${tempId}/gallery`,
        {
          sellerId: user.uid,
          category,
          city: location.city,
          type,
          conditionRating: condition,
        }
      );

      const itemData = {
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        negotiable,
        sellerId: user.uid,
        sellerName: profile?.name || "",
        category,
        type,
        rentType: type === "rent" ? rentType : null,
        deliveryAvailable,
        condition,
        status: "available",
        location,
        images: imageUrls,
      };

      await addDocument("items", itemData);
      showToast("Item listed successfully!", "success");
      router.push("/feed");
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to list item", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button className="btn-ghost" onClick={() => router.back()} style={{ padding: 6 }}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="header-title">Sell an Item</h1>
        <button className="btn-ghost text-sm" onClick={() => router.back()}>
          Cancel
        </button>
      </div>

      {/* Image Upload */}
      <div
        className="upload-zone mb-4"
        onClick={() => fileInputRef.current?.click()}
      >
        {previews.length > 0 ? (
          <div className="flex gap-2" style={{ flexWrap: "wrap", justifyContent: "center" }}>
            {previews.map((preview, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={preview}
                  alt={`Preview ${i + 1}`}
                  style={{
                    width: 80,
                    height: 80,
                    objectFit: "cover",
                    borderRadius: "var(--radius-sm)",
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(i);
                  }}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    background: "var(--danger)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: 20,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <>
            <Camera size={40} />
            <p>Add Photos</p>
            <span>Upload up to 5 images</span>
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={handleImageSelect}
      />

      {/* Title */}
      <div className="input-group">
        <label>Title</label>
        <input
          className="input"
          placeholder="What are you selling?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Price */}
      <div className="input-group">
        <label>Price</label>
        <input
          className="input"
          type="number"
          placeholder={`${CURRENCY_SYMBOL} 0.00`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* Type */}
      <div className="input-group">
        <label>Listing Type</label>
        <div className="flex gap-2">
          <button
            className={`chip ${type === "sell" ? "active" : ""}`}
            onClick={() => setType("sell")}
            style={{ flex: 1 }}
          >
            For Sale
          </button>
          <button
            className={`chip ${type === "rent" ? "active" : ""}`}
            onClick={() => setType("rent")}
            style={{ flex: 1 }}
          >
            For Rent
          </button>
        </div>
      </div>

      {/* Rent Type */}
      {type === "rent" && (
        <div className="input-group">
          <label>Rental Period</label>
          <div className="flex gap-2">
            <button
              className={`chip ${rentType === "hourly" ? "active" : ""}`}
              onClick={() => setRentType("hourly")}
              style={{ flex: 1 }}
            >
              Per Hour
            </button>
            <button
              className={`chip ${rentType === "daily" ? "active" : ""}`}
              onClick={() => setRentType("daily")}
              style={{ flex: 1 }}
            >
              Per Day
            </button>
          </div>
        </div>
      )}

      {/* Category */}
      <div className="input-group">
        <label>Category</label>
        <select
          className="input select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Select category</option>
          {CATEGORIES.filter((c) => c !== "All").map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div className="input-group">
        <label>Description</label>
        <textarea
          className="input textarea"
          placeholder="Describe your item's condition, features, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {/* Location */}
      <div className="input-group">
        <label>Pickup Location</label>
        <div className="flex items-center justify-between" style={{
          padding: "12px 16px",
          border: "1.5px solid var(--border)",
          borderRadius: "var(--radius)",
        }}>
          <div className="flex items-center gap-2">
            <MapPin size={18} style={{ color: "var(--primary)" }} />
            <span>{city}</span>
          </div>
          <span
            style={{ color: "var(--primary)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
            onClick={() => {
              const c = prompt("Enter your city:");
              if (c) setCity(c);
            }}
          >
            Change
          </span>
        </div>
      </div>

      {/* Condition */}
      <div className="input-group">
        <label>Condition</label>
        <div className="condition-options">
          {(["new", "like-new", "excellent", "good", "used"] as ItemCondition[]).map((c) => (
            <button
              key={c}
              className={`condition-option ${condition === c ? "active" : ""}`}
              onClick={() => setCondition(c)}
            >
              {c === "like-new" ? "Like New" : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Options */}
      <div className="input-group">
        <div className="flex items-center justify-between" style={{ padding: "8px 0" }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Price is negotiable</span>
          <input
            type="checkbox"
            checked={negotiable}
            onChange={(e) => setNegotiable(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "var(--primary)" }}
          />
        </div>
        <div className="flex items-center justify-between" style={{ padding: "8px 0" }}>
          <span style={{ fontWeight: 500, fontSize: 14 }}>Home delivery available</span>
          <input
            type="checkbox"
            checked={deliveryAvailable}
            onChange={(e) => setDeliveryAvailable(e.target.checked)}
            style={{ width: 20, height: 20, accentColor: "var(--primary)" }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        className="btn btn-primary btn-block btn-lg mt-4"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "Publishing..." : "Publish Listing"}
      </button>
    </div>
  );
}
