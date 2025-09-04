"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ServerStatusCheckerProps {
  children: React.ReactNode;
  checkInterval?: number; // en millisecondes
  timeout?: number; // timeout pour la requête
}

export default function ServerStatusChecker({ 
  children, 
  checkInterval = 10000, // 10 secondes par défaut
  timeout = 5000 // 5 secondes de timeout
}: ServerStatusCheckerProps) {
  const [isServerHealthy, setIsServerHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();

  const checkServerHealth = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch('/api/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
        router.push('/maintenance');
      }
    } catch (error) {
      console.warn('Server health check failed:', error);
      setIsServerHealthy(false);
      router.push('/maintenance');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Vérification initiale
    checkServerHealth();

    // Vérification périodique
    const interval = setInterval(checkServerHealth, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, timeout]);

  // Si le serveur n'est pas sain, ne pas rendre les enfants
  if (!isServerHealthy) {
    return null; // La redirection vers /maintenance se charge du rendu
  }

  return <>{children}</>;
}
