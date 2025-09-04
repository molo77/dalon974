import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/auth/AuthProvider'
import { MessagesProvider } from '@/contexts/MessagesContext'
import MaintenanceAlert from '@/components/maintenance/MaintenanceAlert'
import Header from '@/components/layout/Header'
import LeafletStyles from '@/components/map/LeafletStyles'
import ErrorBoundary from '@/components/ErrorBoundary'
import ServerStatusChecker from '@/components/ServerStatusChecker'

import { GlobalToast } from '@/components/ui/feedback/Toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dalon974 - Colocation à La Réunion',
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
          <ServerStatusChecker>
            <AuthProvider>
              <MessagesProvider>
                <Header />
                <main>
                  {children}
                </main>
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
              </MessagesProvider>
            </AuthProvider>
          </ServerStatusChecker>
        </ErrorBoundary>
      </body>
    </html>
  )
}
