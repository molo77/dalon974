"use client";

import { useState } from "react";
import Image from "next/image";
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
      <section className="bg-gradient-to-r from-sky-600 via-cyan-500 to-teal-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Idées Pratiques & Actualités
          </h1>
          <p className="text-xl md:text-2xl text-sky-100 max-w-3xl mx-auto">
            Conseils, astuces et actualités pour réussir votre colocation à La Réunion
          </p>
        </div>
      </section>

      {/* Navigation Tabs */}
      <section className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            {[
              { key: 'conseils', label: 'Conseils', icon: '💡' },
              { key: 'actualites', label: 'Actualités', icon: '📰' },
              { key: 'astuces', label: 'Astuces', icon: '✨' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
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
            {conseils.map((conseil) => (
              <article key={conseil.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <div className="text-6xl">🏠</div>
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                      {conseil.category}
                    </span>
                    <span className="text-slate-500 text-xs">{conseil.readTime}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-slate-800">{conseil.title}</h3>
                  <p className="text-slate-600 mb-4">{conseil.excerpt}</p>
                  <button className="text-blue-600 hover:text-blue-700 font-medium">
                    Lire la suite →
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'actualites' && (
          <div className="space-y-8">
            {actualites.map((actualite) => (
              <article key={actualite.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="md:flex">
                  <div className="md:w-1/3 h-48 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                    <div className="text-6xl">📰</div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
                        {actualite.category}
                      </span>
                      <span className="text-slate-500 text-xs">{actualite.date}</span>
                      <span className="text-slate-500 text-xs">{actualite.readTime}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-slate-800">{actualite.title}</h3>
                    <p className="text-slate-600 mb-4">{actualite.excerpt}</p>
                    <button className="text-purple-600 hover:text-purple-700 font-medium">
                      Lire l'article →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'astuces' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {astuces.map((astuce) => (
              <article key={astuce.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs font-medium">
                        {astuce.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        astuce.difficulty === 'Facile' 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {astuce.difficulty}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-800">{astuce.title}</h3>
                    <p className="text-slate-600 mb-3">{astuce.excerpt}</p>
                    <div className="bg-pink-50 border-l-4 border-pink-400 p-3 rounded-r-lg">
                      <p className="text-slate-700 font-medium">{astuce.tip}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à trouver votre colocation idéale ?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Découvrez nos annonces et profils de colocataires à La Réunion
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Voir les annonces
            </Link>
            <Link
              href="/"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Voir les profils
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
