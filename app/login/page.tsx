"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Register from "@/components/Register";

export default function LoginPage() {
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [loginErrorModal, setLoginErrorModal] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        router.push("/dashboard");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const handleEmailLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const auth = getAuth();
    if (!loginEmail || !loginPassword) return;
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setAuthMessage("Connexion Email réussie !");
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setAuthMessage("Mot de passe incorrect.");
      } else if (error.code === "auth/user-not-found") {
        setAuthMessage("Aucun compte trouvé avec cet email.");
      } else if (error.code === "auth/invalid-login-credentials" || error.code === "auth/invalid-credential") {
        setLoginErrorModal("Impossible de se connecter : identifiants invalides. Vérifiez votre email et votre mot de passe.");
      } else {
        setAuthMessage("Erreur Connexion Email : " + error.message);
      }
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      setAuthMessage("Connexion Google réussie !");
      // Ajout dans la collection users si pas déjà présent
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName || "",
          role: "user",
        });
      }
    } catch (error: any) {
      setAuthMessage("Erreur Connexion Google : " + error.message);
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const auth = getAuth();
    if (!resetEmail) {
      setAuthMessage("Veuillez saisir votre email.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setAuthMessage("Un email de réinitialisation a été envoyé.");
      setShowReset(false);
      setResetEmail("");
    } catch (error: any) {
      setAuthMessage("Erreur lors de la réinitialisation : " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
      <header className="w-full max-w-md mb-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Bienvenue sur Dalon974</h1>
        <p className="text-gray-600 text-center">
          Connectez-vous ou inscrivez-vous pour accéder aux annonces de colocation.
        </p>
      </header>
      <div className="bg-white shadow rounded p-6 mb-8 w-full max-w-md flex flex-col items-center">
        <button
          className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 w-full mb-2 flex items-center justify-center gap-2"
          onClick={() => setShowSignup(true)}
        >
          <span>📧</span>
          S'inscrire avec Email
        </button>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full mb-2 flex items-center justify-center gap-2"
          onClick={() => setShowLogin(true)}
        >
          <span>🔑</span>
          Se connecter avec Email
        </button>
        <button
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full flex items-center justify-center gap-2"
          onClick={handleGoogleLogin}
        >
          <span>🔍</span>
          Se connecter avec Google
        </button>
        {authMessage && (
          <div className="mt-4 text-center text-sm text-green-700">{authMessage}</div>
        )}
      </div>

      {/* Modal inscription */}
      {showSignup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-sm flex flex-col gap-4">
            <h2 className="text-xl font-bold mb-2 text-center">Inscription Email</h2>
            <Register onSuccess={() => setShowSignup(false)} />
            <button
              type="button"
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded mt-4"
              onClick={() => setShowSignup(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Modal connexion */}
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleEmailLogin}
            className="bg-white rounded shadow p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold mb-2 text-center">Connexion Email</h2>
            <input
              type="email"
              placeholder="Email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={loginPassword}
              onChange={e => setLoginPassword(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                Se connecter
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1"
                onClick={() => setShowLogin(false)}
              >
                Annuler
              </button>
            </div>
            <button
              type="button"
              className="text-blue-600 underline text-sm mt-2"
              onClick={() => {
                setShowLogin(false);
                setShowReset(true);
                setResetEmail(loginEmail);
              }}
            >
              Mot de passe oublié ?
            </button>
          </form>
        </div>
      )}

      {/* Modal erreur connexion */}
      {loginErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow p-6 w-full max-w-sm flex flex-col gap-4 items-center">
            <h2 className="text-xl font-bold text-red-700 mb-2 text-center">Erreur de connexion</h2>
            <p className="text-gray-700 text-center">{loginErrorModal}</p>
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-4"
              onClick={() => setLoginErrorModal(null)}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal reset password */}
      {showReset && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            onSubmit={handleResetPassword}
            className="bg-white rounded shadow p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold mb-2 text-center">Réinitialiser le mot de passe</h2>
            <input
              type="email"
              placeholder="Votre email"
              value={resetEmail}
              onChange={e => setResetEmail(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex-1"
              >
                Envoyer
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1"
                onClick={() => setShowReset(false)}
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

