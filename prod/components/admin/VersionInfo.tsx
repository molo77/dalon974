"use client";

import { useState, useEffect } from 'react';

interface VersionInfo {
  environment: string;
  version: string;
  buildTime: string;
  nodeVersion: string;
  nextVersion: string;
  uptime: string;
  memory: string;
}

export default function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVersionInfo = async () => {
      try {
        const response = await fetch('/api/admin/version');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des informations de version');
        }
        const data = await response.json();
        setVersionInfo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchVersionInfo();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Informations de Version</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Informations de Version</h3>
        <div className="text-red-600">
          ❌ Erreur: {error}
        </div>
      </div>
    );
  }

  if (!versionInfo) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Informations de Version</h3>
        <div className="text-gray-500">
          Aucune information de version disponible
        </div>
      </div>
    );
  }

  const getEnvironmentColor = (env: string) => {
    switch (env.toLowerCase()) {
      case 'development':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'production':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env.toLowerCase()) {
      case 'development':
        return '🔧';
      case 'production':
        return '🚀';
      default:
        return '❓';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Informations de Version</h3>
      
      <div className="space-y-4">
        {/* Environnement */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Environnement:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getEnvironmentColor(versionInfo.environment)}`}>
            {getEnvironmentIcon(versionInfo.environment)} {versionInfo.environment}
          </span>
        </div>

        {/* Version */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Version:</span>
          <span className="text-blue-600 font-mono">{versionInfo.version}</span>
        </div>

        {/* Temps de build */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Build:</span>
          <span className="text-gray-600 text-sm">{versionInfo.buildTime}</span>
        </div>

        {/* Node.js */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Node.js:</span>
          <span className="text-gray-600 font-mono text-sm">{versionInfo.nodeVersion}</span>
        </div>

        {/* Next.js */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Next.js:</span>
          <span className="text-gray-600 font-mono text-sm">{versionInfo.nextVersion}</span>
        </div>

        {/* Uptime */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Uptime:</span>
          <span className="text-gray-600 text-sm">{versionInfo.uptime}</span>
        </div>

        {/* Mémoire */}
        <div className="flex items-center justify-between">
          <span className="font-medium">Mémoire:</span>
          <span className="text-gray-600 text-sm">{versionInfo.memory}</span>
        </div>
      </div>

      {/* Indicateur de rafraîchissement */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          🔄 Rafraîchir les informations
        </button>
      </div>
    </div>
  );
}
