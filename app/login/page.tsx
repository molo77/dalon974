"use client";

import { signInWithGoogle } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  if (loading) return <p>Chargement...</p>;

  if (user) {
    router.push("/dashboard");
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Connexion à Dalon974</h1>
      <button
        onClick={signInWithGoogle}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Se connecter avec Google
      </button>
    </div>
  );
}
