"use client";

import React from "react";
import useAuthGuard from "@/shared/hooks/useAuthGuard";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
}

export default function AuthGuard({ 
  children, 
  redirectTo = "/login", 
  requireAuth = true,
  fallback,
  onUnauthorized 
}: AuthGuardProps) {
  const { loading, isAuthenticated, isReady } = useAuthGuard({
    redirectTo,
    requireAuth,
    onUnauthorized
  });

  // Afficher le fallback personnalisé si fourni
  if (fallback && !isReady) {
    return <>{fallback}</>;
  }

  // Afficher le loader par défaut
  if (loading || !isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Vérification de l'authentification...</span>
      </div>
    );
  }

  // Si l'authentification est requise mais l'utilisateur n'est pas connecté
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
          <span className="ml-2 text-red-600">Redirection vers la page de connexion...</span>
        </div>
      </div>
    );
  }

  // Rendre les enfants si tout est OK
  return <>{children}</>;
}
