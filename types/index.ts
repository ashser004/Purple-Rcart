import { Timestamp } from "firebase/firestore";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profileImage: string;
  city: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  credits: number;
  rating: number;
  createdAt: Timestamp;
}

export type ItemType = "sell" | "rent";
export type RentType = "hourly" | "daily";
export type ItemStatus = "available" | "reserved" | "booked" | "sold" | "rented" | "cancelled";
export type ItemCondition = "new" | "like-new" | "excellent" | "good" | "used";

export interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  negotiable: boolean;
  sellerId: string;
  sellerName?: string;
  category: string;
  type: ItemType;
  rentType?: RentType;
  deliveryAvailable: boolean;
  status: ItemStatus;
  condition: ItemCondition;
  location: {
    lat: number;
    lng: number;
    city: string;
  };
  images: string[];
  conditionProofImages?: string[];
  createdAt: Timestamp;
}

export interface Shop {
  id: string;
  shopName: string;
  ownerId: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    city: string;
  };
  rating: number;
  reviewCount: number;
  itemCount: number;
  responseRate: number;
  profileImage: string;
  joinedAt: Timestamp;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  itemId: string;
  itemTitle?: string;
  itemImage?: string;
  itemPrice?: number;
  lastMessage: string;
  lastUpdated: Timestamp;
  unreadCount: Record<string, number>;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  message: string;
  timestamp: Timestamp;
}

export type ReservationStatus = "reserved" | "booked" | "cancelled" | "completed";

export interface Reservation {
  id: string;
  itemId: string;
  buyerId: string;
  sellerId: string;
  advancePaid: number;
  status: ReservationStatus;
  itemTitle?: string;
  itemImage?: string;
  itemPrice?: number;
  createdAt: Timestamp;
}

export interface Report {
  id: string;
  reporterId: string;
  itemId: string;
  sellerId: string;
  reason: string;
  createdAt: Timestamp;
}

export const CATEGORIES = [
  "All",
  "Electronics",
  "Furniture",
  "Clothing",
  "Books",
  "Sports",
  "Instruments",
  "Home & Garden",
  "Vehicles",
  "Other",
] as const;

export const CURRENCY_SYMBOL = "₹";
