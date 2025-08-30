'use client';

import { useDatabaseHealth } from '@/hooks/useDatabaseHealth';
import { formatTimeReunion } from '@/lib/utils/dateUtils';

interface SystemStatusProps {
  showDetails?: boolean;
  className?: string;
  checkInterval?: number;
}

export default function SystemStatus({ 
  showDetails = false, 
  className = '',
  checkInterval = 5 * 60 * 1000 // 5 minutes par défaut
}: SystemStatusProps) {
  const {
    healthStatus,
    isChecking,
    lastCheck,
    checkHealth,
    isHealthy,
    responseTime
  } = useDatabaseHealth({
    autoCheck: true,
    checkInterval
  });

  if (!healthStatus) {
    return (
      <div className={`flex items-center space-x-2 text-sm text-gray-500 ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
        <span>Vérification du système...</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Indicateur de statut */}
      <div className={`w-3 h-3 rounded-full ${
        isHealthy ? 'bg-green-500' : 'bg-red-500'
      }`}></div>
      
      {/* Texte de statut */}
      <span className={`text-sm font-medium ${
        isHealthy ? 'text-green-600' : 'text-red-600'
      }`}>
        {isHealthy ? 'Système opérationnel' : 'Maintenance en cours'}
      </span>
      
      {/* Détails optionnels */}
      {showDetails && (
        <div className="ml-4 text-xs text-gray-500">
          {responseTime && (
            <span className="mr-3">
              Réponse: {responseTime}ms
            </span>
          )}
          {lastCheck && (
            <span>
              Dernière vérification: {formatTimeReunion(lastCheck)}
            </span>
          )}
        </div>
      )}
      
      {/* Bouton de vérification manuelle */}
      <button
        onClick={checkHealth}
        disabled={isChecking}
        className="ml-2 text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
      >
        {isChecking ? 'Vérification...' : 'Actualiser'}
      </button>
    </div>
  );
}
