"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const router = useRouter();

  const requiredText = "SUPPRIMER MON COMPTE";

  const handleDelete = async () => {
    if (confirmationText !== requiredText || !confirmCheckbox) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Déconnexion et redirection
        await signOut({ callbackUrl: '/' });
        router.push('/');
      } else {
        const error = await response.json();
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression du compte. Veuillez réessayer.');
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = confirmationText === requiredText && confirmCheckbox;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* En-tête avec icône d'avertissement */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Supprimer mon compte</h2>
              <p className="text-gray-600">Cette action est irréversible</p>
            </div>
          </div>

          {/* Avertissements */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Attention : Cette action supprimera définitivement :</h3>
            <ul className="text-red-700 space-y-1 text-sm">
              <li>• Toutes vos annonces de colocation</li>
              <li>• Votre profil colocataire et vos photos</li>
              <li>• Tous vos messages et conversations</li>
              <li>• Vos préférences et paramètres</li>
              <li>• Votre historique d'activité</li>
              <li>• Toutes les données associées à votre compte</li>
            </ul>
          </div>

          {/* Informations légales */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">📋 Conformité RGPD</h3>
            <p className="text-blue-700 text-sm">
              Conformément au Règlement Général sur la Protection des Données (RGPD), 
              vous avez le droit de demander la suppression de vos données personnelles. 
              Cette action respecte votre droit à l'effacement (article 17 du RGPD).
            </p>
          </div>

          {/* Confirmation par saisie */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pour confirmer, tapez exactement : <span className="font-bold text-red-600">{requiredText}</span>
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder={requiredText}
              disabled={isDeleting}
            />
          </div>

          {/* Checkbox de confirmation */}
          <div className="mb-6">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={confirmCheckbox}
                onChange={(e) => setConfirmCheckbox(e.target.checked)}
                className="mt-1 w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                disabled={isDeleting}
              />
              <span className="text-sm text-gray-700">
                Je comprends que cette action est <strong>irréversible</strong> et que toutes mes données 
                seront définitivement supprimées. Je confirme vouloir supprimer mon compte.
              </span>
            </label>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDelete}
              disabled={!canDelete || isDeleting}
              className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
                canDelete && !isDeleting
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isDeleting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Suppression...
                </span>
              ) : (
                'Supprimer définitivement mon compte'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
