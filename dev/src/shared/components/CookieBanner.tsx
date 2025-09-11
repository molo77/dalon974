"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Toujours activé
    analytics: false,
    functional: false
  });

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      const savedPreferences = JSON.parse(consent);
      setPreferences(savedPreferences);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      essential: true,
      analytics: true,
      functional: true
    };
    setPreferences(allAccepted);
    localStorage.setItem('cookie-consent', JSON.stringify(allAccepted));
    setShowBanner(false);
    // Ici vous pouvez initialiser vos services d'analytics
    initializeAnalytics();
  };

  const acceptEssential = () => {
    const essentialOnly = {
      essential: true,
      analytics: false,
      functional: false
    };
    setPreferences(essentialOnly);
    localStorage.setItem('cookie-consent', JSON.stringify(essentialOnly));
    setShowBanner(false);
  };

  const savePreferences = () => {
    localStorage.setItem('cookie-consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    
    if (preferences.analytics) {
      initializeAnalytics();
    }
  };

  const initializeAnalytics = () => {
    // Initialiser Google Analytics ou autres services d'analytics
    console.log('Analytics initialisés');
  };

  const updatePreference = (key: keyof CookiePreferences, value: boolean) => {
    if (key === 'essential') return; // Les cookies essentiels ne peuvent pas être désactivés
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {!showPreferences ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                🍪 Gestion des cookies
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Nous utilisons des cookies pour améliorer votre expérience sur notre site. 
                Les cookies essentiels sont nécessaires au fonctionnement du site.
              </p>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <Link href="/politique-confidentialite" className="text-blue-600 hover:underline">
                  Politique de confidentialité
                </Link>
                <span>•</span>
                <Link href="/mentions-legales" className="text-blue-600 hover:underline">
                  Mentions légales
                </Link>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => setShowPreferences(true)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Personnaliser
              </button>
              <button
                onClick={acceptEssential}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Essentiels uniquement
              </button>
              <button
                onClick={acceptAll}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tout accepter
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Préférences des cookies
              </h3>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Cookies essentiels */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-800">Cookies essentiels</h4>
                  <p className="text-sm text-slate-600">Nécessaires au fonctionnement du site</p>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-slate-500 mr-2">Toujours activés</span>
                  <div className="w-10 h-6 bg-blue-600 rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Cookies d'analytics */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-800">Cookies d'analytics</h4>
                  <p className="text-sm text-slate-600">Nous aident à comprendre l'utilisation du site</p>
                </div>
                <button
                  onClick={() => updatePreference('analytics', !preferences.analytics)}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.analytics ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>

              {/* Cookies fonctionnels */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <h4 className="font-medium text-slate-800">Cookies fonctionnels</h4>
                  <p className="text-sm text-slate-600">Améliorent votre expérience utilisateur</p>
                </div>
                <button
                  onClick={() => updatePreference('functional', !preferences.functional)}
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                    preferences.functional ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={savePreferences}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder les préférences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
