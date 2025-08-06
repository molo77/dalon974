"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const [user] = useAuthState(auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <header className="bg-white shadow px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-blue-600">
          Dalon974
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

          {user && (
            <>
              <Link href="/dashboard" className="hover:underline">
                Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="text-red-600 hover:underline"
              >
                Déconnexion
              </button>
            </>
          )}

          {!user && (
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

          {user && (
            <>
              <Link href="/dashboard" className="hover:underline" onClick={toggleMobile}>
                Dashboard
              </Link>

              {pathname === "/dashboard" && (
                <a
                  href="#formulaire-annonce"
                  onClick={toggleMobile}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  ➕ Nouvelle annonce
                </a>
              )}

              <button
                onClick={() => {
                  handleLogout();
                  toggleMobile();
                }}
                className="text-red-600 hover:underline text-left"
              >
                Déconnexion
              </button>
            </>
          )}

          {!user && (
            <Link href="/login" className="text-blue-600 hover:underline" onClick={toggleMobile}>
              Connexion
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
