import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createUserAccount,
  signInWithEmail,
  signInWithGoogle,
  logoutUser,
  initializeAuthListener,
} from "../firebase/authService";
import { useAuthStore, UserRole } from "../store/userStore";
import { auth } from "@/firebase";

export const useAuth = () => {
  const router = useRouter();
  const { user, profile, isLoading, isAuthenticated, error, setError, setLoading } =
    useAuthStore();

  useEffect(() => {
    console.log("Initializing auth listener...");
    const unsubscribe = initializeAuthListener();
    return () => {
      console.log("Cleaning up auth listener...");
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login with:", { email, role });
      const userProfile = await signInWithEmail(email, password, role);
      console.log("Login successful, userProfile:", userProfile);

      let redirectPath: string;
      switch (role) {
        case "client":
          redirectPath = "/client";
          break;
        case "admin":
          redirectPath = "/admin";
          break;
        case "developer":
          redirectPath = "/developer";
          break;
        default:
          console.log("Unknown role, defaulting to /");
          redirectPath = "/";
      }

      const currentPath = window.location.pathname;
      console.log("Current path:", currentPath, "Redirect path:", redirectPath);
      if (currentPath !== redirectPath) {
        const token = await auth.currentUser?.getIdToken(true);
        console.log("Token before redirect:", token);
        if (token) {
          console.log(`Redirecting to ${redirectPath} with token`);
          await router.push(`${redirectPath}?token=${encodeURIComponent(token)}`);
        } else {
          console.error("No token available for redirect");
          await router.push(redirectPath);
        }
      } else {
        console.log("Already on correct path, no redirect needed");
      }

      return true;
    } catch (error: any) {
      console.error("Login error:", error.message);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      console.log("Attempting logout...");
      await logoutUser();
      const response = await fetch("/api/clearCookie", { method: "POST" });
      if (!response.ok) {
        console.error("Failed to clear cookie server-side");
      } else {
        console.log("Cookie cleared server-side via API");
      }
      console.log("Logout successful, replacing location to /");
      // Use window.location.replace to avoid adding to history
      window.location.replace("/"); // This prevents back navigation to previous route
      const cookie = document.cookie.split("; ").find((row) => row.startsWith("firebaseToken="));
      console.log("Cookie after logout (client-side):", cookie || "No firebaseToken cookie found");
      return true;
    } catch (error: any) {
      console.error("Logout error:", error.message);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, phone: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Starting signUp with:", { email, name });
      await createUserAccount(email, password, name, phone);
      console.log("SignUp successful, redirecting to /client/create-project");
      const token = await auth.currentUser?.getIdToken(true);
      await router.push(`/client/create-project?token=${encodeURIComponent(token || "")}`);
      return true;
    } catch (error: any) {
      console.error("SignUp error:", error.message);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Starting Google login...");
      await signInWithGoogle();
      console.log("Google login successful, redirecting to /client");
      const currentPath = window.location.pathname;
      const token = await auth.currentUser?.getIdToken(true);
      if (currentPath !== "/client") {
        await router.push(`/client?token=${encodeURIComponent(token || "")}`);
      } else {
        console.log("Already on /client, no redirect needed");
      }
      return true;
    } catch (error: any) {
      console.error("Google login error:", error.message);
      setError(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    profile,
    isLoading,
    isAuthenticated,
    error,
    signUp,
    login,
    googleLogin,
    logout,
  };
};