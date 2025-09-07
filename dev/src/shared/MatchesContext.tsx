"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

interface MatchesContextType {
  newMatchesCount: number;
  hasNewMatches: boolean;
  refreshMatches: () => Promise<void>;
}

const MatchesContext = createContext<MatchesContextType | undefined>(undefined);

export function MatchesProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  
  const [newMatchesCount, setNewMatchesCount] = useState<number>(0);
  const [hasNewMatches, setHasNewMatches] = useState<boolean>(false);
  
  const previousMatchesCount = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);
  const lastFetchTime = useRef<number>(0);
  const fetchInterval = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour rafraîchir les matchs
  const refreshMatches = async () => {
    if (!user?.id) return;
    
    const now = Date.now();
    // Éviter les requêtes trop fréquentes (minimum 10 secondes entre les requêtes)
    if (now - lastFetchTime.current < 10000) {
      return;
    }
    
    lastFetchTime.current = now;
    
    try {
      // Récupérer les nouveaux matchs via l'API
      const matchesResponse = await fetch('/api/matches/new-count');
      
      if (matchesResponse.ok) {
        const data = await matchesResponse.json();
        const currentCount = data.count || 0;
        
        // Détecter les nouveaux matchs
        if (!isFirstLoad.current && currentCount > previousMatchesCount.current) {
          const newMatches = currentCount - previousMatchesCount.current;
          
          // Afficher une notification pour les nouveaux matchs
          if (newMatches > 0) {
            setHasNewMatches(true);
            // Réinitialiser l'indicateur après 8 secondes
            setTimeout(() => setHasNewMatches(false), 8000);
          }
        }
        
        setNewMatchesCount(currentCount);
        previousMatchesCount.current = currentCount;
        isFirstLoad.current = false;
      }
    } catch (error) {
      console.error("Erreur lors du chargement des matchs:", error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    // Chargement initial
    refreshMatches();
    
    // Vérifier toutes les 60 secondes
    fetchInterval.current = setInterval(refreshMatches, 60000);
    
    return () => {
      if (fetchInterval.current) {
        clearInterval(fetchInterval.current);
      }
    };
  }, [user?.id, refreshMatches]);

  const value: MatchesContextType = {
    newMatchesCount,
    hasNewMatches,
    refreshMatches,
  };

  return (
    <MatchesContext.Provider value={value}>
      {children}
    </MatchesContext.Provider>
  );
}

export function useMatches() {
  const context = useContext(MatchesContext);
  if (context === undefined) {
    throw new Error("useMatches must be used within a MatchesProvider");
  }
  return context;
}

