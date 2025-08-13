"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import Toast, { ToastMessage } from "./Toast";

export default function Register({ onSuccess }: { onSuccess?: () => void }) {
  const [user] = useAuthState(auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { role, loading } = useAuth();
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerPasswordConfirm, setRegisterPasswordConfirm] = useState("");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  const handleRegister = async (email: string, password: string, passwordConfirm: string) => {
    setRegisterError(null);
    if (password !== passwordConfirm) {
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "error",
          message: "Les mots de passe ne correspondent pas.",
        },
      ]);
      return;
    }
    // Vérification de la complexité du mot de passe
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(password)) {
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "error",
          message: "Le mot de passe doit contenir au moins 6 caractères, dont au moins une lettre et un chiffre.",
        },
      ]);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "user",
        // ...autres champs si besoin...
      });
      if (typeof onSuccess === "function") onSuccess();
    } catch (error: any) {
      let msg = "";
      if (error.code === "auth/weak-password") {
        msg = "Le mot de passe doit contenir au moins 6 caractères.";
      } else {
        msg = error.message;
      }
      setToasts((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "error",
          message: msg,
        },
      ]);
    }
  };

  return (
    <>
      {/* Formulaire d'inscription */}
      <form
        className="max-w-sm mx-auto mt-8 flex flex-col gap-4"
        onSubmit={e => {
          e.preventDefault();
          handleRegister(registerEmail, registerPassword, registerPasswordConfirm);
        }}
      >
        <input
          type="email"
          placeholder="Email"
          className="border rounded px-3 py-2"
          value={registerEmail}
          onChange={e => setRegisterEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe"
          className="border rounded px-3 py-2"
          value={registerPassword}
          onChange={e => setRegisterPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirmer le mot de passe"
          className="border rounded px-3 py-2"
          value={registerPasswordConfirm}
          onChange={e => setRegisterPasswordConfirm(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded px-4 py-2 font-semibold hover:bg-blue-700"
        >
          S'inscrire
        </button>
      </form>

      {/* Utilisation du composant Toast */}
      <Toast
        toasts={toasts}
        onRemove={id => setToasts(toasts => toasts.filter(t => t.id !== id))}
      />
    </>
  );
}