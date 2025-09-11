"use client";

import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

function StatCard({ title, value, icon, color, description, trend, onClick }: StatCardProps) {
  return (
    <div 
      className={`group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
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
        {description && (
          <p className="text-slate-500 text-sm mt-1">{description}</p>
        )}
        {onClick && (
          <div className="mt-3 flex items-center text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span>Cliquer pour voir</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

interface AdminStatsProps {
  onTabChange?: (tab: "dashboard" | "annonces" | "users" | "colocs" | "reports" | "ads" | "maintenance") => void;
}

export default function AdminStats({ onTabChange }: AdminStatsProps) {
  const [stats, setStats] = useState({
    annonces: 0,
    users: 0,
    colocs: 0,
    ads: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [annoncesRes, usersRes, colocsRes, adsRes] = await Promise.all([
          fetch('/api/annonces', { cache: 'no-store' }),
          fetch('/api/admin/users', { cache: 'no-store' }),
          fetch('/api/coloc', { cache: 'no-store' }),
          fetch('/api/admin/ads', { cache: 'no-store' })
        ]);

        const [annoncesData, usersData, colocsData, adsData] = await Promise.all([
          annoncesRes.ok ? annoncesRes.json() : { total: 0 },
          usersRes.ok ? usersRes.json() : { total: 0 },
          colocsRes.ok ? colocsRes.json() : { total: 0 },
          adsRes.ok ? adsRes.json() : { total: 0 }
        ]);

        setStats({
          annonces: annoncesData.total || annoncesData.items?.length || 0,
          users: usersData.total || usersData.items?.length || 0,
          colocs: colocsData.total || colocsData.items?.length || 0,
          ads: adsData.total || adsData.items?.length || 0,
          loading: false
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  if (stats.loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-xl"></div>
              <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
            </div>
            <div className="w-20 h-8 bg-slate-200 rounded mb-2"></div>
            <div className="w-24 h-4 bg-slate-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Annonces"
        value={stats.annonces}
        icon="📋"
        color="from-blue-500 to-cyan-500"
        description="Annonces de colocation"
        trend={{ value: 12, isPositive: true }}
        onClick={() => onTabChange?.('annonces')}
      />
      <StatCard
        title="Utilisateurs"
        value={stats.users}
        icon="👥"
        color="from-green-500 to-emerald-500"
        description="Comptes utilisateurs"
        trend={{ value: 8, isPositive: true }}
        onClick={() => onTabChange?.('users')}
      />
      <StatCard
        title="Colocataires"
        value={stats.colocs}
        icon="🏠"
        color="from-purple-500 to-pink-500"
        description="Profils colocataires"
        trend={{ value: 15, isPositive: true }}
        onClick={() => onTabChange?.('colocs')}
      />
      <StatCard
        title="Publicités"
        value={stats.ads}
        icon="📢"
        color="from-orange-500 to-red-500"
        description="Campagnes publicitaires"
        trend={{ value: 3, isPositive: false }}
        onClick={() => onTabChange?.('ads')}
      />
    </div>
  );
}
