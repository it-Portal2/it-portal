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

  const signUp = useCallback(
    async (email: string, password: string, name: string, phone: string) => {
      if (isProcessing) return false;
      
      setIsProcessing(true);
      setLoading(true);
      setError(null);

      try {
        // Validate input
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long");
        }

        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with name
        await updateProfile(user, { displayName: name });

        // Create user document in Firestore
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

        // Set auth cookie
        const token = await user.getIdToken(true);
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
        console.log(`Attempting login for role: ${expectedRole}`);
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

      ///  console.log("User signed in, forcing token refresh...");
        // Force token refresh to get updated claims
        await user.getIdToken(true);

        // Get user document from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          throw new Error("User profile not found");
        }

        const userData = userDoc.data();
        const userRole = userData.role;

        //console.log(`User role: ${userRole}, Expected: ${expectedRole}`);

        // Check role permissions
        if (expectedRole === "admin") {
          // Allow both admin and subadmin to access admin panel
          if (!["admin", "subadmin"].includes(userRole)) {
            throw new Error("Access denied. Admin or Subadmin privileges required.");
          }
        } else if (userRole !== expectedRole) {
          throw new Error(`Access denied. ${expectedRole} privileges required.`);
        }

        // Update last login
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Date.now(),
        });

        // Set auth cookie with fresh token
        const token = await user.getIdToken(true);
        document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
       // console.log("Fresh token set in cookie");

        // Redirect based on actual user role (not expected role)
        let redirectPath = "/";
        if (userRole === "admin" || userRole === "subadmin") {
          redirectPath = "/admin";
        } else if (userRole === "developer") {
          redirectPath = "/developer";
        } else if (userRole === "client") {
          redirectPath = "/client";
        }

     //   console.log(`Redirecting to: ${redirectPath}`);
        await router.push(redirectPath);
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
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document for Google sign-in
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
      } else {
        // Update last login
        await updateDoc(doc(db, "users", user.uid), {
          lastLogin: Date.now(),
        });
      }

      // Set auth cookie
      const token = await user.getIdToken(true);
      document.cookie = `firebaseToken=${token}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;

      router.push("/client");
      return true;
    } catch (error: any) {
      console.error("Google login error:", error);
      setError(error.message || "Failed to login with Google");
      return false;
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  }, [isProcessing, setError, setLoading, router]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      
      // Clear auth cookie
      document.cookie = "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear local storage
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
