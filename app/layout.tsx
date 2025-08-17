import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css"; // + Leaflet CSS
import Header from "@/components/Header"; 
import ClientProviders from "@/components/ClientProviders";
import { GlobalToast } from "@/components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dalon974",
  description: "Annonces de colocation à La Réunion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-b from-slate-50 to-white text-slate-800`}
      >
        {/* Mitigation hydratation: retire un attribut ajouté par certaines extensions avant que React n'hydrate */}
        <Script id="cleanup-ext-attrs" strategy="beforeInteractive">
          {`
            try {
              if (typeof document !== 'undefined' && document.body) {
                document.body.removeAttribute('inmaintabuse');
              }
            } catch (_) {}
          `}
        </Script>
        <ClientProviders>
          <Header />
          <main className="mx-auto w-[85%] max-w-full px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          {/* Toaster global pour toute l’application */}
          <GlobalToast />
        </ClientProviders>
      </body>
    </html>
  );
}
