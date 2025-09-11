"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface AdminViewToggleProps {
  className?: string;
}

export default function AdminViewToggle({ className = "" }: AdminViewToggleProps) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';
  
  const [isUserView, setIsUserView] = useState(false);

  // Charger l'état depuis le localStorage au montage
  useEffect(() => {
    const savedView = localStorage.getItem('admin-user-view');
    if (savedView === 'user') {
      setIsUserView(true);
    }
  }, []);

  // Sauvegarder l'état dans le localStorage
  useEffect(() => {
    localStorage.setItem('admin-user-view', isUserView ? 'user' : 'admin');
  }, [isUserView]);

  // Ne pas afficher le composant si l'utilisateur n'est pas admin
  if (!isAdmin) {
    return null;
  }

  const toggleView = () => {
    setIsUserView(!isUserView);
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${!isUserView ? 'text-blue-600' : 'text-gray-500'}`}>
          👑 Admin
        </span>
        <button
          onClick={toggleView}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isUserView ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isUserView ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-sm font-medium ${isUserView ? 'text-blue-600' : 'text-gray-500'}`}>
          👤 Utilisateur
        </span>
      </div>
      
      <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
        {isUserView ? 'Vue utilisateur' : 'Vue admin'}
      </div>
    </div>
  );
}

// Hook pour vérifier si on est en mode utilisateur
export function useIsUserView(): boolean {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === 'admin';
  
  const [isUserView, setIsUserView] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      const savedView = localStorage.getItem('admin-user-view');
      setIsUserView(savedView === 'user');
    }
  }, [isAdmin]);

  // Si l'utilisateur n'est pas admin, on considère qu'il est toujours en vue utilisateur
  return !isAdmin || isUserView;
}
