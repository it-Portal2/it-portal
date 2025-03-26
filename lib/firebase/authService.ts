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

const setAuthCookie = (token: string) => {
  // console.log("Setting firebaseToken cookie client-side:", token);
  document.cookie = `firebaseToken=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`;
};

const clearAuthCookie = () => {
  // console.log("Attempting to clear firebaseToken cookie");
  document.cookie = `firebaseToken=; Path=/; HttpOnly; Secure; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("firebaseToken="));
  //  console.log("Cookie after clear attempt (client-side):", cookie || "No firebaseToken cookie visible");
};

const setCustomClaims = async (uid: string, role: UserRole) => {
  try {
    console.log("Setting custom claims for UID:", uid, "with role:", role);
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
    console.log("Custom claims set successfully");
  } catch (error: any) {
    console.error(
      "Error setting custom claims:",
      error.response?.data || error.message
    );
    throw new Error(
      error.response?.data?.error || "Failed to set custom claims"
    );
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
  role: UserRole
): Promise<UserProfile> => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;
    const token = await user.getIdToken();
  //  console.log("Initial token generated:", token);
    setAuthCookie(token);

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User profile not found");

    const userData = userDoc.data() as UserProfile;
    if (userData.role !== role) {
      await signOut(auth);
      clearAuthCookie();
      throw new Error(`You do not have ${role} permissions`);
    }

    await setDoc(
      doc(db, "users", user.uid),
      { lastLogin: serverTimestamp() },
      { merge: true }
    );

    await setCustomClaims(user.uid, userData.role);
    const refreshedToken = await user.getIdToken(true);
 //   console.log("Refreshed token after custom claims:", refreshedToken);
    setAuthCookie(refreshedToken);

    console.log("Sign-in completed for user:", user.uid);
    return userData;
  } catch (error: any) {
    console.error("Error signing in:", error);
    throw new Error(error.message || "Failed to sign in");
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    console.log("Signing out from Firebase Auth...");
    await signOut(auth);
    clearAuthCookie();
    console.log("LogoutUser completed, cookie cleared");
    useAuthStore.getState().resetAuth();
    console.log("Firebase auth.currentUser after signOut:", auth.currentUser);
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

    console.log("Auth state changed, user:", user ? user.uid : "null");

    if (user) {
      setUser(user);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);

        const tokenResult = await user.getIdTokenResult();
        const hasRoleClaim = tokenResult.claims.role === userData.role;
        if (!hasRoleClaim) {
          await setCustomClaims(user.uid, userData.role);
          const refreshedToken = await user.getIdToken(true);
          console.log(
            "Setting token due to missing role claim:",
            refreshedToken
          );
          setAuthCookie(refreshedToken);
        } else {
          console.log("Role claim exists, not resetting cookie");
        }
      } else {
        setProfile(null);
        setError("User profile not found");
      }
    } else {
      console.log("No user, clearing auth state and cookie");
      setUser(null);
      setProfile(null);
      clearAuthCookie();
    }

    setLoading(false);
  });
};

// Other functions unchanged
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
    const token = await user.getIdToken();
    setAuthCookie(token);

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

    await setDoc(doc(db, "users", user.uid), {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    await setCustomClaims(user.uid, userProfile.role);
    const refreshedToken = await user.getIdToken(true);
    setAuthCookie(refreshedToken);

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
    const token = await user.getIdToken();
    setAuthCookie(token);

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as UserProfile;
      await setDoc(
        userDocRef,
        { lastLogin: serverTimestamp() },
        { merge: true }
      );

      await setCustomClaims(user.uid, userData.role);
      const refreshedToken = await user.getIdToken(true);
      setAuthCookie(refreshedToken);

      return userData;
    }

    const userProfile: UserProfile = {
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

    await setCustomClaims(user.uid, userProfile.role);
    const refreshedToken = await user.getIdToken(true);
    setAuthCookie(refreshedToken);

    return userProfile;
  } catch (error: any) {
    console.error("Error signing in with Google:", error);
    throw new Error(error.message || "Failed to sign in with Google");
  }
};
