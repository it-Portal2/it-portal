import { create } from "zustand";
import { User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type UserRole = "client" | "admin" | "developer";

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  phone?: string | null;
  role: UserRole;
  avatar: string | null;
  createdAt: number;
  lastLogin: number;
}

export interface AuthState {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setProfile: (profile) => set({ profile }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  resetAuth: () =>
    set({
      user: null,
      profile: null,
      isAuthenticated: false,
      error: null,
      isLoading: false,
    }),
}));

// Initialize Firebase auth listener
const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
  try {
    useAuthStore.getState().setLoading(true);

    if (firebaseUser) {
      useAuthStore.getState().setUser(firebaseUser);

      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const profile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || userData.name || null,
          phone: userData.phone || null,
          role: userData.role || "client",
          avatar: userData.avatar || null,
          createdAt: userData.createdAt || Date.now(),
          lastLogin: Date.now(),
        };
        useAuthStore.getState().setProfile(profile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          phone: null,
          role: "client",
          avatar: null,
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };
        useAuthStore.getState().setProfile(newProfile);
      }
    } else {
      useAuthStore.getState().resetAuth();
    }
  } catch (error: any) {
    console.error("Error in auth state change:", error);
    useAuthStore.getState().setError(error.message || "Authentication error");
    useAuthStore.getState().setLoading(false);
  }
});

// Cleanup subscription on module unload
if (typeof window !== "undefined") {
  window.addEventListener("unload", () => {
    unsubscribe();
  });
}