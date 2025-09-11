"use client";

import { useState, useEffect } from "react";
import { actualitesService, type Actualite } from "@/core/services/actualitesService";

export const useActualites = () => {
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadActualites = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await actualitesService.getActualites();
        setActualites(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des actualités');
        console.error('Erreur useActualites:', err);
      } finally {
        setLoading(false);
      }
    };

    loadActualites();
  }, []);

  const refreshActualites = async () => {
    try {
      setLoading(true);
      setError(null);
      actualitesService.clearCache();
      const data = await actualitesService.getActualites();
      setActualites(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rafraîchissement des actualités');
      console.error('Erreur refreshActualites:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActualiteById = async (id: number): Promise<Actualite | null> => {
    try {
      return await actualitesService.getActualiteById(id);
    } catch (err) {
      console.error('Erreur getActualiteById:', err);
      return null;
    }
  };

  const getActualitesByCategory = async (category: string): Promise<Actualite[]> => {
    try {
      return await actualitesService.getActualitesByCategory(category);
    } catch (err) {
      console.error('Erreur getActualitesByCategory:', err);
      return [];
    }
  };

  return {
    actualites,
    loading,
    error,
    refreshActualites,
    getActualiteById,
    getActualitesByCategory
  };
};
