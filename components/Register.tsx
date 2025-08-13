"use client";

import { useState } from "react";
import { getAuth, createUserWithEmailAndPassword, fetchSignInMethodsForEmail } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, limit as fsLimit } from "firebase/firestore";
import { translateFirebaseError } from "@/lib/firebaseErrors";

export default function Register({
  onSuccess,
  onSwitchToLogin,
}: {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailInUse, setEmailInUse] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // anti double clic
    setError(null);
    setInfo(null);
    setEmailInUse(false);

    const rawEmail = email.trim();
    const normEmail = rawEmail.toLowerCase();

    if (!rawEmail) {
      setError("Veuillez saisir un email.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)) {
      setError("Format d'email invalide.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    const auth = getAuth();

    // Vérification Firestore (existence doc)
    try {
      const qUsers = query(
        collection(db, "users"),
        where("email", "==", normEmail),
        fsLimit(1)
      );
      const existingSnap = await getDocs(qUsers);
      if (!existingSnap.empty) {
        setError("Un compte existe déjà avec cet email. Connectez-vous.");
        setEmailInUse(true);
        return;
      }
    } catch (fsErr) {
      console.warn("[Register][Firestore check] avertissement :", fsErr);
    }

    // Vérification Auth initiale
    try {
      const methods = await fetchSignInMethodsForEmail(auth, normEmail);
      if (methods.length > 0) {
        if (methods.includes("password")) {
          setError("Un compte existe déjà avec cet email. Connectez-vous.");
        } else if (methods.includes("google.com")) {
          setError("Compte Google existant pour cet email. Utilisez « Se connecter avec Google ».");
        } else {
          setError("Un compte existe déjà avec un autre fournisseur.");
        }
        setEmailInUse(true);
        return;
      }
    } catch (preErr) {
      console.warn("[Register][fetchSignInMethods pré] :", preErr);
    }

    setLoading(true);
    try {
      // Re‑vérification juste avant création (race condition)
      try {
        const methodsAgain = await fetchSignInMethodsForEmail(auth, normEmail);
        if (methodsAgain.length > 0) {
          setLoading(false);
            if (methodsAgain.includes("password")) {
              setError("Un compte existe déjà avec cet email. Connectez-vous.");
            } else if (methodsAgain.includes("google.com")) {
              setError("Compte Google existant pour cet email. Utilisez « Se connecter avec Google ».");
            } else {
              setError("Un compte existe déjà avec cet email via un autre fournisseur.");
            }
            setEmailInUse(true);
            return;
        }
      } catch (preRaceErr) {
        console.warn("[Register][fetchSignInMethods re‑check] :", preRaceErr);
      }

      const cred = await createUserWithEmailAndPassword(auth, normEmail, password);
      const user = cred.user;

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: normEmail,
          displayName: user.displayName || "",
          role: "user",
          providerId: "Email",
          createdAt: Date.now(),
        });
      }

      setInfo("Compte créé avec succès !");
      setEmail("");
      setPassword("");
      setConfirm("");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      // Pas de console.error pour l'erreur connue email-already-in-use
      if (err?.code === "auth/email-already-in-use") {
        setError("Un compte existe déjà avec cet email. Connectez-vous.");
        setEmailInUse(true);
      } else {
        console.error("[Register][createUser] erreur inattendue :", err);
        setError(err?.code ? translateFirebaseError(err.code) : "Erreur lors de l'inscription.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => {
          setEmail(e.target.value);
          if (emailInUse) setEmailInUse(false);
        }}
        className="border rounded px-3 py-2"
        autoComplete="email"
        required
      />
      <input
        type="password"
        placeholder="Mot de passe (min 6 caractères)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="border rounded px-3 py-2"
        autoComplete="new-password"
        minLength={6}
        required
      />
      <input
        type="password"
        placeholder="Confirmer le mot de passe"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        className="border rounded px-3 py-2"
        autoComplete="new-password"
        minLength={6}
        required
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {emailInUse && onSwitchToLogin && (
        <button
          type="button"
          onClick={() => onSwitchToLogin()}
          className="text-blue-600 underline text-sm self-start"
        >
          Aller à la connexion
        </button>
      )}
      {info && <p className="text-sm text-green-600">{info}</p>}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Création..." : "Créer le compte"}
      </button>
    </form>
  );
}