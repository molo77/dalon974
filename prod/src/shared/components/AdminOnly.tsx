"use client";

import { useIsUserView } from './AdminViewToggle';

interface AdminOnlyProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

export default function AdminOnly({ children, fallback = null, className = "" }: AdminOnlyProps) {
  const isUserView = useIsUserView();

  if (isUserView) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
}

// Composant pour masquer complètement en vue utilisateur
export function HideInUserView({ children }: { children: React.ReactNode }) {
  const isUserView = useIsUserView();
  
  if (isUserView) {
    return null;
  }
  
  return <>{children}</>;
}

// Composant pour afficher seulement en vue utilisateur
export function ShowInUserView({ children }: { children: React.ReactNode }) {
  const isUserView = useIsUserView();
  
  if (!isUserView) {
    return null;
  }
  
  return <>{children}</>;
}
