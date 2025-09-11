"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardStats {
  totalAnnonces: number;
  totalColocataires: number;
  totalUsers: number;
  annoncesThisWeek: number;
  colocatairesThisWeek: number;
  loading: boolean;
}

interface RecentActivity {
  id: string;
  type: 'annonce' | 'colocataire' | 'user';
  title: string;
  date: string;
  action: string;
}

export default function DashboardHome() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [stats, setStats] = useState<DashboardStats>({
    totalAnnonces: 0,
    totalColocataires: 0,
    totalUsers: 0,
    annoncesThisWeek: 0,
    colocatairesThisWeek: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Récupérer les statistiques
        const [annoncesRes, colocatairesRes, usersRes] = await Promise.all([
          fetch('/api/annonces', { cache: 'no-store' }),
          fetch('/api/coloc', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' })
        ]);

        const [annoncesData, colocatairesData, usersData] = await Promise.all([
          annoncesRes.ok ? annoncesRes.json() : { total: 0, items: [] },
          colocatairesRes.ok ? colocatairesRes.json() : { total: 0, items: [] },
          usersRes.ok ? usersRes.json() : { total: 0, items: [] }
        ]);

        // Calculer les statistiques de la semaine
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const annoncesThisWeek = annoncesData.items?.filter((item: any) => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= oneWeekAgo;
        }).length || 0;

        const colocatairesThisWeek = colocatairesData.items?.filter((item: any) => {
          const itemDate = new Date(item.createdAt);
          return itemDate >= oneWeekAgo;
        }).length || 0;

        setStats({
          totalAnnonces: annoncesData.total || annoncesData.items?.length || 0,
          totalColocataires: colocatairesData.total || colocatairesData.items?.length || 0,
          totalUsers: usersData.total || usersData.items?.length || 0,
          annoncesThisWeek,
          colocatairesThisWeek,
          loading: false
        });

        // Simuler des activités récentes
        const activities: RecentActivity[] = [
          {
            id: '1',
            type: 'annonce',
            title: 'Nouvelle annonce à Saint-Denis',
            date: new Date().toISOString(),
            action: 'Créée'
          },
          {
            id: '2',
            type: 'colocataire',
            title: 'Profil colocataire mis à jour',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            action: 'Modifié'
          },
          {
            id: '3',
            type: 'user',
            title: 'Nouvel utilisateur inscrit',
            date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            action: 'Inscrit'
          }
        ];

        setRecentActivity(activities);
      } catch (error) {
        console.error('Erreur lors du chargement du tableau de bord:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-pink-400 rounded-full animate-spin mx-auto mb-4" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-600 font-medium">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon, color, trend }: {
    title: string;
    value: number;
    icon: string;
    color: string;
    trend?: { value: number; isPositive: boolean };
  }) => (
    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg`}>
          <span className="text-2xl">{icon}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
            trend.isPositive 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            <svg className={`w-3 h-3 ${trend.isPositive ? 'rotate-0' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
            </svg>
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-1">{value}</h3>
        <p className="text-slate-600 font-medium">{title}</p>
      </div>
    </div>
  );

  const ActivityItem = ({ activity }: { activity: RecentActivity }) => {
    const getIcon = () => {
      switch (activity.type) {
        case 'annonce':
          return '🏠';
        case 'colocataire':
          return '👥';
        case 'user':
          return '👤';
        default:
          return '📋';
      }
    };

    const getColor = () => {
      switch (activity.type) {
        case 'annonce':
          return 'text-blue-600';
        case 'colocataire':
          return 'text-purple-600';
        case 'user':
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <div className="flex items-center gap-4 p-4 bg-white/50 rounded-xl hover:bg-white/80 transition-colors">
        <div className="w-10 h-10 bg-gradient-to-r from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
          <span className="text-lg">{getIcon()}</span>
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-slate-800">{activity.title}</h4>
          <p className="text-sm text-slate-600">{activity.action} • {new Date(activity.date).toLocaleDateString('fr-FR')}</p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getColor()} bg-current/10`}>
          {activity.type}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Tableau de bord</h2>
        <p className="text-slate-600">Vue d'ensemble de la plateforme RodColoc</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total annonces"
          value={stats.totalAnnonces}
          icon="🏠"
          color="from-blue-500 to-cyan-500"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Colocataires"
          value={stats.totalColocataires}
          icon="👥"
          color="from-purple-500 to-pink-500"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon="👤"
          color="from-green-500 to-emerald-500"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="Nouveautés cette semaine"
          value={stats.annoncesThisWeek + stats.colocatairesThisWeek}
          icon="✨"
          color="from-orange-500 to-red-500"
          trend={{ value: 25, isPositive: true }}
        />
      </div>

      {/* Activité récente */}
      <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-6">Activité récente</h3>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <ActivityItem key={activity.id} activity={activity} />
          ))}
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Statistiques détaillées</h3>
          <p className="text-sm text-slate-600 mb-4">Consultez les analyses approfondies</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            Voir les détails
          </button>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚙️</span>
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Paramètres</h3>
          <p className="text-sm text-slate-600 mb-4">Configurez vos préférences</p>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Configurer
          </button>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
          <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">💬</span>
          </div>
          <h3 className="font-semibold text-slate-800 mb-2">Support</h3>
          <p className="text-sm text-slate-600 mb-4">Besoin d'aide ? Contactez-nous</p>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
            Contacter
          </button>
        </div>
      </div>
    </div>
  );
}
