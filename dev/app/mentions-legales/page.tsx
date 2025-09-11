import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mentions Légales - RodColoc',
  description: 'Mentions légales et informations sur l\'éditeur du site RodColoc',
}

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-8">
            Mentions Légales
          </h1>
          
          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">1. Éditeur du site</h2>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">
                  <strong>Nom :</strong> RodColoc<br/>
                  <strong>Adresse :</strong> La Réunion, France<br/>
                  <strong>Email :</strong> <a href="mailto:contact@rodcoloc.fr" className="text-blue-600 hover:underline">contact@rodcoloc.fr</a><br/>
                  <strong>Directeur de publication :</strong> Équipe RodColoc
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">2. Hébergement</h2>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">
                  <strong>Hébergeur :</strong> [Nom de l'hébergeur]<br/>
                  <strong>Adresse :</strong> [Adresse de l'hébergeur]<br/>
                  <strong>Téléphone :</strong> [Téléphone de l'hébergeur]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">3. Objet du site</h2>
              <p className="text-slate-600 mb-4">
                RodColoc est une plateforme de mise en relation pour la colocation à La Réunion. 
                Le site permet aux utilisateurs de :
              </p>
              <ul className="list-disc list-inside text-slate-600 mb-4 space-y-2">
                <li>Créer un profil de recherche de colocation</li>
                <li>Consulter les annonces de colocation</li>
                <li>Communiquer avec d'autres utilisateurs</li>
                <li>Partager des idées pratiques pour la vie en colocation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">4. Conditions d'utilisation</h2>
              <p className="text-slate-600 mb-4">
                L'utilisation du site implique l'acceptation pleine et entière des conditions générales d'utilisation. 
                Ces conditions peuvent être modifiées à tout moment.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">5. Propriété intellectuelle</h2>
              <p className="text-slate-600 mb-4">
                L'ensemble du contenu du site (textes, images, vidéos, logos, etc.) est protégé par le droit d'auteur. 
                Toute reproduction, distribution ou utilisation sans autorisation est interdite.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">6. Responsabilité</h2>
              <p className="text-slate-600 mb-4">
                RodColoc s'efforce de fournir des informations exactes et à jour. Cependant, nous ne pouvons garantir 
                l'exactitude, la précision ou l'exhaustivité des informations mises à disposition.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">7. Liens externes</h2>
              <p className="text-slate-600 mb-4">
                Le site peut contenir des liens vers d'autres sites web. RodColoc n'est pas responsable du contenu 
                de ces sites externes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">8. Droit applicable</h2>
              <p className="text-slate-600 mb-4">
                Le présent site est soumis au droit français. En cas de litige, les tribunaux français seront seuls compétents.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-4">9. Contact</h2>
              <p className="text-slate-600 mb-4">
                Pour toute question concernant ces mentions légales :
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">
                  <strong>Email :</strong> <a href="mailto:contact@rodcoloc.fr" className="text-blue-600 hover:underline">contact@rodcoloc.fr</a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
