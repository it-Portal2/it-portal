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

export const useAuth = () => {
  const router = useRouter();
  const { setError, resetAuth, setLoading } = useAuthStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const setCustomClaims = async (uid: string, role: UserRole) => {
    try {
      const response = await fetch("/api/setCustomClaims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

        // Set custom claims but don't wait for token refresh
        setCustomClaims(user.uid, "client").catch(console.error);
        
        // Get current token without forcing refresh
        const token = await user.getIdToken(false);
        document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

        router.push("/client");
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
        document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

        let redirectPath = "/";
        if (userRole === "admin" || userRole === "subadmin") {
          redirectPath = "/admin";
        } else if (userRole === "developer") {
          redirectPath = "/developer";
        } else if (userRole === "client") {
          redirectPath = "/client";
        }

        router.push(redirectPath);
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

      // Set custom claims in background (don't wait)
      if (isNewUser) {
        console.log("Setting custom claims for new Google user...");
        setCustomClaims(user.uid, userRole).catch(console.error);
      }

      // Get token without forcing refresh to avoid expiration issues
      const token = await user.getIdToken(false);
      console.log("Got token for user");

      document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      console.log("Redirecting to client dashboard...");
      router.push("/client");
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
    try {
      await signOut(auth);
      
      document.cookie = "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      localStorage.removeItem("auth-storage");
      
      resetAuth();
      router.push("/");
    } catch (error: any) {
      console.error("Logout error:", error);
      setError(error.message || "Failed to logout");
    }
  }, [resetAuth, router, setError]);

  return {
    signUp,
    login,
    googleLogin,
    logout,
    isLoading: isProcessing,
    error: useAuthStore((state) => state.error),
  };
};
