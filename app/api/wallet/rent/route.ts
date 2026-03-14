import { NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, addDoc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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
    const { buyerId, sellerId, productId, pricePerDay, days, productTitle, productImage, returnDate } = await request.json();
    const amount = pricePerDay * days;

    const db = getDb();

    await runTransaction(db, async (tx) => {
      const buyerRef = doc(db, 'users', buyerId);
      const sellerRef = doc(db, 'users', sellerId);
      const productRef = doc(db, 'products', productId);

      const [buyerSnap, productSnap, sellerSnap] = await Promise.all([
        tx.get(buyerRef),
        tx.get(productRef),
        tx.get(sellerRef),
      ]);

      if (!buyerSnap.exists()) throw new Error('Buyer not found');
      if (!productSnap.exists()) throw new Error('Product not found');

      const buyerData = buyerSnap.data()!;
      const productData = productSnap.data()!;

      if (productData.status !== 'available') throw new Error('Product not available');
      if (buyerData.wallet < amount) throw new Error('Insufficient balance');

      tx.update(buyerRef, { wallet: buyerData.wallet - amount });
      tx.update(sellerRef, { wallet: (sellerSnap.data()?.wallet || 0) + amount });
      tx.update(productRef, { status: 'rented' });
    });

    const qrCode = `RCART-RENT-${productId}-${Date.now()}`;
    const orderRef = await addDoc(collection(db, 'orders'), {
      buyerId,
      sellerId,
      productId,
      productTitle: productTitle || '',
      productImage: productImage || '',
      type: 'rental',
      amount,
      status: 'pending',
      qrCode,
      returnDate: new Date(returnDate),
      createdAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      orderId: orderRef.id,
      qrCode,
      amount,
      returnDate,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
