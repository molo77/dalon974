"use client";

import { useState } from "react";
// import Image from "next/image";
import Link from "next/link";
import AdBlock from "@/shared/components/AdBlock";
import SocialShare from "@/shared/components/SocialShare";
import { useActualites } from "@/shared/hooks/useActualites";

export default function IdeesPratiquesPage() {
  const [activeTab, setActiveTab] = useState<'conseils' | 'actualites' | 'astuces'>('conseils');
  const { actualites, loading: actualitesLoading, error: actualitesError, refreshActualites } = useActualites();

  const conseils = [
    {
      id: 1,
      title: "Pourquoi la colocation explose à La Réunion",
      excerpt: "Découvrez les raisons de l'engouement pour la colocation sur l'île intense.",
      content: "La colocation connaît un essor remarquable à La Réunion avec +20% de croissance en 5 ans. Plus de 10 000 personnes sont engagées dans des contrats de colocation sur l'île :\n\n• Économies significatives sur le loyer et les charges\n• Intégration sociale facilitée pour les nouveaux arrivants\n• Partage des responsabilités du quotidien\n• Enrichissement culturel dans une île métissée\n• Solution flexible pour étudiants et jeunes professionnels\n• Opportunité d'investissement pour les propriétaires\n• Réduction du risque de vacance locative",
      category: "Contexte réunionnais",
      readTime: "6 min",
      image: "/images/colocation-reunion.jpg"
    },
    {
      id: 2,
      title: "Les meilleurs quartiers pour la colocation",
      excerpt: "Guide des zones les plus propices à la colocation à La Réunion.",
      content: "Choisir le bon quartier est essentiel pour une colocation réussie :\n\n• Saint-Denis : dynamisme économique, universités, transports\n• Saint-Pierre : ambiance étudiante, proximité plages\n• Saint-Gilles : tourisme, activités nautiques, vie nocturne\n• Le Tampon : calme, nature, budget accessible\n• Saint-Paul : équilibre ville/campagne, marché local\n\nConsidérez : proximité travail/études, transports, commerces, sécurité",
      category: "Géographie",
      readTime: "8 min",
      image: "/images/quartiers-reunion.jpg"
    },
    {
      id: 3,
      title: "Aspects juridiques et financiers spécifiques",
      excerpt: "Tout savoir sur la réglementation colocation à La Réunion.",
      content: "La colocation à La Réunion suit le droit français avec quelques spécificités :\n\n• Contrat de colocation obligatoire (solidarité ou indivision)\n• Aides CAF : APL calculées selon la situation de chacun\n• Charges : électricité, eau, internet, taxe d'habitation\n• Assurance : responsabilité civile et habitation\n• Déclaration fiscale : partage des revenus locatifs\n• Dépôt de garantie : réparti entre colocataires",
      category: "Légal",
      readTime: "10 min",
      image: "/images/legal-colocation.jpg"
    },
    {
      id: 4,
      title: "Gérer les différences culturelles en colocation",
      excerpt: "Comment vivre harmonieusement avec des colocataires d'horizons différents.",
      content: "La Réunion, île métissée, offre une richesse culturelle unique :\n\n• Respect des traditions : créole, tamoul, chinois, malgache\n• Cuisine partagée : échange de recettes traditionnelles\n• Fêtes et célébrations : participation aux événements culturels\n• Langues : créole, français, langues d'origine\n• Religion : respect des pratiques spirituelles\n• Communication : ouverture d'esprit et tolérance",
      category: "Culture",
      readTime: "7 min",
      image: "/images/culture-reunion.jpg"
    },
    {
      id: 5,
      title: "Colocation vs Coliving : quelle différence ?",
      excerpt: "Comprendre les nouvelles tendances d'habitat partagé à La Réunion.",
      content: "Deux approches complémentaires de l'habitat partagé :\n\n**Colocation traditionnelle :**\n• Partage d'un logement privé\n• Gestion autonome des colocataires\n• Budget maîtrisé, liberté d'organisation\n\n**Coliving moderne :**\n• Espaces conçus pour la communauté\n• Services inclus (ménage, coworking, événements)\n• Flexibilité, réseau social intégré\n• Idéal pour digital nomads et expatriés\n\nChoisissez selon vos priorités : économie vs services",
      category: "Tendances",
      readTime: "9 min",
      image: "/images/coliving-reunion.jpg"
    },
    {
      id: 6,
      title: "Résoudre les conflits avec bienveillance",
      excerpt: "Techniques de médiation adaptées à la culture réunionnaise.",
      content: "La résolution de conflits à La Réunion privilégie l'harmonie :\n\n• Approche créole : dialogue direct mais respectueux\n• Médiation communautaire : faire appel aux aînés\n• Temps de pause : laisser le temps aux émotions\n• Solutions collectives : impliquer toute la colocation\n• Respect de l'harmonie : éviter les tensions durables\n• Célébrations communes : renforcer les liens",
      category: "Relations",
      readTime: "6 min",
      image: "/images/mediation-reunion.jpg"
    },
    {
      id: 7,
      title: "Services innovants : Keylodge Living et La Kaz",
      excerpt: "Découvrez les nouvelles plateformes qui révolutionnent la colocation à La Réunion.",
      content: "De nouveaux services transforment l'expérience de la colocation à La Réunion :\n\n**Keylodge Living :**\n• Service de colocation sécurisée\n• Garantie de loyers pour les propriétaires\n• Entretien régulier des biens\n• Solutions pour étudiants et professionnels\n\n**La Kaz :**\n• Plateforme locale spécialisée\n• Services adaptés aux spécificités de l'île\n• Mise en relation facilitée\n• Accompagnement personnalisé\n\nCes innovations répondent aux besoins croissants du marché réunionnais.",
      category: "Services",
      readTime: "8 min",
      image: "/images/services-innovants.jpg"
    }
  ];


  const astuces = [
    {
      id: 1,
      title: "Cuisiner créole à plusieurs",
      excerpt: "Partager les recettes traditionnelles réunionnaises en colocation.",
      tip: "Organisez des soirées cuisine où chacun enseigne une spécialité de son origine : rougail saucisse, cari poulet, samoussas...",
      category: "Culture",
      difficulty: "Facile"
    },
    {
      id: 2,
      title: "Économiser sur les produits locaux",
      excerpt: "Profiter des marchés réunionnais pour réduire les coûts alimentaires.",
      tip: "Faites vos courses ensemble aux marchés forains (Saint-Pierre, Saint-Denis) et négociez les prix en achetant en gros.",
      category: "Économies",
      difficulty: "Facile"
    },
    {
      id: 3,
      title: "Gérer la climatisation en colocation",
      excerpt: "Optimiser l'usage de la clim pour réduire la facture d'électricité.",
      tip: "Établissez des règles : 24°C minimum, fermeture des volets la journée, utilisation par zones selon les besoins.",
      category: "Écologie",
      difficulty: "Moyen"
    },
    {
      id: 4,
      title: "Organiser des sorties nature ensemble",
      excerpt: "Profiter des richesses naturelles de l'île en groupe.",
      tip: "Planifiez des randonnées, sorties plage ou visites de sites naturels en covoiturage pour partager les frais de transport.",
      category: "Loisirs",
      difficulty: "Facile"
    },
    {
      id: 5,
      title: "Créer un potager partagé",
      excerpt: "Cultiver ensemble des légumes tropicaux sur votre balcon ou jardin.",
      tip: "Plantez des brèdes, tomates, piments et herbes aromatiques. Chacun s'occupe d'une plante et vous partagez la récolte.",
      category: "Écologie",
      difficulty: "Moyen"
    },
    {
      id: 6,
      title: "Gérer les fêtes et célébrations",
      excerpt: "Organiser les événements culturels et religieux en colocation.",
      tip: "Respectez les fêtes de chacun (Divali, Nouvel An chinois, Noël créole) et participez aux célébrations pour renforcer les liens.",
      category: "Culture",
      difficulty: "Facile"
    },
    {
      id: 7,
      title: "Optimiser le transport en commun",
      excerpt: "Utiliser efficacement les transports publics réunionnais en groupe.",
      tip: "Achetez des cartes de transport groupées, organisez des covoiturages pour les trajets quotidiens et partagez les frais d'essence.",
      category: "Transport",
      difficulty: "Facile"
    },
    {
      id: 8,
      title: "Créer un système d'entraide",
      excerpt: "Mettre en place une solidarité entre colocataires pour les imprévus.",
      tip: "Établissez un fonds commun pour les urgences, organisez un système de garde d'animaux et d'aide mutuelle en cas de besoin.",
      category: "Solidarité",
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
          
          {/* Partage social */}
          <div className="mt-8 flex justify-center">
            <SocialShare
              title="Idées Pratiques - Colocation à La Réunion"
              description="Découvrez nos conseils d'experts, actualités et astuces pour réussir votre colocation à La Réunion"
              hashtags={["RodColoc", "Colocation", "LaReunion", "974", "Conseils", "Astuces"]}
              variant="compact"
              showLabels={false}
              className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/30"
            />
          </div>
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
                  <Link 
                    href={`/conseils/${conseil.slug}`}
                    className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold group-hover:gap-3 transition-all duration-300"
                  >
                    Lire la suite
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        {activeTab === 'actualites' && (
          <div className="space-y-6">
            {/* Bouton de rafraîchissement */}
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Actualités Colocation La Réunion</h2>
              <button
                onClick={refreshActualites}
                disabled={actualitesLoading}
                className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actualitesLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Chargement...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualiser
                  </>
                )}
              </button>
            </div>

            {/* Message d'erreur */}
            {actualitesError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 font-medium">Erreur lors du chargement des actualités</p>
                </div>
                <p className="text-red-600 text-sm mt-1">{actualitesError}</p>
              </div>
            )}

            {/* Loading state */}
            {actualitesLoading && actualites.length === 0 && (
              <div className="space-y-8">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden border border-white/20">
                    <div className="md:flex">
                      <div className="md:w-1/3 h-48 bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 animate-pulse"></div>
                      <div className="md:w-2/3 p-8">
                        <div className="h-4 bg-slate-200 rounded mb-4 animate-pulse"></div>
                        <div className="h-8 bg-slate-200 rounded mb-4 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded mb-2 animate-pulse"></div>
                        <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actualités dynamiques */}
            {!actualitesLoading && actualites.length > 0 && (
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
                        <p className="text-slate-600 mb-4 leading-relaxed text-lg">{actualite.excerpt}</p>
                        
                        {/* Source et lien */}
                        {actualite.source && (
                          <div className="mb-4">
                            <p className="text-xs text-slate-500">
                              Source: <span className="font-medium">{actualite.source}</span>
                            </p>
                          </div>
                        )}
                        
                        {actualite.url ? (
                          <a
                            href={actualite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold group-hover:gap-3 transition-all duration-300"
                          >
                            Lire l'article complet
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                    <span className="inline-flex items-center gap-2 text-purple-400 font-semibold cursor-not-allowed">
                      Article complet bientôt disponible
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </span>
                        )}
                  </div>
                </div>
              </article>
            ))}
              </div>
            )}

            {/* Message si aucune actualité */}
            {!actualitesLoading && actualites.length === 0 && !actualitesError && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📰</div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Aucune actualité disponible</h3>
                <p className="text-slate-600 mb-4">Les actualités seront bientôt disponibles.</p>
                <button
                  onClick={refreshActualites}
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Réessayer
                </button>
              </div>
            )}
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
              href="/conseils"
              className="group border-2 border-white text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white hover:text-sky-600 transition-all duration-300 transform hover:scale-105 backdrop-blur-sm"
            >
              <span className="flex items-center gap-2">
                Guide complet des conseils
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
