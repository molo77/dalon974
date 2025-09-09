"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMessages } from "@/shared/MessagesContext";

export default function Header() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDevEnvironment, setIsDevEnvironment] = useState<boolean | null>(null);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const router = useRouter();
  const isAdmin = (user?.role || (user as any)?.role) === "admin";
  const { unreadCount, hasNewMessages } = useMessages();

  // Récupérer l'environnement au chargement du composant
  useEffect(() => {
    // En développement, on affiche toujours l'étiquette DEV
    setIsDevEnvironment(true);
  }, []);

  // Timeout pour la session si elle reste en loading trop longtemps
  useEffect(() => {
    if (status === "loading") {
      const timeout = setTimeout(() => {
        console.warn("[Header] Session loading timeout - forcing unauthenticated state");
        setSessionTimeout(true);
      }, 10000); // 10 secondes

      return () => clearTimeout(timeout);
    } else {
      setSessionTimeout(false);
    }
  }, [status]);

  // Logs de débogage pour la session
  useEffect(() => {
    console.log("[Header] Session status:", status, "User:", user ? "authenticated" : "not authenticated");
  }, [status, user]);

  const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
    router.push("/login");
  };

  const toggleMobile = () => setMobileOpen((prev) => !prev);

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200/50 px-3 sm:px-4 py-3 sm:py-4 sticky top-0 z-[9999]">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
          <div className="relative">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-600 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300 animate-pulse-slow">
              <span className="text-white font-bold text-sm sm:text-lg">R</span>
            </div>
            {isDevEnvironment === true && (
              <span className="absolute -top-1 -right-1 text-xs bg-yellow-400 text-black px-1.5 py-0.5 rounded-full font-bold">DEV</span>
            )}
          </div>
          <div className="hidden sm:block">
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
              RodColoc
            </span>
            <p className="text-xs text-slate-500 -mt-1">Colocation à La Réunion 🌺</p>
          </div>
          <div className="block sm:hidden">
            <span className="text-lg font-bold bg-gradient-to-r from-sky-600 to-teal-500 bg-clip-text text-transparent">
              RodColoc
            </span>
          </div>
        </Link>

        <button
          onClick={toggleMobile}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors duration-200"
          aria-label="Menu"
        >
          <svg className={`w-6 h-6 text-slate-700 transition-transform duration-200 ${mobileOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex gap-2 items-center">
          <Link 
            href="/" 
            className="px-3 xl:px-4 py-2 rounded-lg text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 font-medium text-sm xl:text-base"
          >
            Accueil
          </Link>
          <Link 
            href="/idees-pratiques" 
            className="px-3 xl:px-4 py-2 rounded-lg text-slate-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium flex items-center gap-2 text-sm xl:text-base"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="hidden xl:inline">Idées Pratiques</span>
            <span className="xl:hidden">Idées</span>
          </Link>
          
          {user && (
            <>
              <Link 
                href="/dashboard?tab=messages" 
                className="relative px-3 xl:px-4 py-2 rounded-lg text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 font-medium flex items-center gap-2 text-sm xl:text-base"
                onClick={() => {
                  console.log('[Header] Clic sur Messages - Navigation vers /dashboard?tab=messages');
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link 
                href="/dashboard?tab=match" 
                className="px-3 xl:px-4 py-2 rounded-lg text-slate-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium flex items-center gap-2 text-sm xl:text-base"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Match
              </Link>
            </>
          )}

          {status === "loading" && !sessionTimeout ? (
            <div className="flex items-center gap-2 xl:gap-3 px-2 xl:px-3 py-2">
              <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="hidden xl:flex flex-col gap-1">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ) : user ? (
            <>
              {/* Avatar et nom du compte cliquables */}
              <Link
                href="/dashboard"
                className="flex items-center gap-2 xl:gap-3 px-2 xl:px-3 py-2 rounded-lg hover:bg-slate-50 transition-all duration-200 relative group"
              >
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt="Avatar"
                    width={36}
                    height={36}
                    className="w-8 h-8 xl:w-9 xl:h-9 rounded-full border-2 border-slate-200 object-cover group-hover:border-blue-300 transition-colors"
                  />
                ) : (
                  <div className="w-8 h-8 xl:w-9 xl:h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm group-hover:shadow-lg transition-shadow">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
                  </div>
                )}
                <div className="hidden xl:flex flex-col">
                  <span className="font-medium text-slate-800 text-sm">
                    {user.displayName || user.email?.split("@")[0]}
                  </span>
                  <span className="text-xs text-slate-500">Mon compte</span>
                </div>
                
                {/* Indicateur de nouveaux messages */}
                {hasNewMessages && (
                  <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-3 w-3 animate-pulse"></span>
                )}
              </Link>
              
              <div className="flex items-center gap-1 xl:gap-2 ml-1 xl:ml-2">
                <button
                  onClick={handleLogout}
                  className="px-2 xl:px-3 py-2 text-xs xl:text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <span className="hidden xl:inline">Déconnexion</span>
                  <span className="xl:hidden">Déco</span>
                </button>
                
                {/* Bouton accès admin (role basé sur session) */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 xl:px-4 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-xs xl:text-sm"
                  >
                    Admin
                  </Link>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 xl:gap-3">
              <Link 
                href="/login" 
                className="px-3 xl:px-4 py-2 text-slate-700 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-all duration-200 font-medium text-sm xl:text-base"
              >
                Connexion
              </Link>
              <Link 
                href="/signup" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 xl:px-6 py-2 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-200 font-semibold text-sm xl:text-base"
              >
                Inscription
              </Link>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <nav className="lg:hidden mt-4 border-t border-slate-200 pt-4">
          {/* Section utilisateur en haut */}
          {status === "loading" && !sessionTimeout ? (
            <div className="flex flex-col items-center gap-2 mb-6">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ) : user ? (
            <div className="mb-6">
              {/* Profil utilisateur */}
              <Link
                href="/dashboard"
                className="flex items-center gap-3 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 hover:from-sky-100 hover:to-blue-100 transition-all duration-200 relative"
                onClick={toggleMobile}
              >
                <div className="relative">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt="Avatar"
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "?"}
                    </div>
                  )}
                  {hasNewMessages && (
                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold animate-pulse">
                      !
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {user.displayName || user.email?.split("@")[0]}
                  </p>
                  <p className="text-sm text-slate-600">Mon compte</p>
                </div>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            <div className="mb-6 flex gap-3">
              <Link 
                href="/signup" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold text-center" 
                onClick={toggleMobile}
              >
                Inscription
              </Link>
              <Link 
                href="/login" 
                className="flex-1 border border-slate-300 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-50 transition-all duration-200 font-medium text-center" 
                onClick={toggleMobile}
              >
                Connexion
              </Link>
            </div>
          )}

          {/* Navigation principale */}
          <div className="space-y-2 mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">Navigation</h3>
            
            <Link 
              href="/" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 font-medium" 
              onClick={toggleMobile}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Accueil
            </Link>
            
            <Link 
              href="/idees-pratiques" 
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:text-green-600 hover:bg-green-50 transition-all duration-200 font-medium" 
              onClick={toggleMobile}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Idées Pratiques
            </Link>
          </div>

          {/* Section utilisateur connecté */}
          {user && (
            <div className="space-y-2 mb-6">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 mb-3">Mon espace</h3>
              
              <Link 
                href="/dashboard?tab=messages" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:text-sky-600 hover:bg-sky-50 transition-all duration-200 font-medium relative" 
                onClick={toggleMobile}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="flex-1">Messages</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              
              <Link 
                href="/dashboard?tab=match" 
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 font-medium" 
                onClick={toggleMobile}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Match
              </Link>
            </div>
          )}

          {/* Actions utilisateur */}
          {user && (
            <div className="space-y-2 border-t border-slate-200 pt-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg transition-all duration-200 font-semibold"
                  onClick={toggleMobile}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Administration
                </Link>
              )}
              
              <button
                onClick={() => {
                  handleLogout();
                  toggleMobile();
                }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 font-medium w-full text-left"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Déconnexion
              </button>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
// Modification d'un fichier existant
