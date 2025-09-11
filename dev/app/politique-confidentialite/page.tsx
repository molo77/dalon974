import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité - RodColoc',
  description: 'Politique de confidentialité et protection des données personnelles de RodColoc',
}

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">
            Politique de Confidentialité
          </h1>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 mb-6">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Collecte des données</h2>
              <p className="text-slate-600 mb-4">
                RodColoc collecte les données personnelles suivantes :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                <li><strong>Données de profil :</strong> âge, profession, préférences de colocation</li>
                <li><strong>Données de localisation :</strong> zones géographiques recherchées</li>
                <li><strong>Données de communication :</strong> messages échangés entre utilisateurs</li>
                <li><strong>Données techniques :</strong> adresse IP, cookies, logs de connexion</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Finalités du traitement</h2>
              <p className="text-slate-600 mb-4">
                Vos données sont utilisées pour :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Fournir le service de mise en relation pour la colocation</li>
                <li>Faciliter la communication entre utilisateurs</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Assurer la sécurité et prévenir les fraudes</li>
                <li>Respecter nos obligations légales</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Base légale</h2>
              <p className="text-slate-600 mb-4">
                Le traitement de vos données repose sur :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Votre consentement</strong> pour l'utilisation de cookies non essentiels</li>
                <li><strong>L'exécution du contrat</strong> pour la fourniture du service</li>
                <li><strong>L'intérêt légitime</strong> pour la sécurité et l'amélioration du service</li>
                <li><strong>L'obligation légale</strong> pour la conservation des données</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Partage des données</h2>
              <p className="text-slate-600 mb-4">
                Vos données peuvent être partagées avec :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Autres utilisateurs :</strong> informations de profil pour la mise en relation</li>
                <li><strong>Prestataires techniques :</strong> hébergement, maintenance, analytics</li>
                <li><strong>Autorités compétentes :</strong> en cas d'obligation légale</li>
              </ul>
              <p className="text-slate-600 mb-4">
                <strong>Nous ne vendons jamais vos données personnelles à des tiers.</strong>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Conservation des données</h2>
              <p className="text-slate-600 mb-4">
                Vos données sont conservées :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Données de compte :</strong> jusqu'à suppression du compte</li>
                <li><strong>Messages :</strong> 3 ans après la dernière activité</li>
                <li><strong>Logs techniques :</strong> 12 mois maximum</li>
                <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Vos droits</h2>
              <p className="text-slate-600 mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Droit d'accès :</strong> consulter vos données personnelles</li>
                <li><strong>Droit de rectification :</strong> corriger des données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> supprimer vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement</li>
                <li><strong>Droit de limitation :</strong> limiter le traitement</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Pour exercer ces droits, contactez-nous à : <a href="mailto:contact@rodcoloc.fr" className="text-blue-600 hover:underline">contact@rodcoloc.fr</a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Cookies</h2>
              <p className="text-slate-600 mb-4">
                Nous utilisons des cookies pour :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li><strong>Cookies essentiels :</strong> fonctionnement du site (obligatoires)</li>
                <li><strong>Cookies de performance :</strong> analyse d'audience (avec consentement)</li>
                <li><strong>Cookies de fonctionnalité :</strong> personnalisation (avec consentement)</li>
              </ul>
              <p className="text-slate-600 mb-4">
                Vous pouvez gérer vos préférences de cookies via la bannière de consentement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Sécurité</h2>
              <p className="text-slate-600 mb-4">
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Chiffrement des données sensibles</li>
                <li>Accès restreint aux données personnelles</li>
                <li>Surveillance et audit réguliers</li>
                <li>Formation du personnel à la protection des données</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Contact</h2>
              <p className="text-slate-600 mb-4">
                Pour toute question concernant cette politique de confidentialité :
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">
                  <strong>Email :</strong> <a href="mailto:contact@rodcoloc.fr" className="text-blue-600 hover:underline">contact@rodcoloc.fr</a><br/>
                  <strong>Adresse :</strong> La Réunion, France<br/>
                  <strong>Délégué à la Protection des Données :</strong> contact@rodcoloc.fr
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">10. Modifications</h2>
              <p className="text-slate-600 mb-4">
                Cette politique peut être modifiée. Les modifications importantes vous seront notifiées par email ou via le site.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
