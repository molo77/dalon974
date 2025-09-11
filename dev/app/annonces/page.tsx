import { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Annonces de Colocation à La Réunion',
  description: 'Découvrez toutes les annonces de colocation à La Réunion. Trouvez votre logement partagé idéal dans toutes les communes de l\'île.',
  keywords: [
    'annonces colocation',
    'La Réunion',
    'logement partagé',
    'colocataire',
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
    'recherche logement'
  ],
  openGraph: {
    title: 'Annonces de Colocation à La Réunion',
    description: 'Découvrez toutes les annonces de colocation à La Réunion. Trouvez votre logement partagé idéal dans toutes les communes de l\'île.',
    type: 'website',
    url: 'https://rodcoloc.re/annonces',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Annonces de Colocation à La Réunion',
    description: 'Découvrez toutes les annonces de colocation à La Réunion. Trouvez votre logement partagé idéal dans toutes les communes de l\'île.',
  },
  alternates: {
    canonical: '/annonces',
  },
}

export default function AnnoncesPage() {
  const breadcrumbData = [
    { name: "Accueil", url: "https://rodcoloc.re" },
    { name: "Annonces", url: "https://rodcoloc.re/annonces" }
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
            <span className="text-gray-600">Annonces</span>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Annonces de Colocation à La Réunion
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez toutes les annonces de colocation disponibles sur l'île de La Réunion. 
            Trouvez votre logement partagé idéal dans toutes les communes.
          </p>
        </div>

        {/* Redirection vers la page d'accueil avec l'onglet annonces */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Consultez nos annonces
          </h2>
          <p className="text-gray-600 mb-6">
            Toutes les annonces de colocation sont disponibles sur notre page d'accueil 
            avec des filtres avancés pour faciliter votre recherche.
          </p>
          <a
            href="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Voir les annonces
          </a>
        </div>

        {/* Informations sur les communes */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Colocation dans toutes les communes de La Réunion
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              'Saint-Denis', 'Saint-Pierre', 'Le Tampon', 'Saint-Paul',
              'Saint-André', 'Saint-Benoît', 'Saint-Louis', 'Saint-Joseph',
              'Sainte-Marie', 'Sainte-Suzanne', 'Sainte-Rose', 'Salazie',
              'Cilaos', 'Entre-Deux', 'Petite-Île', 'Les Avirons',
              'L\'Étang-Salé', 'Saint-Leu', 'Trois-Bassins', 'Bras-Panon',
              'Saint-Philippe', 'La Plaine-des-Palmistes', 'Sainte-Anne'
            ].map((commune) => (
              <div key={commune} className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900">{commune}</h3>
                <p className="text-sm text-gray-600">Colocation disponible</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
