import Script from 'next/script'

interface JsonLdProps {
  data: any
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Composant pour les données structurées d'organisation
export function OrganizationJsonLd() {
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "RodColoc",
    "url": "https://rodcoloc.re",
    "logo": "https://rodcoloc.re/images/logo.png",
    "description": "Plateforme de colocation à La Réunion pour trouver votre colocataire idéal",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "FR",
      "addressRegion": "La Réunion"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "French"
    },
    "sameAs": [
      "https://www.facebook.com/rodcoloc",
      "https://www.instagram.com/rodcoloc"
    ]
  }

  return <JsonLd data={organizationData} />
}

// Composant pour les données structurées de site web
export function WebsiteJsonLd() {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "RodColoc",
    "url": "https://rodcoloc.re",
    "description": "Trouvez votre colocataire idéal à La Réunion",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://rodcoloc.re/annonces?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  }

  return <JsonLd data={websiteData} />
}

// Composant pour les données structurées d'annonce
export function AnnouncementJsonLd({ annonce }: { annonce: any }) {
  const announcementData = {
    "@context": "https://schema.org",
    "@type": "Offer",
    "name": annonce.title || "Annonce de colocation",
    "description": annonce.description,
    "url": `https://rodcoloc.re/annonces/${annonce.id}`,
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
      "name": "RodColoc"
    }
  }

  return <JsonLd data={announcementData} />
}

// Composant pour les données structurées de profil de colocataire
export function ColocProfileJsonLd({ profile }: { profile: any }) {
  const profileData = {
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

  return <JsonLd data={profileData} />
}

// Composant pour les données structurées de breadcrumb
export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return <JsonLd data={breadcrumbData} />
}
