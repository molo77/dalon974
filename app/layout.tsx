import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'
import MaintenanceAlert from '@/components/MaintenanceAlert'

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
        <AuthProvider>
          {children}
          {/* Alerte de maintenance globale */}
          <MaintenanceAlert 
            showOnHealthy={false}
            autoHide={true}
            hideDelay={3000}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
