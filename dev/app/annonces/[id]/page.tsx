import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import prisma from '@/infrastructure/database/prismaClient'
import { AnnouncementJsonLd, BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const annonce = await prisma.annonce.findUnique({
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

    if (!annonce || annonce.moderationStatus !== 'approved') {
      return {
        title: 'Annonce introuvable',
        description: 'Cette annonce n\'existe pas ou n\'est plus disponible.',
        robots: {
          index: false,
          follow: false,
        },
      }
    }

    const title = `${annonce.title || 'Colocation'} - ${annonce.ville || 'La Réunion'}`
    const description = annonce.description 
      ? `${annonce.description.substring(0, 160)}...`
      : `Colocation à ${annonce.ville || 'La Réunion'}${annonce.prix ? ` - ${annonce.prix}€` : ''}`

    return {
      title,
      description,
      keywords: [
        'colocation',
        annonce.ville || 'La Réunion',
        annonce.prix ? `${annonce.prix}€` : '',
        'logement partagé',
        'colocataire'
      ],
      openGraph: {
        title,
        description,
        type: 'article',
        url: `https://rodcoloc.re/annonces/${annonce.id}`,
        images: annonce.imageUrl ? [
          {
            url: annonce.imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          }
        ] : undefined,
        publishedTime: annonce.createdAt?.toISOString(),
        modifiedTime: annonce.updatedAt?.toISOString(),
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: annonce.imageUrl ? [annonce.imageUrl] : undefined,
      },
      alternates: {
        canonical: `/annonces/${annonce.id}`,
      },
    }
  } catch (error) {
    console.error('Erreur lors de la génération des métadonnées:', error)
    return {
      title: 'Annonce introuvable',
      description: 'Cette annonce n\'existe pas ou n\'est plus disponible.',
    }
  }
}

export default async function AnnoncePage({ params }: PageProps) {
  try {
    const annonce = await prisma.annonce.findUnique({
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

    if (!annonce || annonce.moderationStatus !== 'approved') {
      notFound()
    }

    // Données structurées pour l'annonce
    const announcementStructuredData = {
      "@context": "https://schema.org",
      "@type": "Offer",
      "name": annonce.title || "Annonce de colocation",
      "description": annonce.description,
      "url": `https://rodcoloc.re/annonces/${annonce.id}`,
      "price": annonce.prix,
      "priceCurrency": "EUR",
      "availability": "https://schema.org/InStock",
      "validFrom": annonce.createdAt?.toISOString(),
      "areaServed": {
        "@type": "City",
        "name": annonce.ville || "La Réunion"
      },
      "category": "RealEstate",
      "offeredBy": {
        "@type": "Organization",
        "name": "RodColoc"
      }
    }

    // Données structurées pour le breadcrumb
    const breadcrumbData = [
      { name: "Accueil", url: "https://rodcoloc.re" },
      { name: "Annonces", url: "https://rodcoloc.re/annonces" },
      { name: annonce.title || "Annonce", url: `https://rodcoloc.re/annonces/${annonce.id}` }
    ]

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Données structurées */}
        <AnnouncementJsonLd annonce={annononce} />
        <BreadcrumbJsonLd items={breadcrumbData} />
        
        {/* Breadcrumb visuel */}
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2 py-4">
              <a href="/" className="text-blue-600 hover:text-blue-800">Accueil</a>
              <span className="text-gray-400">/</span>
              <a href="/annonces" className="text-blue-600 hover:text-blue-800">Annonces</a>
              <span className="text-gray-400">/</span>
              <span className="text-gray-600">{annonce.title || "Annonce"}</span>
            </div>
          </div>
        </nav>

        {/* Contenu de l'annonce */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {annonce.title || "Annonce de colocation"}
              </h1>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Informations principales */}
                <div>
                  <div className="space-y-4">
                    {annonce.ville && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Ville:</span>
                        <span className="text-gray-900">{annonce.ville}</span>
                      </div>
                    )}
                    
                    {annonce.prix && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Prix:</span>
                        <span className="text-gray-900 font-bold text-xl">{annonce.prix}€</span>
                      </div>
                    )}
                    
                    {annonce.surface && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Surface:</span>
                        <span className="text-gray-900">{annonce.surface}m²</span>
                      </div>
                    )}
                    
                    {annonce.nbChambres && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Chambres:</span>
                        <span className="text-gray-900">{annonce.nbChambres}</span>
                      </div>
                    )}
                    
                    {annonce.meuble !== null && (
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-700 w-24">Meublé:</span>
                        <span className="text-gray-900">{annonce.meuble ? "Oui" : "Non"}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image */}
                {annonce.imageUrl && (
                  <div>
                    <img
                      src={annonce.imageUrl}
                      alt={annonce.title || "Annonce de colocation"}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
              
              {/* Description */}
              {annonce.description && (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{annonce.description}</p>
                  </div>
                </div>
              )}
              
              {/* Informations de contact */}
              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Intéressé par cette annonce ?</h3>
                <p className="text-blue-800">
                  Connectez-vous pour contacter le propriétaire et en savoir plus sur cette colocation.
                </p>
                <div className="mt-4">
                  <a
                    href="/auth/signin"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
    console.error('Erreur lors du chargement de l\'annonce:', error)
    notFound()
  }
}
