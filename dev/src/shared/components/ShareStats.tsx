"use client";

import { useState, useEffect } from "react";

interface ShareStatsProps {
  url?: string;
  className?: string;
}

interface ShareCounts {
  facebook: number;
  twitter: number;
  linkedin: number;
  total: number;
}

export default function ShareStats({ 
  url = typeof window !== "undefined" ? window.location.href : "",
  className = ""
}: ShareStatsProps) {
  const [counts, setCounts] = useState<ShareCounts>({
    facebook: 0,
    twitter: 0,
    linkedin: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShareCounts = async () => {
      try {
        // Simulation de données (en production, utiliser une API réelle)
        const mockCounts = {
          facebook: Math.floor(Math.random() * 50) + 10,
          twitter: Math.floor(Math.random() * 30) + 5,
          linkedin: Math.floor(Math.random() * 20) + 3,
          total: 0
        };
        
        mockCounts.total = mockCounts.facebook + mockCounts.twitter + mockCounts.linkedin;
        
        setCounts(mockCounts);
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShareCounts();
  }, [url]);

  if (loading) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse"></div>
          <div className="w-8 h-4 bg-slate-200 rounded animate-pulse"></div>
        </div>
        <div className="text-sm text-slate-500">Chargement...</div>
      </div>
    );
  }

  if (counts.total === 0) {
    return null;
  }

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
        <span className="text-sm font-medium text-slate-700">{counts.total}</span>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-slate-500">
        {counts.facebook > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>{counts.facebook}</span>
          </div>
        )}
        
        {counts.twitter > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            <span>{counts.twitter}</span>
          </div>
        )}
        
        {counts.linkedin > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-blue-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            <span>{counts.linkedin}</span>
          </div>
        )}
      </div>
    </div>
  );
}
