"use client";

import { create } from "zustand";
import { User } from "firebase/auth";
import { UserProfile } from "@/types";
import { hasValidConfig } from "@/lib/firebase/config";

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (uid: string) => Promise<void>;
  createProfile: (uid: string, googleData: { name: string; email: string; profileImage: string }) => Promise<void>;
  updateProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (uid: string) => {
    const { getDocument } = await import("@/lib/firebase/db");
    const profile = await getDocument<UserProfile>("users", uid);
    set({ profile });
  },

  createProfile: async (uid: string, googleData: { name: string; email: string; profileImage: string }) => {
    const { setDocument, serverTimestamp, getDocument } = await import("@/lib/firebase/db");
    const newProfile = {
      name: googleData.name,
      email: googleData.email,
      profileImage: googleData.profileImage,
      city: "",
      coordinates: { lat: 0, lng: 0 },
      credits: 1000,
      rating: 0,
      createdAt: serverTimestamp(),
    };
    await setDocument("users", uid, newProfile);
    const profile = await getDocument<UserProfile>("users", uid);
    set({ profile });
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    const { setDocument, getDocument } = await import("@/lib/firebase/db");
    await setDocument("users", uid, data as any);
    const profile = await getDocument<UserProfile>("users", uid);
    set({ profile });
  },
}));

// Auth state listener - only set up on client with valid config
if (typeof window !== "undefined" && hasValidConfig) {
  import("firebase/auth").then(({ onAuthStateChanged }) => {
    import("@/lib/firebase/config").then(({ auth }) => {
      onAuthStateChanged(auth, async (user) => {
        console.log("[AuthStore] Auth state changed, user:", user?.email || "none");
        const store = useAuthStore.getState();
        store.setUser(user);
        if (user) {
          console.log("[AuthStore] Fetching profile for:", user.uid);
          await store.fetchProfile(user.uid);
        } else {
          store.setProfile(null);
        }
        store.setLoading(false);
      });
    });
  });
} else if (typeof window !== "undefined") {
  console.warn("[AuthStore] Skipping auth listener - invalid config or SSR");
  setTimeout(() => {
    useAuthStore.getState().setLoading(false);
  }, 100);
}
