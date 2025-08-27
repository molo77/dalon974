const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Création d\'un utilisateur admin par défaut...\n');
  
  try {
    // Vérifier si un utilisateur admin existe déjà
    let adminUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'admin@dalon974.fr' },
          { role: 'admin' }
        ]
      }
    });

    if (!adminUser) {
      // Créer un utilisateur admin par défaut
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@dalon974.fr',
          name: 'Admin Dalon974',
          displayName: 'Administrateur',
          role: 'admin',
          password: null, // Pas de mot de passe pour l'admin par défaut
        }
      });
      console.log('✅ Utilisateur admin créé:', adminUser.email);
    } else {
      console.log('✅ Utilisateur admin existant:', adminUser.email);
    }

    console.log('\n📋 Informations utilisateur:');
    console.log('- ID:', adminUser.id);
    console.log('- Email:', adminUser.email);
    console.log('- Nom:', adminUser.name);
    console.log('- Rôle:', adminUser.role);
    
    console.log('\n✅ Utilisateur admin prêt pour les tests !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur admin:', error);
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
