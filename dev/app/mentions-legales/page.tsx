import { Metadata } from 'next'
import { BreadcrumbJsonLd } from '@/shared/components/seo/JsonLd'

export const metadata: Metadata = {
  title: 'Mentions Légales',
  description: 'Mentions légales de RodColoc - Informations légales sur l\'éditeur du site et les conditions d\'utilisation.',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/mentions-legales',
  },
}

export default function MentionsLegalesPage() {
  const breadcrumbData = [
    { name: "Accueil", url: "https://rodcoloc.re" },
    { name: "Mentions Légales", url: "https://rodcoloc.re/mentions-legales" }
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
            <span className="text-gray-600">Mentions Légales</span>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              Mentions Légales
            </h1>
            
            <div className="prose max-w-none">
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Éditeur du site
              </h2>
              <div className="bg-gray-100 p-4 rounded-lg mb-6">
                <p className="text-gray-800">
                  <strong>Nom :</strong> RodColoc<br />
                  <strong>Adresse :</strong> La Réunion, France<br />
                  <strong>Email :</strong> contact@rodcoloc.re<br />
                  <strong>Site web :</strong> https://rodcoloc.re
                </p>
              </div>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Hébergement
              </h2>
              <p className="text-gray-700 mb-4">
                Ce site est hébergé par un prestataire professionnel respectant les standards 
                de sécurité et de performance pour assurer une disponibilité optimale du service.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Propriété intellectuelle
              </h2>
              <p className="text-gray-700 mb-4">
                L'ensemble du contenu de ce site (textes, images, vidéos, logos, graphismes, etc.) 
                est protégé par les droits de propriété intellectuelle. Toute reproduction, 
                distribution, modification, adaptation, retransmission ou publication de ces 
                éléments est strictement interdite sans l'accord exprès par écrit de RodColoc.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Responsabilité
              </h2>
              <p className="text-gray-700 mb-4">
                Les informations contenues sur ce site sont aussi précises que possible et le site 
                remis à jour à différentes périodes de l'année, mais peut toutefois contenir des 
                inexactitudes ou des omissions. RodColoc ne peut être tenu responsable des dommages 
                directs et indirects causés au matériel de l'utilisateur, lors de l'accès au site 
                rodcoloc.re, et résultant soit de l'utilisation d'un matériel ne répondant pas aux 
                spécifications indiquées, soit de l'apparition d'un bug ou d'une incompatibilité.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Liens hypertextes
              </h2>
              <p className="text-gray-700 mb-4">
                Des liens hypertextes peuvent être présents sur le site. L'utilisateur est informé 
                qu'en cliquant sur ces liens, il sortira du site rodcoloc.re. Ce dernier n'a pas 
                de contrôle sur les pages web sur lesquelles aboutissent ces liens et ne saurait, 
                en aucun cas, être responsable de leur contenu.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Collecte et traitement des données
              </h2>
              <p className="text-gray-700 mb-4">
                Conformément à la loi "Informatique et Libertés" du 6 janvier 1978 modifiée et au 
                Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit 
                d'accès, de rectification, de suppression et d'opposition aux données personnelles 
                vous concernant. Pour exercer ce droit, contactez-nous à l'adresse : contact@rodcoloc.re
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Cookies
              </h2>
              <p className="text-gray-700 mb-4">
                Le site rodcoloc.re peut être amené à vous demander l'acceptation des cookies pour 
                des besoins de statistiques et d'affichage. Un cookie est une information déposée 
                sur votre disque dur par le serveur du site que vous visitez. Il contient plusieurs 
                données qui sont stockées sur votre ordinateur dans un simple fichier texte auquel 
                un serveur accède pour lire et enregistrer des informations.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Droit applicable
              </h2>
              <p className="text-gray-700 mb-4">
                Tout litige en relation avec l'utilisation du site rodcoloc.re est soumis au droit 
                français. Il est fait attribution exclusive de juridiction aux tribunaux compétents 
                de La Réunion.
              </p>

              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Contact
              </h2>
              <p className="text-gray-700 mb-4">
                Pour toute question relative aux présentes mentions légales, vous pouvez nous 
                contacter :
              </p>
              <div className="bg-gray-100 p-4 rounded-lg">
                <p className="text-gray-800">
                  <strong>Par email :</strong> contact@rodcoloc.re<br />
                  <strong>Par courrier :</strong> RodColoc, La Réunion, France
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}