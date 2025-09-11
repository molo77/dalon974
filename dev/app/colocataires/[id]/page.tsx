import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/infrastructure/database/prismaClient'
import { ColocProfileJsonLd, BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const profile = await prisma.colocProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!profile) {
      return {
        title: 'Profil introuvable',
        description: 'Ce profil de colocataire n\'existe pas ou n\'est plus disponible.',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const title = `${profile.title || 'Profil colocataire'} - ${profile.ville || 'La Réunion'}`
    const description = profile.description 
      ? `${profile.description.substring(0, 160)}...`
      : `Profil de colocataire à ${profile.ville || 'La Réunion'}${profile.age ? ` - ${profile.age} ans` : ''}`

    return {
      title,
      description,
      keywords: [
        'colocataire',
        'profil colocataire',
        profile.ville || 'La Réunion',
        profile.age ? `${profile.age} ans` : '',
        'recherche colocation',
        'logement partagé'
      ],
      openGraph: {
        title,
        description,
        type: 'profile',
        url: `https://rodcoloc.re/colocataires/${profile.id}`,
        images: profile.photoUrl ? [
          {
            url: profile.photoUrl,
            width: 1200,
            height: 630,
            alt: title,
          }
        ] : undefined,
        publishedTime: profile.createdAt?.toISOString(),
        modifiedTime: profile.updatedAt?.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: profile.photoUrl ? [profile.photoUrl] : undefined,
      },
      alternates: {
        canonical: `/colocataires/${profile.id}`,
      },
    }
  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error)
    return {
      title: 'Profil introuvable',
      description: 'Ce profil de colocataire n\'existe pas ou n\'est plus disponible.',
    }
  }
}

export default async function ColocProfilePage({ params }: PageProps) {
  try {
    const profile = await prisma.colocProfile.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!profile) {
      notFound()
    }

    // Données structurées pour le profil
    const profileStructuredData = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": profile.title || "Profil de colocataire",
      "description": profile.description,
      "url": `https://rodcoloc.re/colocataires/${profile.id}`,
      "knowsAbout": profile.interets || [],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": profile.ville || "La Réunion",
        "addressCountry": "FR"
      }
    }

    // Données structurées pour le breadcrumb
    const breadcrumbData = [
      { name: "Accueil", url: "https://rodcoloc.re" },
      { name: "Colocataires", url: "https://rodcoloc.re/colocataires" },
      { name: profile.title || "Profil", url: `https://rodcoloc.re/colocataires/${profile.id}` }
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Données structurées */}
        <ColocProfileJsonLd profile={profile} />
        <BreadcrumbJsonLd items={breadcrumbData} />
        
        {/* Breadcrumb visuel */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">Accueil</a>
              <span className="text-gray-400">/</span>
              <a href="/colocataires" className="text-blue-600 hover:text-blue-800">Colocataires</a>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{profile.title || "Profil"}</span>
            </div>
          </div>
        </nav>

        {/* Contenu du profil */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {profile.title || "Profil de colocataire"}
              </h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations principales */}
                <div>
                  <div className="space-y-4">
                    {profile.ville && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Ville:</span>
                        <span className="text-gray-900">{profile.ville}</span>
                      </div>
                    )}
                    
                    {profile.age && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Âge:</span>
                        <span className="text-gray-900">{profile.age} ans</span>
                      </div>
                    )}
                    
                    {profile.profession && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Profession:</span>
                        <span className="text-gray-900">{profile.profession}</span>
                      </div>
                    )}
                    
                    {profile.budget && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Budget:</span>
                        <span className="text-gray-900">{profile.budget}€</span>
                      </div>
                    )}
                    
                    {profile.typeColoc && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Type:</span>
                        <span className="text-gray-900">{profile.typeColoc}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Photo */}
                {profile.photoUrl && (
                  <div>
                    <img
                      src={profile.photoUrl}
                      alt={profile.title || "Profil de colocataire"}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Description */}
              {profile.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{profile.description}</p>
                  </div>
                </div>
              )}
              
              {/* Intérêts */}
              {profile.interets && profile.interets.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Intérêts</h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.interets.map((interet, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {interet}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Informations de contact */}
              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Intéressé par ce profil ?</h3>
                <p className="text-green-800">
                  Connectez-vous pour contacter ce colocataire et en savoir plus.
                </p>
                <div className="mt-4">
                  <a
                    href="/auth/signin"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Se connecter
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Erreur lors du chargement du profil:', error)
    notFound()
  }
}
