"use client";

import { useState } from "react";
import Link from "next/link";
import AdBlock from "@/shared/components/AdBlock";
import { conseils } from "@/src/data/conseils";

export default function ConseilsPage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');


  const categories = [
    { key: 'all', label: 'Tous', icon: '📚' },
    { key: 'Contexte réunionnais', label: 'Contexte', icon: '🌺' },
    { key: 'Géographie', label: 'Géographie', icon: '📍' },
    { key: 'Légal', label: 'Légal', icon: '⚖️' },
    { key: 'Culture', label: 'Culture', icon: '🎭' },
    { key: 'Tendances', label: 'Tendances', icon: '📈' },
    { key: 'Relations', label: 'Relations', icon: '🤝' },
    { key: 'Services', label: 'Services', icon: '🛠️' }
  ];

  const filteredConseils = activeCategory === 'all' 
    ? conseils 
    : conseils.filter(conseil => conseil.category === activeCategory);

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-teal-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 text-white py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/30">
            <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse-slow"></span>
            🌺 Guide Complet Colocation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent leading-tight">
            Conseils Colocation
            <br />
            <span className="text-4xl md:text-5xl">à La Réunion</span>
          </h1>
          <p className="text-xl md:text-2xl text-sky-100 max-w-3xl mx-auto leading-relaxed">
            Découvrez tous nos conseils d'experts pour réussir votre colocation sur l'île intense
          </p>
        </div>
      </section>

      {/* Publicité */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AdBlock 
          placementKey="conseils.hero" 
          title="Nos partenaires"
          variant="featured"
          className="max-w-4xl mx-auto"
        />
      </section>

      {/* Navigation Categories */}
      <section className="bg-white shadow-lg border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-4">
            {categories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveCategory(category.key)}
                className={`relative py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeCategory === category.key
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-500/25'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="mr-2 text-lg">{category.icon}</span>
                {category.label}
                {activeCategory === category.key && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredConseils.map((conseil, index) => (
            <article 
              key={conseil.id} 
              className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="relative h-48 bg-gradient-to-br from-sky-100 via-blue-100 to-purple-100 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-purple-500/10"></div>
                <div className="text-6xl group-hover:scale-110 transition-transform duration-500">🏠</div>
                <div className="absolute top-4 right-4 w-3 h-3 bg-sky-400 rounded-full animate-pulse-slow"></div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-gradient-to-r from-sky-100 to-blue-100 text-sky-700 px-3 py-1 rounded-full text-xs font-semibold border border-sky-200">
                    {conseil.category}
                  </span>
                  <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded-full">{conseil.readTime}</span>
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-sky-600 transition-colors duration-300">
                  {conseil.title}
                </h3>
                <p className="text-slate-600 mb-5 leading-relaxed">{conseil.excerpt}</p>
                <Link 
                  href={`/conseils/${conseil.slug}`}
                  className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold group-hover:gap-3 transition-all duration-300"
                >
                  Lire le conseil complet
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 text-white py-20 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/30">
            <span className="w-2 h-2 bg-cyan-300 rounded-full animate-pulse-slow"></span>
            🌺 Prêt à commencer ?
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
            Trouvez votre colocation idéale
          </h2>
          <p className="text-xl text-sky-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Découvrez nos annonces et profils de colocataires à La Réunion
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/"
              className="group bg-white text-sky-600 px-8 py-4 rounded-2xl font-semibold hover:bg-sky-50 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span className="flex items-center gap-2">
                Voir les annonces
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
            <Link
              href="/idees-pratiques"
              className="group border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-sky-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                Plus d'idées pratiques
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
