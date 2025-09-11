import { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Profils de Colocataires à La Réunion',
  description: 'Découvrez les profils de colocataires à La Réunion. Trouvez la personne idéale pour partager votre logement sur l\'île.',
  keywords: [
    'profils colocataires',
    'colocataire La Réunion',
    'recherche colocataire',
    'logement partagé',
    'Saint-Denis',
    'Saint-Pierre',
    'Le Tampon',
    'Saint-Paul',
    'Saint-André',
    'Saint-Benoît',
    'Saint-Louis',
    'Saint-Joseph',
    'Sainte-Marie',
    'Sainte-Suzanne',
    'Sainte-Rose',
    'Salazie',
    'Cilaos',
    'Entre-Deux',
    'Petite-Île',
    'Les Avirons',
    'L\'Étang-Salé',
    'Saint-Leu',
    'Trois-Bassins',
    'Bras-Panon',
    'Saint-Philippe',
    'La Plaine-des-Palmistes',
    'Sainte-Anne',
    'partage logement'
  ],
  openGraph: {
    title: 'Profils de Colocataires à La Réunion',
    description: 'Découvrez les profils de colocataires à La Réunion. Trouvez la personne idéale pour partager votre logement sur l\'île.',
    type: 'website',
    url: 'https://rodcoloc.re/colocataires',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Profils de Colocataires à La Réunion',
    description: 'Découvrez les profils de colocataires à La Réunion. Trouvez la personne idéale pour partager votre logement sur l\'île.',
  },
  alternates: {
    canonical: '/colocataires',
  },
}

export default function ColocatairesPage() {
  const breadcrumbData = [
    { name: "Accueil", url: "https://rodcoloc.re" },
    { name: "Colocataires", url: "https://rodcoloc.re/colocataires" }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadcrumbJsonLd items={breadcrumbData} />
      
      {/* Breadcrumb visuel */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 py-4">
            <a href="/" className="text-blue-600 hover:text-blue-800">Accueil</a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-600">Colocataires</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Profils de Colocataires à La Réunion
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez les profils de colocataires disponibles sur l'île de La Réunion. 
            Trouvez la personne idéale pour partager votre logement.
          </p>
        </div>

        {/* Redirection vers la page d'accueil avec l'onglet colocataires */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Consultez les profils de colocataires
          </h2>
          <p className="text-gray-600 mb-6">
            Tous les profils de colocataires sont disponibles sur notre page d'accueil 
            avec des filtres pour faciliter votre recherche.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Voir les profils
          </a>
        </div>

        {/* Informations sur les types de colocation */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Types de colocation disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Colocation étudiante</h3>
              <p className="text-gray-600">
                Parfait pour les étudiants qui cherchent un logement partagé 
                près des universités et écoles de La Réunion.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Colocation professionnelle</h3>
              <p className="text-gray-600">
                Idéal pour les jeunes actifs qui souhaitent partager un logement 
                tout en gardant leur indépendance.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Colocation familiale</h3>
              <p className="text-gray-600">
                Pour les familles qui cherchent à partager un logement plus grand 
                ou à réduire leurs coûts de logement.
              </p>
            </div>
          </div>
        </div>

        {/* Avantages de la colocation */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Pourquoi choisir la colocation à La Réunion ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 Économies</h3>
              <p className="text-gray-600">
                Partagez les frais de logement, d'électricité, d'internet et d'autres charges 
                pour réduire significativement vos coûts mensuels.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🤝 Convivialité</h3>
              <p className="text-gray-600">
                Créez des liens d'amitié durables et partagez des moments conviviaux 
                avec vos colocataires dans un environnement chaleureux.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🏠 Logements plus grands</h3>
              <p className="text-gray-600">
                Accédez à des logements plus spacieux et mieux équipés que vous ne pourriez 
                pas vous permettre seul.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🌴 Découverte</h3>
              <p className="text-gray-600">
                Découvrez La Réunion avec des personnes qui connaissent bien l'île 
                et partagez vos expériences et découvertes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
