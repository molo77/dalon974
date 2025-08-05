// lib/auth.ts

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

// 🔐 Connexion avec Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    console.error("Erreur connexion Google :", err);
  }
};

// 🔐 Déconnexion
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Erreur déconnexion :", err);
  }
};
