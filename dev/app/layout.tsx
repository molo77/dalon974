import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/features/auth/AuthProvider'
import { MessagesProvider } from '@/shared/MessagesContext'
import { MatchesProvider } from '@/shared/MatchesContext'
import MaintenanceAlert from '@/shared/components/maintenance/MaintenanceAlert'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import CookieBanner from '@/shared/components/CookieBanner'
import LeafletStyles from '@/shared/components/map/LeafletStyles'
import { ErrorBoundary } from '@/shared/components'

import { GlobalToast } from '@/shared/components/ui/feedback/Toast'
import { OrganizationJsonLd, WebsiteJsonLd } from '@/shared/components/seo/JsonLd'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'RodColoc - Colocation à La Réunion',
    template: '%s | RodColoc'
  },
  description: 'Trouvez votre colocataire idéal à La Réunion. Annonces de colocation, profils de colocataires et recherche de logement partagé sur l\'île de La Réunion.',
  keywords: [
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
    'Saint-Joseph',
    'recherche logement',
    'partage logement'
  ],
  authors: [{ name: 'RodColoc' }],
  creator: 'RodColoc',
  publisher: 'RodColoc',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://rodcoloc.re'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://rodcoloc.re',
    title: 'RodColoc - Colocation à La Réunion',
    description: 'Trouvez votre colocataire idéal à La Réunion. Annonces de colocation, profils de colocataires et recherche de logement partagé.',
    siteName: 'RodColoc',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'RodColoc - Colocation à La Réunion',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RodColoc - Colocation à La Réunion',
    description: 'Trouvez votre colocataire idéal à La Réunion. Annonces de colocation, profils de colocataires et recherche de logement partagé.',
    images: ['/images/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ErrorBoundary>
          {/* <ServerStatusChecker> */}
            <AuthProvider>
              <MessagesProvider>
                <MatchesProvider>
                  <Header />
                  <main>
                    {children}
                  </main>
                  <Footer />
                  {/* Alerte de maintenance globale */}
                  <MaintenanceAlert 
                    showOnHealthy={false}
                    autoHide={true}
                    hideDelay={3000}
                  />
                  {/* Styles Leaflet pour la carte */}
                  <LeafletStyles />
                  {/* Toast global */}
                  <GlobalToast />
                  {/* Bannière de cookies RGPD */}
                  <CookieBanner />
                  
                  {/* Données structurées SEO */}
                  <OrganizationJsonLd />
                  <WebsiteJsonLd />
                </MatchesProvider>
              </MessagesProvider>
            </AuthProvider>
          {/* </ServerStatusChecker> */}
        </ErrorBoundary>
      </body>
    </html>
  )
}
