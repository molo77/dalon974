import { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité',
  description: 'Politique de confidentialité de RodColoc - Protection des données personnelles et respect de la vie privée.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/politique-confidentialite',
  },
}

export default function PolitiqueConfidentialitePage() {
  const breadcrumbData = [
    { name: "Accueil", url: "https://rodcoloc.re" },
    { name: "Politique de Confidentialité", url: "https://rodcoloc.re/politique-confidentialite" }
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
            <span className="text-gray-600">Politique de Confidentialité</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Politique de Confidentialité
            </h1>
            
            <div className="prose max-w-none">
              <p className="text-gray-600 mb-6">
                <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Collecte des informations
              </h2>
              <p className="text-gray-700 mb-4">
                RodColoc collecte des informations personnelles lorsque vous vous inscrivez sur notre site, 
                créez un profil, publiez une annonce ou utilisez nos services. Les informations collectées 
                incluent votre nom, adresse e-mail, numéro de téléphone, et autres informations que vous 
                choisissez de partager.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Utilisation des informations
              </h2>
              <p className="text-gray-700 mb-4">
                Nous utilisons vos informations personnelles pour :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Fournir et améliorer nos services de colocation</li>
                <li>Faciliter la communication entre utilisateurs</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Envoyer des notifications importantes</li>
                <li>Assurer la sécurité de notre plateforme</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Protection des données
              </h2>
              <p className="text-gray-700 mb-4">
                Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations 
                personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction. 
                Vos données sont stockées de manière sécurisée et ne sont partagées qu'avec votre consentement 
                explicite.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Partage d'informations
              </h2>
              <p className="text-gray-700 mb-4">
                Nous ne vendons, n'échangeons ni ne louons vos informations personnelles à des tiers. 
                Nous pouvons partager vos informations uniquement dans les cas suivants :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Avec votre consentement explicite</li>
                <li>Pour se conformer à la loi ou à une procédure judiciaire</li>
                <li>Pour protéger nos droits, notre propriété ou notre sécurité</li>
                <li>Avec des prestataires de services de confiance qui nous aident à exploiter notre site</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Vos droits
              </h2>
              <p className="text-gray-700 mb-4">
                Conformément au RGPD, vous avez le droit de :
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Accéder à vos données personnelles</li>
                <li>Rectifier des informations inexactes</li>
                <li>Supprimer vos données personnelles</li>
                <li>Limiter le traitement de vos données</li>
                <li>Vous opposer au traitement de vos données</li>
                <li>Portabilité de vos données</li>
              </ul>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Notre site utilise des cookies pour améliorer votre expérience de navigation. 
                Vous pouvez contrôler l'utilisation des cookies via les paramètres de votre navigateur.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Si vous avez des questions concernant cette politique de confidentialité, 
                veuillez nous contacter à l'adresse suivante :
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-800">
                  <strong>Email :</strong> contact@rodcoloc.re<br />
                  <strong>Adresse :</strong> La Réunion, France
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Modifications
              </h2>
              <p className="text-gray-700 mb-4">
                Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. 
                Les modifications seront publiées sur cette page avec une date de mise à jour révisée.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}