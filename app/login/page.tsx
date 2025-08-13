"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "firebase/auth";
import Register from "@/components/Register";
import { translateFirebaseError } from "@/lib/firebaseErrors";
import { signInEmail, signInGoogle, resetPassword } from "@/lib/services/authService";

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
    if (!loginEmail || !loginPassword) return;
    try {
      await signInEmail(loginEmail, loginPassword);
      setAuthMessage("Connexion Email réussie !");
      setShowLogin(false);
      setLoginEmail("");
      setLoginPassword("");
    } catch (error: any) {
      console.error("[Auth][EmailLogin] Erreur brute :", error);
      if (error?.code) {
        if (["auth/invalid-login-credentials","auth/invalid-credential"].includes(error.code)) {
          setLoginErrorModal("Impossible de se connecter : identifiants invalides. Vérifiez votre email et votre mot de passe.");
        } else {
          setAuthMessage(translateFirebaseError(error.code));
        }
      } else {
        setAuthMessage("Erreur Connexion Email.");
      }
    }
  };

  const googleErrorFr = (code: string) => translateFirebaseError(code);

  const handleGoogleLogin = async () => {
    try {
      await signInGoogle();
      setAuthMessage("Connexion Google réussie !");
      // plus de création doc ici: géré dans le service
    } catch (error: any) {
      console.error("[Auth][Google] Erreur brute :", error);
      setAuthMessage(error?.code ? translateFirebaseError(error.code) : "Erreur de connexion Google.");
    }
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail) {
      setAuthMessage("Veuillez saisir votre email.");
      return;
    }
    try {
      await resetPassword(resetEmail);
      setAuthMessage("Un email de réinitialisation a été envoyé.");
      setShowReset(false);
      setResetEmail("");
    } catch (error: any) {
      console.error("[Auth][ResetPassword] Erreur brute :", error);
      setAuthMessage(error?.code ? translateFirebaseError(error.code) : "Erreur lors de la réinitialisation.");
    }
  };

  return (
    <main className="min-h-screen p-2 sm:p-6 flex flex-col items-center">
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Bienvenue sur Dalon974</h1>
        <p className="text-slate-600">
          Connectez-vous ou inscrivez-vous pour accéder aux annonces de colocation.
        </p>
      </header>

      <div className="bg-white/90 border border-slate-200 backdrop-blur rounded-2xl shadow-sm p-6 mb-8 w-full max-w-md">
        <div className="flex flex-col gap-3">
          <button
            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 w-full flex items-center justify-center gap-2"
            onClick={() => setShowSignup(true)}
          >
            <span>📧</span> S'inscrire avec Email
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 w-full flex items-center justify-center gap-2"
            onClick={() => setShowLogin(true)}
          >
            <span>🔑</span> Se connecter avec Email
          </button>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-slate-500">ou</span>
            </div>
          </div>
          <button
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full flex items-center justify-center gap-2"
            onClick={handleGoogleLogin}
          >
            <span>🟢</span> Se connecter avec Google
          </button>
        </div>
        {authMessage && (
          <div className="mt-4 text-center text-sm text-green-700">{authMessage}</div>
        )}
      </div>

      {/* Modales */}
      {showSignup && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
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
      {showLogin && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleEmailLogin}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4"
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
      {loginErrorModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
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
      {showReset && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form
            onSubmit={handleResetPassword}
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4"
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


