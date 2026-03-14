import {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, query, where, getDocs, addDoc,
  orderBy, limit, onSnapshot, serverTimestamp,
  GeoPoint, Timestamp,
  type DocumentData, type QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';

// ==================== USERS ====================
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  phone: string;
  location: { lat: number; lng: number; address: string };
  wallet: number;
  isSeller: boolean;
  storeName?: string;
  storeDescription?: string;
  storeLocation?: { lat: number; lng: number; address: string };
  fcmToken?: string;
  createdAt: any;
  updatedAt: any;
}

export async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    wallet: 1000,
    isSeller: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid: snap.id, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
}

export async function getAllSellers(): Promise<UserProfile[]> {
  const q = query(collection(db, 'users'), where('isSeller', '==', true));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
}

// ==================== PRODUCTS ====================
export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  type: 'sell' | 'rent';
  rentalPricePerDay?: number;
  rentalDuration?: number;
  status: 'available' | 'sold' | 'rented';
  location: { lat: number; lng: number };
  createdAt: any;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(db, 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', id), data);
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, 'products', id));
}

export async function getProductsBySeller(sellerId: string): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

export async function getAllAvailableProducts(): Promise<Product[]> {
  const q = query(
    collection(db, 'products'),
    where('status', '==', 'available'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
}

// ==================== ORDERS ====================
export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  productTitle: string;
  productImage: string;
  type: 'purchase' | 'rental';
  amount: number;
  status: 'pending' | 'completed' | 'returned';
  qrCode: string;
  returnDate?: any;
  rentalExtended?: boolean;
  createdAt: any;
}

export async function createOrder(data: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'orders'), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getOrder(id: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Order;
}

export async function updateOrder(id: string, data: Partial<Order>): Promise<void> {
  await updateDoc(doc(db, 'orders', id), data);
}

export async function getOrdersByBuyer(buyerId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersBySeller(sellerId: string): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Order));
}

// ==================== REPORTS ====================
export interface Report {
  id: string;
  reporterId: string;
  productId: string;
  sellerId: string;
  reason: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: any;
}

export async function createReport(data: Omit<Report, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'reports'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// ==================== SUBSCRIPTIONS ====================
export async function subscribeToSeller(subscriberId: string, sellerId: string): Promise<void> {
  const id = `${subscriberId}_${sellerId}`;
  await setDoc(doc(db, 'subscriptions', id), {
    subscriberId,
    sellerId,
    createdAt: serverTimestamp(),
  });
}

export async function unsubscribeFromSeller(subscriberId: string, sellerId: string): Promise<void> {
  const id = `${subscriberId}_${sellerId}`;
  await deleteDoc(doc(db, 'subscriptions', id));
}

export async function isSubscribed(subscriberId: string, sellerId: string): Promise<boolean> {
  const id = `${subscriberId}_${sellerId}`;
  const snap = await getDoc(doc(db, 'subscriptions', id));
  return snap.exists();
}

export async function getSubscribers(sellerId: string): Promise<string[]> {
  const q = query(collection(db, 'subscriptions'), where('sellerId', '==', sellerId));
  const snap = await getDocs(q);
  return snap.docs.map(d => d.data().subscriberId);
}

// ==================== NOTIFICATIONS ====================
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'order' | 'rental_reminder' | 'new_product' | 'report';
  read: boolean;
  data?: Record<string, string>;
  createdAt: any;
}

export async function addNotification(data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<void> {
  await addDoc(collection(db, 'notifications'), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(db, 'notifications', id), { read: true });
}
