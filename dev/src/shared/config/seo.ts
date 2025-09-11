// Configuration SEO centralisée pour RodColoc

export const SEO_CONFIG = {
  // Informations de base
  siteName: 'RodColoc',
  siteUrl: 'https://rodcoloc.re',
  defaultTitle: 'RodColoc - Colocation à La Réunion',
  defaultDescription: 'Trouvez votre colocataire idéal à La Réunion. Annonces de colocation, profils de colocataires et recherche de logement partagé sur l\'île de La Réunion.',
  
  // Images par défaut
  defaultOgImage: '/images/og-image.jpg',
  defaultTwitterImage: '/images/og-image.jpg',
  
  // Mots-clés principaux
  defaultKeywords: [
    'colocation',
    'La Réunion',
    'logement partagé',
    'colocataire',
    'annonce colocation',
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
    'recherche logement',
    'partage logement'
  ],
  
  // Communes de La Réunion
  communes: [
    'Saint-Denis', 'Saint-Pierre', 'Le Tampon', 'Saint-Paul',
    'Saint-André', 'Saint-Benoît', 'Saint-Louis', 'Saint-Joseph',
    'Sainte-Marie', 'Sainte-Suzanne', 'Sainte-Rose', 'Salazie',
    'Cilaos', 'Entre-Deux', 'Petite-Île', 'Les Avirons',
    'L\'Étang-Salé', 'Saint-Leu', 'Trois-Bassins', 'Bras-Panon',
    'Saint-Philippe', 'La Plaine-des-Palmistes', 'Sainte-Anne'
  ],
  
  // Types de colocation
  typesColocation: [
    'Étudiante',
    'Professionnelle', 
    'Familiale',
    'Mixte',
    'Senior'
  ],
  
  // Configuration des réseaux sociaux
  social: {
    facebook: 'https://www.facebook.com/rodcoloc',
    instagram: 'https://www.instagram.com/rodcoloc',
    twitter: 'https://www.twitter.com/rodcoloc'
  },
  
  // Contact
  contact: {
    email: 'contact@rodcoloc.re',
    phone: '+262 XXX XX XX XX',
    address: 'La Réunion, France'
  }
}

// Fonction utilitaire pour générer des métadonnées
export function generateMetadata({
  title,
  description,
  keywords = [],
  image,
  url,
  type = 'website'
}: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
}) {
  const fullTitle = title ? `${title} | ${SEO_CONFIG.siteName}` : SEO_CONFIG.defaultTitle
  const fullDescription = description || SEO_CONFIG.defaultDescription
  const fullKeywords = [...SEO_CONFIG.defaultKeywords, ...keywords]
  const fullImage = image || SEO_CONFIG.defaultOgImage
  const fullUrl = url ? `${SEO_CONFIG.siteUrl}${url}` : SEO_CONFIG.siteUrl

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      type,
      url: fullUrl,
      image: fullImage,
      siteName: SEO_CONFIG.siteName,
      locale: 'fr_FR'
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      image: fullImage
    },
    alternates: {
      canonical: url || '/'
    }
  }
}

// Fonction pour générer des données structurées d'organisation
export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "logo": `${SEO_CONFIG.siteUrl}/images/logo.png`,
    "description": SEO_CONFIG.defaultDescription,
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR",
      "addressRegion": "La Réunion"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "French",
      "email": SEO_CONFIG.contact.email
    },
    "sameAs": Object.values(SEO_CONFIG.social)
  }
}

// Fonction pour générer des données structurées de site web
export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SEO_CONFIG.siteName,
    "url": SEO_CONFIG.siteUrl,
    "description": SEO_CONFIG.defaultDescription,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SEO_CONFIG.siteUrl}/annonces?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }
}

// Fonction pour générer des données structurées d'annonce
export function generateAnnouncementStructuredData(annonce: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": annonce.title || "Annonce de colocation",
    "description": annonce.description,
    "url": `${SEO_CONFIG.siteUrl}/annonces/${annonce.id}`,
    "price": annonce.prix,
    "priceCurrency": "EUR",
    "availability": "https://schema.org/InStock",
    "validFrom": annonce.createdAt,
    "areaServed": {
      "@type": "City",
      "name": annonce.ville || "La Réunion"
    },
    "category": "RealEstate",
    "offeredBy": {
      "@type": "Organization",
      "name": SEO_CONFIG.siteName
    }
  }
}

// Fonction pour générer des données structurées de profil
export function generateProfileStructuredData(profile: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.title || "Profil de colocataire",
    "description": profile.description,
    "url": `${SEO_CONFIG.siteUrl}/colocataires/${profile.id}`,
    "knowsAbout": profile.interets || [],
    "address": {
      "@type": "PostalAddress",
      "addressLocality": profile.ville || "La Réunion",
      "addressCountry": "FR"
    }
  }
}
