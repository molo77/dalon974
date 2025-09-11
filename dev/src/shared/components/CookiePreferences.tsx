"use client";

import { useState, useEffect } from 'react';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

export default function CookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: false,
    functional: false
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (consent) {
      setPreferences(JSON.parse(consent));
    }
  }, []);

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Les cookies essentiels ne peuvent pas être désactivés
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        🍪 Préférences des cookies
      </h2>
      
      <p className="text-slate-600 mb-6">
        Gérez vos préférences de cookies pour personnaliser votre expérience sur RodColoc.
      </p>

      <div className="space-y-4 mb-6">
        {/* Cookies essentiels */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">Cookies essentiels</h3>
            <p className="text-sm text-slate-600">
              Nécessaires au fonctionnement du site (connexion, sécurité, etc.)
            </p>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-slate-500 mr-2">Toujours activés</span>
            <div className="w-12 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Cookies d'analytics */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">Cookies d'analytics</h3>
            <p className="text-sm text-slate-600">
              Nous aident à comprendre comment vous utilisez le site pour l'améliorer
            </p>
          </div>
          <button
            onClick={() => updatePreference('analytics', !preferences.analytics)}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
              preferences.analytics ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </button>
        </div>

        {/* Cookies fonctionnels */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
          <div>
            <h3 className="font-medium text-slate-800">Cookies fonctionnels</h3>
            <p className="text-sm text-slate-600">
              Améliorent votre expérience (préférences, personnalisation)
            </p>
          </div>
          <button
            onClick={() => updatePreference('functional', !preferences.functional)}
            className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
              preferences.functional ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
            }`}
          >
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <p>Pour plus d'informations, consultez notre</p>
          <a href="/politique-confidentialite" className="text-blue-600 hover:underline">
            politique de confidentialité
          </a>
        </div>
        
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sauvegardé
            </span>
          )}
          <button
            onClick={savePreferences}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
