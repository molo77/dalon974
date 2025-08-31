"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data } = useSession();
  const user = data?.user as any;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDevEnvironment, setIsDevEnvironment] = useState<boolean | null>(null);
  const router = useRouter();
  const isAdmin = (user?.role || (user as any)?.role) === "admin";

  // Récupérer l'environnement au chargement du composant
  useEffect(() => {
    // En développement, on affiche toujours l'étiquette DEV
    setIsDevEnvironment(true);
  }, []);

  const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
    router.push("/login");
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <header className="bg-white shadow px-4 py-3 sticky top-0 z-[9999]">
      <div className="w-[85%] max-w-full mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Dalon974 {isDevEnvironment === true && (
            <span className="text-xs bg-yellow-400 text-black px-2 py-1 rounded ml-2">DEV</span>
          )}
        </Link>

        <button
          onClick={toggleMobile}
          className="md:hidden text-2xl"
          aria-label="Menu"
        >
          ☰
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 items-center">
          <Link href="/" className="hover:underline">
            Accueil
          </Link>

          {user ? (
            <>
              {/* Avatar et nom du compte cliquables */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 hover:underline"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="w-8 h-8 rounded-full border object-cover"
                  />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
                  </span>
                )}
                <span className="font-medium text-gray-700">
                  {user.displayName || user.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline ml-4"
              >
                Déconnexion
              </button>
              {/* Bouton accès admin (role basé sur session) */}
          {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800 font-semibold text-sm ml-2"
                >
            Accéder à l&apos;administration
                </Link>
              )}
            </>
          ) : (
            <Link href="/login" className="text-blue-600 hover:underline">
              Connexion
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="md:hidden mt-3 flex flex-col gap-3 border-t pt-3">
          <Link href="/" className="hover:underline" onClick={toggleMobile}>
            Accueil
          </Link>

          {user ? (
            <>
              {/* Avatar et nom du compte cliquables en mobile, texte personnalisé centré */}
              <Link
                href="/dashboard"
                className="flex flex-col items-center gap-1 mb-2 hover:underline"
                onClick={toggleMobile}
                style={{ minWidth: "120px" }}
              >
                <div className="flex items-center justify-center gap-2">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border object-cover"
                    />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
                    </span>
                  )}
                </div>
                <span className="font-medium text-gray-700 text-center block">
                  Bienvenue {user.displayName || user.email?.split("@")[0]}
                </span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  toggleMobile();
                }}
                className="text-red-600 hover:underline text-left"
              >
                Déconnexion
              </button>
              {/* Bouton accès admin après Déconnexion en mobile */}
  {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-blue-700 text-white px-3 py-1.5 rounded hover:bg-blue-800 font-semibold text-sm text-center mt-1"
                  onClick={toggleMobile}
                >
          Accéder à l&apos;administration
                </Link>
              )}
            </>
          ) : (
            <Link href="/login" className="text-blue-600 hover:underline" onClick={toggleMobile}>
              Connexion
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
