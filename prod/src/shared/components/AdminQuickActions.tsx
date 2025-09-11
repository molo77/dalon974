"use client";

import { useState } from 'react';

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
  loading?: boolean;
}

function QuickAction({ title, description, icon, color, onClick, loading }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {loading ? (
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <span className="text-2xl">{icon}</span>
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
          <p className="text-slate-600 text-sm">{description}</p>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export default function AdminQuickActions() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (action: string, actionFn: () => Promise<void>) => {
    setLoading(action);
    try {
      await actionFn();
    } catch (error) {
      console.error(`Erreur lors de l'action ${action}:`, error);
    } finally {
      setLoading(null);
    }
  };

  const actions = [
    {
      id: 'seed-data',
      title: 'Créer des données d\'exemple',
      description: 'Ajouter des annonces et profils de test',
      icon: '🌱',
      color: 'from-emerald-500 to-green-500',
      action: async () => {
        try {
          const response = await fetch('/api/admin/seed-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ Données d\'exemple créées:', result);
            alert(`✅ Données d'exemple créées avec succès!\n\n- ${result.data.annonces} annonces créées\n- ${result.data.colocProfiles} profils colocataires créés\n- Utilisateur: ${result.data.user}`);
          } else {
            const error = await response.json();
            console.error('❌ Erreur:', error);
            alert(`❌ Erreur lors de la création des données d'exemple: ${error.error}`);
          }
        } catch (error) {
          console.error('❌ Erreur lors de la création des données d\'exemple:', error);
          alert('❌ Erreur lors de la création des données d\'exemple');
        }
      }
    },
    {
      id: 'cleanup',
      title: 'Nettoyage des images',
      description: 'Supprimer les images orphelines',
      icon: '🧹',
      color: 'from-blue-500 to-cyan-500',
      action: async () => {
        // Logique de nettoyage des images
        console.log('Nettoyage des images...');
      }
    },
    {
      id: 'backup',
      title: 'Sauvegarde',
      description: 'Créer une sauvegarde de la base',
      icon: '💾',
      color: 'from-green-500 to-emerald-500',
      action: async () => {
        // Logique de sauvegarde
        console.log('Sauvegarde en cours...');
      }
    },
    {
      id: 'cache',
      title: 'Vider le cache',
      description: 'Nettoyer le cache de l\'application',
      icon: '🗑️',
      color: 'from-orange-500 to-red-500',
      action: async () => {
        // Logique de vidage du cache
        console.log('Vidage du cache...');
      }
    },
    {
      id: 'logs',
      title: 'Voir les logs',
      description: 'Consulter les logs système',
      icon: '📋',
      color: 'from-purple-500 to-pink-500',
      action: async () => {
        // Logique d'affichage des logs
        console.log('Affichage des logs...');
      }
    }
  ];

  return (
    <div className="mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Actions rapides</h3>
        <p className="text-slate-600">Outils de maintenance et gestion rapide</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <QuickAction
            key={action.id}
            title={action.title}
            description={action.description}
            icon={action.icon}
            color={action.color}
            loading={loading === action.id}
            onClick={() => handleAction(action.id, action.action)}
          />
        ))}
      </div>
    </div>
  );
}
