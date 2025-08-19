"use client";

import { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { signInEmail } from "@/lib/services/authService";
import { toast as appToast } from "@/components/Toast";

function LoginContent() {
  const router = useRouter();
  // Pas de redirection automatique ici; on laisse NextAuth gérer via callbackUrl.

  const params = useSearchParams();
  const oauthError = params?.get("error");
  const errorMsg = useMemo(() => {
    if (!oauthError) return null;
    // Messages courants NextAuth
    const map: Record<string, string> = {
      OAuthAccountNotLinked: "Ce mail est déjà lié à un autre mode de connexion.",
      AccessDenied: "Accès refusé par le fournisseur.",
      Configuration: "Configuration OAuth invalide.",
    };
    return map[oauthError] || "Erreur d’authentification.";
  }, [oauthError]);

  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInEmail(email, password);
      appToast.success("Connexion réussie");
      router.push("/dashboard");
    } catch {
      appToast.error("Email ou mot de passe invalide.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-6 flex flex-col items-center">
      <header className="w-full max-w-md mb-8 text-center">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">Connexion</h1>
        <p className="text-slate-600">Accédez rapidement avec votre compte Google.</p>
        {errorMsg && (
          <p className="mt-3 text-sm text-red-600">{errorMsg}</p>
        )}
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 w-full max-w-md">
        <div className="flex flex-col gap-3">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 text-white px-4 py-2 hover:bg-red-700 disabled:opacity-60"
          >
            <span>�</span>
            <span>{loading ? "Redirection…" : "Se connecter avec Google"}</span>
          </button>
          <button
            type="button"
            onClick={() => setEmailOpen(v => !v)}
            className="w-full text-sm text-blue-700 underline mt-1"
          >
            {emailOpen ? "Masquer la connexion email" : "Ou utiliser Email/Mot de passe"}
          </button>
          {emailOpen && (
            <form onSubmit={handleEmail} className="mt-2 flex flex-col gap-2">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              >
                Se connecter
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}


