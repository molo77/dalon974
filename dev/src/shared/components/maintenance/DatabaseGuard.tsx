'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DatabaseGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function DatabaseGuard({ children, fallback }: DatabaseGuardProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAccessible, setIsAccessible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkDatabase = async () => {
      try {
        // Utiliser l'API de santé au lieu d'importer directement
        const response = await fetch('/api/health');
        const data = await response.json();
        const accessible = data.status === 'healthy';
        
        setIsAccessible(accessible);
        
        if (!accessible) {
          // Rediriger vers la page de maintenance
          router.push('/maintenance');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de la base de données:', error);
        setIsAccessible(false);
        router.push('/maintenance');
      } finally {
        setIsChecking(false);
      }
    };

    // Délai pour éviter les problèmes d'hydratation
    const timer = setTimeout(checkDatabase, 100);
    return () => clearTimeout(timer);
  }, [router]);

  // Afficher le fallback pendant la vérification
  if (isChecking) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Vérification de la base de données...</p>
        </div>
      </div>
    );
  }

  // Si la base de données n'est pas accessible, ne rien afficher (redirection en cours)
  if (!isAccessible) {
    return null;
  }

  // Si la base de données est accessible, afficher les enfants
  return <>{children}</>;
}
