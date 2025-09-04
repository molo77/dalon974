const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('➕ Ajout de données de test...\n');

  // Récupérer un utilisateur existant ou en créer un
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Utilisateur Test',
        role: 'user'
      }
    });
    console.log('✅ Utilisateur créé:', user.email);
  } else {
    console.log('✅ Utilisateur existant utilisé:', user.email);
  }

  // Ajouter des annonces de test
  const annonces = [
    {
      id: 'test-annonce-1',
      title: 'Colocation disponible à Saint-Denis',
      description: 'Belle colocation dans un appartement moderne, proche du centre-ville et des transports. Chambre meublée de 15m² avec salle de bain privative.',
      ville: 'Saint-Denis',
      prix: 450,
      surface: 15,
      nbChambres: 1,
      typeBien: 'Appartement',
      meuble: true,
      nbPieces: 4,
      disponibleAPartir: '2024-01-01'
    },
    {
      id: 'test-annonce-2',
      title: 'Chambre en colocation à Sainte-Suzanne',
      description: 'Chambre dans une maison avec jardin, quartier calme. Idéal pour étudiant ou jeune professionnel. Charges comprises.',
      ville: 'Sainte-Suzanne',
      prix: 380,
      surface: 12,
      nbChambres: 1,
      typeBien: 'Maison',
      meuble: true,
      nbPieces: 5,
      disponibleAPartir: '2024-01-15'
    },
    {
      id: 'test-annonce-3',
      title: 'Studio en colocation à Saint-André',
      description: 'Studio entièrement rénové, meublé et équipé. Proche des commerces et des transports. Idéal pour une personne seule.',
      ville: 'Saint-André',
      prix: 520,
      surface: 20,
      nbChambres: 1,
      typeBien: 'Studio',
      meuble: true,
      nbPieces: 1,
      disponibleAPartir: '2024-02-01'
    }
  ];

  for (const annonceData of annonces) {
    try {
      const annonce = await prisma.annonce.upsert({
        where: { id: annonceData.id },
        update: annonceData,
        create: {
          ...annonceData,
          userId: user.id
        }
      });
      console.log(`✅ Annonce créée/mise à jour: ${annonce.title} (${annonce.ville})`);
    } catch (error) {
      console.log(`⚠️ Erreur pour l'annonce ${annonceData.title}:`, error.message);
    }
  }

  console.log('\n✅ Données de test ajoutées!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
