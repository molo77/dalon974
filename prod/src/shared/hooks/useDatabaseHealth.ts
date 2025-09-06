import { useState, useEffect, useCallback } from 'react';
import { checkDatabaseHealth } from '@/infrastructure/monitoring/databaseHealth';

interface HealthStatus {
  isHealthy: boolean;
  error?: string;
  responseTime?: number;
}

interface UseDatabaseHealthOptions {
  autoCheck?: boolean;
  checkInterval?: number; // en millisecondes
  onStatusChange?: (status: HealthStatus) => void;
}

export function useDatabaseHealth(options: UseDatabaseHealthOptions = {}) {
  const {
    autoCheck = true,
    checkInterval = 5 * 60 * 1000, // 5 minutes par défaut
    onStatusChange
  } = options;

  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    
    try {
      const health = await checkDatabaseHealth();
      setHealthStatus(health);
      setLastCheck(new Date());
      
      // Appeler le callback si fourni
      if (onStatusChange) {
        onStatusChange(health);
      }
      
      return health;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      
      const failedStatus: HealthStatus = {
        isHealthy: false,
        error: errorMessage
      };
      
      setHealthStatus(failedStatus);
      
      if (onStatusChange) {
        onStatusChange(failedStatus);
      }
      
      return failedStatus;
    } finally {
      setIsChecking(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    if (autoCheck) {
      // Vérification initiale
      checkHealth();
      
      // Vérification périodique
      const interval = setInterval(checkHealth, checkInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoCheck, checkInterval, checkHealth]);

  return {
    healthStatus,
    isChecking,
    lastCheck,
    error,
    checkHealth,
    isHealthy: healthStatus?.isHealthy ?? false,
    responseTime: healthStatus?.responseTime,
    errorMessage: healthStatus?.error
  };
}
