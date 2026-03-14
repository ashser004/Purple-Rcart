"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/firebase/auth";
import { getDocument } from "@/lib/firebase/db";
import { useAuthStore } from "@/lib/store/authStore";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { createProfile, fetchProfile } = useAuthStore();

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    console.log("[Login] Starting Google Sign-in flow...");
    try {
      const user = await signInWithGoogle();
      console.log("[Login] Auth successful, fetching profile for:", user.uid);
      const existingProfile = await getDocument("users", user.uid);
      if (existingProfile) {
        console.log("[Login] Existing profile found, fetching...");
        await fetchProfile(user.uid);
      } else {
        console.log("[Login] No profile found, creating new profile for:", user.displayName);
        await createProfile(user.uid, {
          name: user.displayName || "",
          email: user.email || "",
          profileImage: user.photoURL || "",
        });
      }
      console.log("[Login] Sign-in flow complete, redirecting to /feed");
      router.replace("/feed");
    } catch (err: any) {
      console.error("[Login] Error during sign-in flow:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in cancelled. Please try again.");
      } else {
        setError(err.message || "Failed to sign in");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-logo">RadiusCart</div>
      <p className="login-subtitle">Buy, sell & rent locally</p>

      <div className="login-form">
        {error && (
          <div style={{
            background: "#FEE2E2",
            color: "#991B1B",
            padding: "10px 16px",
            borderRadius: "var(--radius)",
            fontSize: "13px",
            marginBottom: "16px",
          }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-block btn-lg"
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            background: "white",
            color: "#1F2937",
            border: "1.5px solid var(--border)",
            fontWeight: 600,
            gap: 12,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
      </div>

      <p style={{ marginTop: 32, fontSize: 12, color: "var(--text-muted)", maxWidth: 280 }}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
