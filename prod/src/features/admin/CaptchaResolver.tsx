"use client";

import { useState, useEffect } from "react";

interface CaptchaResolverProps {
  onCaptchaSolved: (solution: string) => void;
  onClose: () => void;
  onCaptchaResolved?: () => void;
}

export default function CaptchaResolver({ onCaptchaSolved, onClose, onCaptchaResolved }: CaptchaResolverProps) {
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "detecting" | "solving" | "solved">("idle");
  const [notificationData, setNotificationData] = useState<any>(null);

  // Charger les données de notification du captcha
  const loadCaptchaNotification = async () => {
    setLoading(true);
    setError(null);
    setStatus("detecting");
    
    try {
      const response = await fetch("/api/admin/scraper/captcha/check-notification");
      const data = await response.json();
      
      if (response.ok && data.hasNotification) {
        setNotificationData(data.notification);
        if (data.notification.captchaDetails?.captchaImage) {
          setCaptchaImage(data.notification.captchaDetails.captchaImage);
        }
        setStatus("solving");
      } else {
        setError(data.error || "Aucune notification de captcha");
        setStatus("idle");
      }
    } catch (err) {
      setError("Erreur de connexion");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };


  // Auto-chargement de la notification au chargement
  useEffect(() => {
    loadCaptchaNotification();
  }, []);

  return (
    <div className="fixed inset-0 bg-blue-600/20 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Résolution de Captcha</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Statut */}
          <div className="mb-4">
            {status === "detecting" && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Détection du captcha...</span>
              </div>
            )}
            {status === "solving" && (
              <div className="flex items-center gap-2 text-orange-600">
                <div className="animate-pulse rounded-full h-4 w-4 bg-orange-600"></div>
                <span>Captcha détecté - Prêt à résoudre</span>
              </div>
            )}
            {status === "solved" && (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Captcha résolu avec succès !</span>
              </div>
            )}
          </div>

          {/* URL du captcha */}
          {notificationData?.captchaUrl && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL du captcha :
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600 break-all">{notificationData.captchaUrl}</span>
                </div>
                <button
                  onClick={() => window.open(notificationData.captchaUrl, '_blank')}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🌐 Ouvrir dans un nouvel onglet
                </button>
              </div>
            </div>
          )}

          {/* Image du captcha (si disponible) */}
          {captchaImage && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aperçu du captcha :
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <img
                  src={captchaImage}
                  alt="Captcha à résoudre"
                  className="max-w-full h-auto mx-auto"
                />
              </div>
            </div>
          )}


          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            {status === "idle" && (
              <button
                onClick={loadCaptchaNotification}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Chargement..." : "Charger le Captcha"}
              </button>
            )}
            
            {status === "solving" && (
              <button
                onClick={loadCaptchaNotification}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Actualiser
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Fermer
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Instructions :</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Le scraper est en pause car un captcha a été détecté</li>
              <li>• Un nouvel onglet s'est ouvert automatiquement avec la page Leboncoin</li>
              <li>• Résolvez le captcha dans l'onglet ouvert</li>
              <li>• Revenez au terminal et appuyez sur Entrée pour continuer</li>
              <li>• Le scraper reprendra automatiquement après résolution</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
