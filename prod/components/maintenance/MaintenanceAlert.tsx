'use client';

import { useState, useEffect } from 'react';

interface MaintenanceAlertProps {
  className?: string;
  showOnHealthy?: boolean;
  autoHide?: boolean;
  hideDelay?: number; // en millisecondes
}

export default function MaintenanceAlert({
  className = '',
  showOnHealthy = false,
  autoHide = true,
  hideDelay = 5000
}: MaintenanceAlertProps) {
  // État local pour éviter les problèmes d'import
  const [isHealthy, setIsHealthy] = useState(true);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Éviter les erreurs d'hydratation
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fonction simple pour vérifier la santé de la DB
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setIsHealthy(data.status === 'healthy');
      setHealthStatus(data);
      setErrorMessage(data.database?.error || null);
    } catch {
      setIsHealthy(false);
      setErrorMessage('Erreur de connexion');
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    
    // Vérification initiale
    checkHealth();
    
    // Vérification périodique
    const interval = setInterval(checkHealth, 30 * 1000);
    
    return () => clearInterval(interval);
  }, [isMounted]);

  useEffect(() => {
    // Afficher l'alerte si la DB n'est pas saine OU si on veut afficher même quand elle est saine
    const shouldShow = !isHealthy || showOnHealthy;
    
    if (shouldShow && !isDismissed) {
      setIsVisible(true);
      
      // Masquer automatiquement après un délai si activé
      if (autoHide && isHealthy) {
        const timer = setTimeout(() => {
          setIsVisible(false);
        }, hideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [isHealthy, showOnHealthy, isDismissed, autoHide, hideDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleRetry = () => {
    setIsDismissed(false);
    window.location.reload();
  };

  if (!isVisible || !healthStatus) {
    return null;
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${className}`}>
      <div className={`rounded-lg shadow-lg p-4 border-l-4 ${
        isHealthy 
          ? 'bg-green-50 border-green-400 text-green-800' 
          : 'bg-red-50 border-red-400 text-red-800'
      }`}>
        <div className="flex items-start">
          {/* Icône */}
          <div className="flex-shrink-0">
            {isHealthy ? (
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Contenu */}
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium">
              {isHealthy ? 'Système rétabli' : 'Problème de maintenance'}
            </h3>
            <div className="mt-1 text-sm">
              {isHealthy ? (
                <p>La base de données est maintenant accessible.</p>
              ) : (
                <div>
                  <p>La base de données n'est pas accessible.</p>
                  {errorMessage && (
                    <p className="mt-1 text-xs opacity-75">
                      Erreur: {errorMessage}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-3 flex space-x-2">
              {!isHealthy && (
                <button
                  onClick={handleRetry}
                  className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
                >
                  Réessayer
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded transition-colors"
              >
                {isHealthy ? 'Fermer' : 'Ignorer'}
              </button>
            </div>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={handleDismiss}
            className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
