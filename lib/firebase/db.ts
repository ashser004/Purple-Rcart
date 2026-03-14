import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  QueryConstraint,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── Generic Helpers ───
export async function getDocument<T>(collectionName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as T;
  }
  return null;
}

export async function setDocument(collectionName: string, docId: string, data: DocumentData) {
  const docRef = doc(db, collectionName, docId);
  await setDoc(docRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function addDocument(collectionName: string, data: DocumentData) {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() });
  return docRef.id;
}

export async function updateDocument(collectionName: string, docId: string, data: DocumentData) {
  const docRef = doc(db, collectionName, docId);
  await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId);
  await deleteDoc(docRef);
}

export async function queryDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

export function subscribeToCollection(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (docs: DocumentData[]) => void
) {
  const colRef = collection(db, collectionName);
  const q = query(colRef, ...constraints);
  return onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(docs);
  });
}

export { collection, doc, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp };
