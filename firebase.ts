// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDFqU6ldwyhYnD1DFGBohkR4p1B2yy3rK4",
  authDomain: "it-portal-aa1f7.firebaseapp.com",
  projectId: "it-portal-aa1f7",
  storageBucket: "it-portal-aa1f7.firebasestorage.app",
  messagingSenderId: "24322635718",
  appId: "1:24322635718:web:017f2d8e047b5224f6a4c7",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth();
export const googleProvider = new GoogleAuthProvider();
// Set session persistence
setPersistence(auth, browserSessionPersistence)
  .then(() => console.log("Auth persistence set to session"))
  .catch((error) => console.error("Error setting persistence:", error));
