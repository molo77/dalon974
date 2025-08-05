"use client";

import { auth } from "@/lib/firebase";
import { logout } from "@/lib/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  // 🌀 Pendant chargement
  if (loading) return <p className="p-6">Chargement...</p>;

  // 🔒 Redirection si non connecté
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">Bienvenue sur ton espace, {user.displayName || user.email}</h1>

      <div className="bg-white p-6 rounded-lg shadow w-full max-w-md text-center">
        {user.photoURL && (
          <Image
            src={user.photoURL}
            alt="Avatar"
            width={100}
            height={100}
            className="rounded-full mx-auto mb-4"
          />
        )}
        <p className="text-lg font-semibold">{user.displayName}</p>
        <p className="text-sm text-gray-600 mb-4">{user.email}</p>

        <button
          onClick={logout}
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
