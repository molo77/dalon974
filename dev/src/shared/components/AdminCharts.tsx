"use client";

import { useState, useEffect } from 'react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

interface AdminChartsProps {
  className?: string;
}

export default function AdminCharts({ className = "" }: AdminChartsProps) {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler des données de graphique
    const mockData: ChartData = {
      labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
      datasets: [
        {
          label: 'Nouvelles annonces',
          data: [12, 19, 8, 15, 22, 18, 25],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(6, 182, 212, 0.8)'
          ],
          borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(245, 158, 11, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(236, 72, 153, 1)',
            'rgba(6, 182, 212, 1)'
          ],
          borderWidth: 2
        }
      ]
    };

    setTimeout(() => {
      setChartData(mockData);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-slate-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  const maxValue = Math.max(...chartData.datasets[0].data);
  const minValue = Math.min(...chartData.datasets[0].data);

  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Activité de la semaine</h3>
        <p className="text-slate-600">Nouvelles annonces par jour</p>
      </div>

      {/* Graphique en barres simple */}
      <div className="space-y-4">
        {chartData.labels.map((label, index) => {
          const value = chartData.datasets[0].data[index];
          const percentage = ((value - minValue) / (maxValue - minValue)) * 100;
          
          return (
            <div key={label} className="flex items-center gap-4">
              <div className="w-12 text-sm font-medium text-slate-600">
                {label}
              </div>
              <div className="flex-1">
                <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full rounded-lg transition-all duration-1000 ease-out"
                    style={{
                      width: `${percentage}%`,
                      background: `linear-gradient(90deg, ${chartData.datasets[0].backgroundColor[index]}, ${chartData.datasets[0].borderColor[index]})`
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-slate-700">
                      {value}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Légende */}
      <div className="mt-6 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Total de la semaine:</span>
          <span className="font-semibold text-slate-800">
            {chartData.datasets[0].data.reduce((a, b) => a + b, 0)} annonces
          </span>
        </div>
      </div>
    </div>
  );
}

// Composant de graphique circulaire simple
export function AdminPieChart({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);
  }, []);

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-slate-200 rounded mb-4 w-1/2"></div>
          <div className="h-48 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    );
  }

  const data = [
    { label: 'Annonces actives', value: 45, color: 'from-blue-500 to-cyan-500' },
    { label: 'Annonces en attente', value: 20, color: 'from-yellow-500 to-orange-500' },
    { label: 'Annonces expirées', value: 15, color: 'from-red-500 to-red-600' },
    { label: 'Annonces supprimées', value: 20, color: 'from-gray-500 to-slate-500' }
  ];

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2">Statut des annonces</h3>
        <p className="text-slate-600">Répartition par statut</p>
      </div>

      {/* Graphique circulaire simple */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const circumference = 2 * Math.PI * 45; // rayon de 45
              const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = data.slice(0, index).reduce((acc, prevItem) => {
                return acc - ((prevItem.value / total) * circumference);
              }, 0);

              return (
                <circle
                  key={item.label}
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={`url(#gradient-${index})`}
                  strokeWidth="8"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000 ease-out"
                  style={{ strokeLinecap: 'round' }}
                />
              );
            })}
            
            {/* Définitions des gradients */}
            <defs>
              {data.map((item, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={item.color.includes('blue') ? '#3b82f6' : 
                    item.color.includes('yellow') ? '#eab308' :
                    item.color.includes('red') ? '#ef4444' : '#6b7280'} />
                  <stop offset="100%" stopColor={item.color.includes('blue') ? '#06b6d4' : 
                    item.color.includes('yellow') ? '#f97316' :
                    item.color.includes('red') ? '#dc2626' : '#475569'} />
                </linearGradient>
              ))}
            </defs>
          </svg>
          
          {/* Centre du graphique */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-800">{total}</div>
              <div className="text-sm text-slate-600">Total</div>
            </div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`w-4 h-4 bg-gradient-to-r ${item.color} rounded-full`}></div>
            <div className="flex-1 flex items-center justify-between">
              <span className="text-sm text-slate-600">{item.label}</span>
              <span className="text-sm font-semibold text-slate-800">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
