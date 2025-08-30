"use client";

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function ImageCleanup() {
  const [isLoading, setIsLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);
  const [verbose, setVerbose] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleCleanup = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/admin/cleanup/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun,
          verbose
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLastResult(result);
        toast.success(`Nettoyage terminé${dryRun ? ' (mode test)' : ''} ✅`);
      } else {
        toast.error(`Erreur: ${result.error || 'Erreur inconnue'} ❌`);
      }
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      toast.error('Erreur lors du nettoyage ❌');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const response = await fetch('/api/admin/cleanup/images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dryRun: true,
          verbose: true
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setLastResult(result);
        appToast('success', 'Test de nettoyage terminé ✅');
      } else {
        appToast('error', `Erreur: ${result.error || 'Erreur inconnue'} ❌`);
      }
    } catch (error) {
      console.error('Erreur lors du test:', error);
      appToast('error', 'Erreur lors du test ❌');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">🧹 Nettoyage des Images</h3>
          <p className="text-sm text-slate-600 mt-1">
            Supprime automatiquement les images uploadées qui ne sont plus référencées dans la base de données
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Options */}
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Mode test (dry-run)</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={verbose}
              onChange={(e) => setVerbose(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Affichage détaillé</span>
          </label>
        </div>

        {/* Boutons */}
        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Test en cours...' : '🧪 Test de nettoyage'}
          </button>

          <button
            onClick={handleCleanup}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
              dryRun 
                ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isLoading ? 'Nettoyage en cours...' : dryRun ? '🔍 Test complet' : '🗑️ Nettoyage réel'}
          </button>
        </div>

        {/* Avertissement */}
        {!dryRun && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center gap-2">
              <span className="text-red-600">⚠️</span>
              <span className="text-sm text-red-700 font-medium">
                Attention : Cette action supprimera définitivement les images inutilisées !
              </span>
            </div>
            <p className="text-sm text-red-600 mt-1">
              Assurez-vous d'avoir fait un test avant de procéder au nettoyage réel.
            </p>
          </div>
        )}

        {/* Résultat */}
        {lastResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
            <h4 className="font-medium text-slate-900 mb-2">📊 Résultat du nettoyage</h4>
            <div className="text-sm text-slate-700 space-y-1">
              <p><strong>Statut:</strong> {lastResult.success ? '✅ Succès' : '❌ Erreur'}</p>
              <p><strong>Message:</strong> {lastResult.message}</p>
              {lastResult.dryRun && (
                <p><strong>Mode:</strong> Test (aucune suppression effectuée)</p>
              )}
            </div>
          </div>
        )}

        {/* Informations */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informations</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Le nettoyage vérifie les images dans <code>/public/uploads/</code></p>
            <p>• Seules les images non référencées dans les annonces et profils sont supprimées</p>
            <p>• Les formats supportés : JPG, PNG, GIF, WebP, SVG</p>
            <p>• Les logs sont sauvegardés dans <code>/logs/cleanup-images.log</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
