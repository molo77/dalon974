import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/features/auth/AuthProvider'
import { MessagesProvider } from '@/shared/MessagesContext'
import { MatchesProvider } from '@/shared/MatchesContext'
import MaintenanceAlert from '@/shared/components/maintenance/MaintenanceAlert'
import Header from '@/shared/components/Header'
import Footer from '@/shared/components/Footer'
import LeafletStyles from '@/shared/components/map/LeafletStyles'
import { ErrorBoundary } from '@/shared/components'

import { GlobalToast } from '@/shared/components/ui/feedback/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RodColoc - Colocation à La Réunion',
  description: 'Trouvez votre colocataire idéal à La Réunion',
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
                </MatchesProvider>
              </MessagesProvider>
            </AuthProvider>
          {/* </ServerStatusChecker> */}
        </ErrorBoundary>
      </body>
    </html>
  )
}
