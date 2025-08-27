const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Vérification du contenu de la base de données...\n');

  // Vérifier les annonces
  const annonces = await prisma.annonce.findMany();
  console.log(`📋 Annonces trouvées: ${annonces.length}`);
  if (annonces.length > 0) {
    console.log('Première annonce:', annonces[0]);
  }

  // Vérifier les profils coloc
  const colocs = await prisma.colocProfile.findMany();
  console.log(`🏠 Profils coloc trouvés: ${colocs.length}`);
  if (colocs.length > 0) {
    console.log('Premier profil coloc:', colocs[0]);
  }

  // Vérifier les utilisateurs
  const users = await prisma.user.findMany();
  console.log(`👥 Utilisateurs trouvés: ${users.length}`);

  // Si pas de données, ajouter des exemples
  if (annonces.length === 0 && colocs.length === 0) {
    console.log('\n➕ Ajout de données de test...');
    
    // Ajouter un utilisateur de test
    const user = await prisma.user.upsert({
      where: { email: 'test@example.com' },
      update: {},
      create: {
        email: 'test@example.com',
        name: 'Utilisateur Test',
        role: 'user'
      }
    });
    console.log('✅ Utilisateur créé:', user.email);

    // Ajouter une annonce de test
    const annonce = await prisma.annonce.create({
      data: {
        id: 'test-annonce-1',
        userId: user.id,
        title: 'Colocation disponible à Saint-Denis',
        description: 'Belle colocation dans un appartement moderne, proche du centre-ville et des transports.',
        ville: 'Saint-Denis',
        prix: 450,
        surface: 25,
        nbChambres: 1,
        typeBien: 'Appartement',
        meuble: true,
        nbPieces: 3,
        disponibleAPartir: '2024-01-01'
      }
    });
    console.log('✅ Annonce créée:', annonce.title);

    // Ajouter un profil coloc de test
    const coloc = await prisma.colocProfile.create({
      data: {
        id: 'test-coloc-1',
        userId: user.id,
        title: 'Colocataire cherche logement',
        description: 'Étudiant de 22 ans cherche une colocation sympa sur Saint-Denis ou alentours.',
        ville: 'Saint-Denis',
        budget: 500,
        age: 22,
        profession: 'Étudiant',
        communesSlugs: ['saint-denis', 'sainte-suzanne']
      }
    });
    console.log('✅ Profil coloc créé:', coloc.title);
  }

  console.log('\n✅ Vérification terminée!');
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
