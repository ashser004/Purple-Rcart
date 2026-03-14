import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, addDoc, collection, runTransaction, increment, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Server-side Firebase client init
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getDb() {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  return getFirestore(app);
}

export async function POST(request: Request) {
  try {
    const { buyerId, sellerId, productId, amount, productTitle, productImage, type } = await request.json();

    if (!buyerId || !sellerId || !productId || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = getDb();
    
    const result = await runTransaction(db, async (tx) => {
      const buyerRef = doc(db, 'users', buyerId);
      const sellerRef = doc(db, 'users', sellerId);
      const productRef = doc(db, 'products', productId);

      const [buyerSnap, productSnap] = await Promise.all([
        tx.get(buyerRef),
        tx.get(productRef),
      ]);

      if (!buyerSnap.exists()) throw new Error('Buyer not found');
      if (!productSnap.exists()) throw new Error('Product not found');

      const buyerData = buyerSnap.data()!;
      const productData = productSnap.data()!;

      if (productData.status !== 'available') {
        throw new Error('Product is no longer available');
      }
      if (buyerData.wallet < amount) {
        throw new Error('Insufficient balance');
      }

      // Deduct from buyer
      tx.update(buyerRef, { wallet: buyerData.wallet - amount });
      // Credit seller
      const sellerSnap = await tx.get(sellerRef);
      const sellerWallet = sellerSnap.data()?.wallet || 0;
      tx.update(sellerRef, { wallet: sellerWallet + amount });
      // Mark product
      tx.update(productRef, { status: type === 'rental' ? 'rented' : 'sold' });

      return { success: true };
    });

    // Create order
    const qrCode = `RCART-${productId}-${Date.now()}`;
    const orderRef = await addDoc(collection(db, 'orders'), {
      buyerId,
      sellerId,
      productId,
      productTitle: productTitle || '',
      productImage: productImage || '',
      type: type || 'purchase',
      amount,
      status: 'pending',
      qrCode,
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true, orderId: orderRef.id, qrCode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
