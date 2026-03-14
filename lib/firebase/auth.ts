import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth, hasValidConfig } from "./config";

const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  if (!hasValidConfig) {
    console.error("[Auth] Cannot sign in - Firebase not configured");
    throw new Error("Firebase not configured");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("[Auth] Google Sign-in successful:", result.user.email);
    return result.user;
  } catch (error) {
    console.error("[Auth] Google Sign-in error:", error);
    throw error;
  }
}

export async function signOut() {
  if (!hasValidConfig) return;
  try {
    await firebaseSignOut(auth);
    console.log("[Auth] Signed out successfully");
  } catch (error) {
    console.error("[Auth] Sign-out error:", error);
    throw error;
  }
}
