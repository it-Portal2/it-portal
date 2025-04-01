import axios from "axios";
import { auth, db } from "@/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { useAuthStore, UserProfile, UserRole } from "../store/userStore";

// Optimization: Set cookie once and avoid multiple token refreshes
const setAuthCookie = async (token: string) => {
  document.cookie = `firebaseToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;
};

const clearAuthCookie = () => {
  document.cookie = `firebaseToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// Optimization: Cache claims operations to prevent redundant calls
const claimsCache = new Map<string, Promise<void>>();

const setCustomClaims = async (uid: string, role: UserRole) => {
  // Return cached operation if already in progress for this user
  if (claimsCache.has(uid)) {
    return claimsCache.get(uid);
  }

  const claimsOperation = new Promise<void>(async (resolve, reject) => {
    try {
      const response = await axios.post(
        "/api/setCustomClaims",
        { uid, role },
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      if (response.status !== 200) {
        throw new Error("Failed to set custom claims");
      }
      resolve();
    } catch (error: any) {
      console.error(
        "Error setting custom claims:",
        error.response?.data || error.message
      );
      reject(new Error(
        error.response?.data?.error || "Failed to set custom claims"
      ));
    } finally {
      // Remove from cache once completed
      claimsCache.delete(uid);
    }
  });

  // Store in cache and return
  claimsCache.set(uid, claimsOperation);
  return claimsOperation;
};

export const signInWithEmail = async (
  email: string,
  password: string,
  role: UserRole
): Promise<UserProfile> => {
  try {
    // Authenticate first
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Get user profile and check role in parallel
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found");

    const userData = userDoc.data() as UserProfile;
    if (userData.role !== role) {
      await signOut(auth);
      throw new Error(`You do not have ${role} permissions`);
    }

    // Update last login and set claims in parallel
    const updates = [
      setDoc(
        doc(db, "users", user.uid),
        { lastLogin: serverTimestamp() },
        { merge: true }
      ),
      setCustomClaims(user.uid, userData.role)
    ];
    
    await Promise.all(updates);
    
    // Get the token once after all operations and set cookie
    const token = await user.getIdToken(true);
    await setAuthCookie(token);

    return userData;
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw new Error(error.message || "Failed to sign in");
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
    clearAuthCookie();
    
    // Also clear cookie server-side
    try {
      await fetch("/api/clearCookie", { method: "POST" });
    } catch (e) {
      console.warn("Failed to clear cookie server-side", e);
    }
    
    useAuthStore.getState().resetAuth();
  } catch (error: any) {
    console.error("Error signing out:", error);
    throw new Error(error.message || "Failed to sign out");
  }
};

export const initializeAuthListener = (): (() => void) => {
  return onAuthStateChanged(auth, async (user) => {
    const { setUser, setProfile, setLoading, setError } =
      useAuthStore.getState();
    setLoading(true);

    try {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setProfile(userData);

          // Check if we need to refresh token
          const tokenResult = await user.getIdTokenResult();
          const hasRoleClaim = tokenResult.claims.role === userData.role;
          
          if (!hasRoleClaim) {
            await setCustomClaims(user.uid, userData.role);
            const refreshedToken = await user.getIdToken(true);
            await setAuthCookie(refreshedToken);
          }
        } else {
          setProfile(null);
          setError("User profile not found");
        }
      } else {
        setUser(null);
        setProfile(null);
        clearAuthCookie();
      }
    } catch (error: any) {
      console.error("Auth listener error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  });
};

// Other functions with similar optimizations
export const createUserAccount = async (
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<UserProfile> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email,
      name,
      phone,
      avatar: null,
      role: "client",
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    // Run these in parallel
    await Promise.all([
      setDoc(doc(db, "users", user.uid), {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      }),
      setCustomClaims(user.uid, userProfile.role)
    ]);

    // Get token once and set cookie
    const token = await user.getIdToken(true);
    await setAuthCookie(token);

    return userProfile;
  } catch (error: any) {
    console.error("Error creating user account:", error);
    throw new Error(error.message || "Failed to create account");
  }
};

export const signInWithGoogle = async (): Promise<UserProfile> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let userProfile: UserProfile;
    let isNewUser = false;

    if (userDoc.exists()) {
      userProfile = userDoc.data() as UserProfile;
      
      // Update last login
      await setDoc(
        userDocRef,
        { lastLogin: serverTimestamp() },
        { merge: true }
      );
    } else {
      isNewUser = true;
      userProfile = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        avatar: user.photoURL || null,
        phone: user.phoneNumber,
        role: "client",
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };

      await setDoc(userDocRef, {
        ...userProfile,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }

    // Set claims
    await setCustomClaims(user.uid, userProfile.role);
    
    // Get token once and set cookie
    const token = await user.getIdToken(true);
    await setAuthCookie(token);

    return userProfile;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
};