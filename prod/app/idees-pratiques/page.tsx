"use client";

import { useState } from "react";
// import Image from "next/image";
import Link from "next/link";
import AdBlock from "@/shared/components/AdBlock";

export default function IdeesPratiquesPage() {
  const [activeTab, setActiveTab] = useState<'conseils' | 'actualites' | 'astuces'>('conseils');

  const conseils = [
    {
      id: 1,
      title: "Comment bien choisir ses colocataires",
      excerpt: "Les critères essentiels pour trouver des colocataires compatibles à La Réunion.",
      content: "Choisir ses colocataires est crucial pour une colocation réussie. Voici nos conseils :\n\n• Définissez vos priorités : budget, style de vie, horaires\n• Organisez des rencontres avant de vous engager\n• Discutez des règles de vie commune\n• Vérifiez la compatibilité des personnalités\n• Établissez un contrat de colocation clair",
      category: "Vie en colocation",
      readTime: "5 min",
      image: "/images/conseils-colocataires.jpg"
    },
    {
      id: 2,
      title: "Gérer les charges et le budget",
      excerpt: "Tout savoir sur la répartition des charges dans une colocation réunionnaise.",
      content: "La gestion financière est un aspect important de la colocation :\n\n• Répartissez équitablement les charges communes\n• Utilisez des applications de partage de frais\n• Tenez un registre des dépenses partagées\n• Prévoyez un fonds commun pour les imprévus\n• Communiquez ouvertement sur les questions d'argent",
      category: "Budget",
      readTime: "4 min",
      image: "/images/budget-colocation.jpg"
    },
    {
      id: 3,
      title: "Organiser l'espace de vie commune",
      excerpt: "Optimisez votre espace de vie partagé pour plus de confort.",
      content: "Un espace bien organisé améliore la vie en colocation :\n\n• Définissez des zones personnelles et communes\n• Investissez dans du rangement intelligent\n• Créez des espaces de détente partagés\n• Organisez un planning de ménage\n• Respectez l'intimité de chacun",
      category: "Organisation",
      readTime: "6 min",
      image: "/images/organisation-espace.jpg"
    },
    {
      id: 4,
      title: "Résoudre les conflits de colocation",
      excerpt: "Nos conseils pour gérer les tensions et maintenir une bonne ambiance.",
      content: "Les conflits sont inévitables, voici comment les gérer :\n\n• Communiquez rapidement et directement\n• Organisez des réunions de colocation régulières\n• Écoutez les besoins de chacun\n• Trouvez des compromis équitables\n• N'hésitez pas à faire appel à un médiateur si nécessaire",
      category: "Relations",
      readTime: "7 min",
      image: "/images/conflits-colocation.jpg"
    }
  ];

  const actualites = [
    {
      id: 1,
      title: "Nouvelle réglementation sur les colocations à La Réunion",
      excerpt: "Les nouvelles règles qui impactent les colocataires en 2024.",
      date: "15 Janvier 2024",
      category: "Légal",
      readTime: "8 min",
      image: "/images/reglementation-colocation.jpg"
    },
    {
      id: 2,
      title: "Aide au logement : ce qui change pour les colocations",
      excerpt: "Les modifications des aides CAF pour les colocataires réunionnais.",
      date: "10 Janvier 2024",
      category: "Aides",
      readTime: "6 min",
      image: "/images/aides-logement.jpg"
    },
    {
      id: 3,
      title: "Tendances colocation 2024 : ce qui plaît aux Réunionnais",
      excerpt: "Les nouvelles préférences des colocataires à La Réunion.",
      date: "5 Janvier 2024",
      category: "Tendances",
      readTime: "5 min",
      image: "/images/tendances-colocation.jpg"
    }
  ];

  const astuces = [
    {
      id: 1,
      title: "Économiser sur les courses alimentaires",
      excerpt: "Comment réduire ses dépenses alimentaires en colocation.",
      tip: "Organisez des achats groupés et cuisinez ensemble pour réduire les coûts.",
      category: "Économies",
      difficulty: "Facile"
    },
    {
      id: 2,
      title: "Optimiser sa facture d'électricité",
      excerpt: "Réduire sa consommation énergétique en colocation.",
      tip: "Installez des multiprises avec interrupteur et sensibilisez vos colocataires aux économies d'énergie.",
      category: "Écologie",
      difficulty: "Moyen"
    },
    {
      id: 3,
      title: "Créer un planning de ménage efficace",
      excerpt: "Organiser le nettoyage pour éviter les tensions.",
      tip: "Utilisez une application de planning partagé et alternez les tâches selon les préférences de chacun.",
      category: "Organisation",
      difficulty: "Facile"
    },
    {
      id: 4,
      title: "Décorer sans se ruiner",
      excerpt: "Personnaliser son espace avec un budget limité.",
      tip: "Organisez des ateliers DIY entre colocataires et récupérez des objets pour les customiser.",
      category: "Décoration",
      difficulty: "Facile"
    }
  ];

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
            🌺 Conseils & Astuces Colocation
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent leading-tight">
            Idées Pratiques
            <br />
            <span className="text-4xl md:text-5xl">pour votre colocation</span>
          </h1>
          <p className="text-xl md:text-2xl text-sky-100 max-w-3xl mx-auto leading-relaxed">
            Découvrez nos conseils d'experts, actualités et astuces pour réussir votre colocation à La Réunion
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white shadow-lg border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-2 py-3">
            {[
              { key: 'conseils', label: 'Conseils', icon: '💡', color: 'sky' },
              { key: 'actualites', label: 'Actualités', icon: '📰', color: 'purple' },
              { key: 'astuces', label: 'Astuces', icon: '✨', color: 'pink' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`relative py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.key
                    ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg shadow-${tab.color}-500/25`
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.key && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Publicité */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <AdBlock 
          placementKey="idees-pratiques.hero" 
          title="Nos partenaires"
          variant="featured"
          className="max-w-4xl mx-auto"
        />
      </section>

      {/* Content */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        {activeTab === 'conseils' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {conseils.map((conseil, index) => (
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
                  <button className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold group-hover:gap-3 transition-all duration-300">
                    Lire la suite
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'actualites' && (
          <div className="space-y-8">
            {actualites.map((actualite, index) => (
              <article 
                key={actualite.id} 
                className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 border border-white/20"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="md:flex">
                  <div className="relative md:w-1/3 h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-500">📰</div>
                    <div className="absolute top-4 right-4 w-3 h-3 bg-purple-400 rounded-full animate-pulse-slow"></div>
                  </div>
                  <div className="md:w-2/3 p-8">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 px-3 py-1 rounded-full text-xs font-semibold border border-purple-200">
                        {actualite.category}
                      </span>
                      <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded-full">{actualite.date}</span>
                      <span className="text-slate-500 text-xs bg-slate-100 px-2 py-1 rounded-full">{actualite.readTime}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4 text-slate-800 group-hover:text-purple-600 transition-colors duration-300">
                      {actualite.title}
                    </h3>
                    <p className="text-slate-600 mb-6 leading-relaxed text-lg">{actualite.excerpt}</p>
                    <button className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group-hover:gap-3 transition-all duration-300">
                      Lire l'article
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'astuces' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {astuces.map((astuce, index) => (
              <article 
                key={astuce.id} 
                className="group bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-8 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-white/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-100 via-rose-100 to-yellow-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg">
                    <span className="text-3xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700 px-3 py-1 rounded-full text-xs font-semibold border border-pink-200">
                        {astuce.category}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        astuce.difficulty === 'Facile' 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200'
                          : 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        {astuce.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-pink-600 transition-colors duration-300">
                      {astuce.title}
                    </h3>
                    <p className="text-slate-600 mb-4 leading-relaxed">{astuce.excerpt}</p>
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border-l-4 border-pink-400 p-4 rounded-r-xl shadow-sm">
                      <div className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                        <p className="text-slate-700 font-medium leading-relaxed">{astuce.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
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
              href="/"
              className="group border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-sky-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                Voir les profils
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
