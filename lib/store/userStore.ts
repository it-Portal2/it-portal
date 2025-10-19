import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User as FirebaseUser, onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

export type UserRole = "client" | "admin" | "developer" | "subadmin";

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
  isInitialized: boolean;

  setUser: (user: FirebaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  resetAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      isInitialized: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setProfile: (profile) => set({ profile }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setInitialized: (isInitialized) => set({ isInitialized }),

      resetAuth: () =>
        set({
          user: null,
          profile: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

let unsubscribe: (() => void) | null = null;
let tokenUnsubscribe: (() => void) | null = null;
let isInitializing = false;

const initializeAuth = () => {
  if (unsubscribe || isInitializing) return;
  
  isInitializing = true;
  
  unsubscribe = onAuthStateChanged(
    auth,
    async (firebaseUser) => {
      try {
        const { setUser, setProfile, setLoading, setError, setInitialized, resetAuth } = useAuthStore.getState();   
        setLoading(true);
        setError(null);
        
        if (firebaseUser) {
          setUser(firebaseUser);
          
          try {
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
                avatar: userData.avatar || firebaseUser.photoURL || null,
                createdAt: userData.createdAt || Date.now(),
                lastLogin: Date.now(),
              };
              setProfile(profile);
            } else {
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                name: firebaseUser.displayName,
                phone: null,
                role: "client",
                avatar: firebaseUser.photoURL,
                createdAt: Date.now(),
                lastLogin: Date.now(),
              };
              setProfile(newProfile);
            }
          } catch (firestoreError) {
            console.error("Firestore error:", firestoreError);
            const fallbackProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName,
              phone: null,
              role: "client",
              avatar: firebaseUser.photoURL,
              createdAt: Date.now(),
              lastLogin: Date.now(),
            };
            setProfile(fallbackProfile);
          }
        } else {
          resetAuth();
        }
      } catch (error: any) {
        console.error("Error in auth state change:", error);
        useAuthStore.getState().setError("Authentication error occurred");
      } finally {
        useAuthStore.getState().setLoading(false);
        useAuthStore.getState().setInitialized(true);
        isInitializing = false;
      }
    },
    (error) => {
      console.error("Auth state change error:", error);
      useAuthStore.getState().setError("Authentication service error");
      useAuthStore.getState().setLoading(false);
      useAuthStore.getState().setInitialized(true);
      isInitializing = false;
    }
  );

  // Update cookies when token changes (but don't force refresh)
  tokenUnsubscribe = onIdTokenChanged(auth, async (user) => {
    if (user) {
      try {
        // Only refresh token if it's about to expire (within 5 minutes)
        const tokenResult = await user.getIdTokenResult();
        const expirationTime = new Date(tokenResult.expirationTime);
        const now = new Date();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (expirationTime.getTime() - now.getTime() < fiveMinutes) {
          const token = await user.getIdToken(true);
          document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        } else {
          const token = await user.getIdToken(false);
          document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        }
      } catch (error) {
        console.error("Token refresh error:", error);
      }
    } else {
      document.cookie = "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
  });
};

if (typeof window !== "undefined") {
  initializeAuth();
  
  window.addEventListener("beforeunload", () => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    if (tokenUnsubscribe) {
      tokenUnsubscribe();
      tokenUnsubscribe = null;
    }
  });
}
