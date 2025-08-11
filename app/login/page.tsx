"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function LoginPage() {
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [showSignup, setShowSignup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [user, setUser] = useState<any>(null);
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

  const handleEmailSignup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const auth = getAuth();
    if (!signupEmail || !signupPassword) return;
    try {
      await createUserWithEmailAndPassword(auth, signupEmail, signupPassword);
      setAuthMessage("Inscription Email réussie !");
      setShowSignup(false);
      setSignupEmail("");
      setSignupPassword("");
    } catch (error: any) {
      setAuthMessage("Erreur Email : " + error.message);
    }
  };

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
      setAuthMessage("Erreur Connexion Email : " + error.message);
    }
  };

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAuthMessage("Connexion Google réussie !");
    } catch (error: any) {
      setAuthMessage("Erreur Connexion Google : " + error.message);
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
          <form
            onSubmit={handleEmailSignup}
            className="bg-white rounded shadow p-6 w-full max-w-sm flex flex-col gap-4"
          >
            <h2 className="text-xl font-bold mb-2 text-center">Inscription Email</h2>
            <input
              type="email"
              placeholder="Email"
              value={signupEmail}
              onChange={e => setSignupEmail(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <input
              type="password"
              placeholder="Mot de passe"
              value={signupPassword}
              onChange={e => setSignupPassword(e.target.value)}
              className="border rounded px-3 py-2"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 flex-1"
              >
                S'inscrire
              </button>
              <button
                type="button"
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded flex-1"
                onClick={() => setShowSignup(false)}
              >
                Annuler
              </button>
            </div>
          </form>
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
          </form>
        </div>
      )}
    </main>
  );
}
