// Updated useAuth hook - Fixed token handling
import { useState, useCallback } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { useAuthStore, UserRole, UserProfile } from "@/lib/store/userStore";
import { useRouter } from "next/navigation";
import { setAuthCookie, clearAuthCookie } from "@/lib/auth-cookie";

export const useAuth = () => {
  const router = useRouter();
  const { setError, resetAuth, setLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const setCustomClaims = async (uid: string, role: UserRole) => {
    try {
      // Send the caller's ID token so the API can authenticate + authorize the
      // request (prevents anyone from granting themselves an elevated role).
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch("/api/setCustomClaims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ uid, role }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to set custom claims");
      }
      return await response.json();
    } catch (error) {
      console.error("Error setting custom claims:", error);
      throw error;
    }
  };

  const signUp = useCallback(
    async (email: string, password: string, name: string, phone: string) => {
      if (isProcessing) return false;
      
      setIsProcessing(true);
      setLoading(true);
      setError(null);

      try {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });

        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          name,
          phone,
          role: "client",
          avatar: null,
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };

        await setDoc(doc(db, "users", user.uid), userProfile);

        // Set the role custom claim and WAIT, so the refreshed token carries it
        // and middleware can skip its Firestore fallback on the first navigation.
        // A claim failure shouldn't block signup — the fallback still covers it.
        try {
          await setCustomClaims(user.uid, "client");
        } catch (claimErr) {
          console.error("setCustomClaims failed (continuing):", claimErr);
        }

        // Force a refresh so the token includes the freshly-set role claim,
        // then store it as the httpOnly cookie (server-side).
        const token = await user.getIdToken(true);
        await setAuthCookie(token);

        router.replace("/client");
        return true;
      } catch (error: any) {
        console.error("Signup error:", error);
        setError(error.message || "Failed to create account");
        return false;
      } finally {
        setIsProcessing(false);
        setLoading(false);
      }
    },
    [isProcessing, setError, setLoading, router]
  );

  const login = useCallback(
    async (email: string, password: string, expectedRole: UserRole) => {
      if (isProcessing) return false;
      
      setIsProcessing(true);
      setLoading(true);
      setError(null);

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          throw new Error("User profile not found");
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        if (expectedRole === "admin") {
          if (!["admin", "subadmin"].includes(userRole)) {
            throw new Error("Access denied. Admin or Subadmin privileges required.");
          }
        } else if (userRole !== expectedRole) {
          throw new Error(`Access denied. ${expectedRole} privileges required.`);
        }

        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Date.now(),
        });

        const token = await user.getIdToken(true);
        await setAuthCookie(token);

        let redirectPath = "/";
        if (userRole === "admin" || userRole === "subadmin") {
          redirectPath = "/admin";
        } else if (userRole === "developer") {
          redirectPath = "/developer";
        } else if (userRole === "client") {
          redirectPath = "/client";
        }

        router.replace(redirectPath);
        return true;
      } catch (error: any) {
        console.error("Login error:", error);
        setError(error.message || "Failed to login");
        return false;
      } finally {
        setIsProcessing(false);
        setLoading(false);
      }
    },
    [isProcessing, setError, setLoading, router]
  );

  const googleLogin = useCallback(async () => {
    if (isProcessing) return false;
    
    setIsProcessing(true);
    setLoading(true);
    setError(null);

    try {
      console.log("Starting Google sign-in...");

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log("Google sign-in successful, checking user document...");

      const userDoc = await getDoc(doc(db, "users", user.uid));
      let userRole: UserRole = "client";
      let isNewUser = false;
      
      if (!userDoc.exists()) {
        isNewUser = true;
        console.log("New user detected, creating profile...");
        
        const userProfile: UserProfile = {
          uid: user.uid,
          email: user.email,
          name: user.displayName,
          phone: null,
          role: "client",
          avatar: user.photoURL,
          createdAt: Date.now(),
          lastLogin: Date.now(),
        };

        await setDoc(doc(db, "users", user.uid), userProfile);
        userRole = "client";
      } else {
        console.log("Existing user detected, updating last login...");
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Date.now(),
        });
        userRole = userDoc.data().role as UserRole;
      }

      // For brand-new Google users, set the role claim and WAIT so the refreshed
      // token carries it (middleware then skips its Firestore fallback).
      if (isNewUser) {
        console.log("Setting custom claims for new Google user...");
        try {
          await setCustomClaims(user.uid, userRole);
        } catch (claimErr) {
          console.error("setCustomClaims failed (continuing):", claimErr);
        }
      }

      // Force a refresh only for new users (to pick up the freshly-set claim),
      // then store the token as the httpOnly cookie (server-side).
      const token = await user.getIdToken(isNewUser);
      await setAuthCookie(token);

      console.log("Redirecting to client dashboard...");
      router.replace("/client");
      return true;
      
    } catch (error: any) {
      console.error("Google login error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setError("Sign-in was cancelled");
      } else if (error.code === 'auth/popup-blocked') {
        setError("Popup was blocked by browser. Please allow popups and try again.");
      } else if (error.code === 'auth/network-request-failed') {
        setError("Network error. Please check your connection and try again.");
      } else {
        setError(error.message || "Failed to login with Google");
      }
      return false;
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  }, [isProcessing, setError, setLoading, router]);

  const logout = useCallback(async () => {
    // Flag so the auth page shows a single "logged out" toast on arrival.
    try {
      sessionStorage.setItem("loggedOut", "1");
    } catch {}
    // Flip auth state — the in-app auth gate (Layout) immediately swaps the
    // dashboard for the loader and performs the single navigation to "/".
    // (No window.location redirect here: doing both caused a double refresh.)
    resetAuth();
    try {
      await signOut(auth);
      // Clear the httpOnly cookie server-side + drop persisted client state.
      await clearAuthCookie();
      localStorage.removeItem("auth-storage");
    } catch (error: any) {
      console.error("Logout error:", error);
    }
  }, [resetAuth]);

  return {
    signUp,
    login,
    googleLogin,
    logout,
    isLoading: isProcessing,
    error: useAuthStore((state) => state.error),
  };
};
