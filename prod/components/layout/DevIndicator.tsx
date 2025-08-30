"use client";

import { useState, useEffect } from 'react';

export default function DevIndicator() {
  const [isVisible, setIsVisible] = useState(true);

  // Masquer l'indicateur après 5 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] bg-yellow-400 text-black text-center py-2 px-4 font-bold text-sm shadow-lg">
      🚧 ENVIRONNEMENT DE DÉVELOPPEMENT - Ne pas utiliser pour la production ��
    </div>
  );
}
