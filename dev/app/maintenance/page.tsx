'use client';

import { useEffect, useState } from 'react';
import { checkDatabaseHealth } from '@/lib/databaseHealth';

export default function MaintenancePage() {
  const [healthStatus, setHealthStatus] = useState<{
    isHealthy: boolean;
    error?: string;
    responseTime?: number;
  } | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await checkDatabaseHealth();
        setHealthStatus(health);
      } catch (error) {
        setHealthStatus({
          isHealthy: false,
          error: 'Erreur lors de la vérification'
        });
      } finally {
        setIsChecking(false);
      }
    };

    checkHealth();
    
    // Vérifier toutes les 30 secondes
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const health = await checkDatabaseHealth();
      setHealthStatus(health);
      
      if (health.isHealthy) {
        // Rediriger vers la page d'accueil si la DB est accessible
        window.location.href = '/';
      }
    } catch (error) {
      setHealthStatus({
        isHealthy: false,
        error: 'Erreur lors de la vérification'
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Maintenance en cours
          </h1>
          <p className="text-gray-600">
            Nous effectuons actuellement des travaux de maintenance
          </p>
        </div>

        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            État du système
          </h2>
          
          {isChecking ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Vérification en cours...</span>
            </div>
          ) : healthStatus ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">Base de données:</span>
                <div className="flex items-center space-x-2">
                  {healthStatus.isHealthy ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-medium">Opérationnelle</span>
                    </>
                  ) : (
                    <>
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-red-600 font-medium">Hors service</span>
                    </>
                  )}
                </div>
              </div>
              
              {healthStatus.responseTime && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Temps de réponse:</span>
                  <span className="text-gray-900 font-medium">
                    {healthStatus.responseTime}ms
                  </span>
                </div>
              )}
              
              {healthStatus.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-red-800">Erreur détectée</p>
                      <p className="text-sm text-red-700 mt-1">{healthStatus.error}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">Impossible de récupérer l'état du système</div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleRetry}
            disabled={isChecking}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            {isChecking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Vérification...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Réessayer</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Actualiser la page
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <p>Nous nous excusons pour la gêne occasionnée.</p>
            <p className="mt-1">
              La maintenance devrait être terminée rapidement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
