const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!value.startsWith('#')) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
  console.log('✅ Variables d\'environnement chargées depuis .env.local');
} else {
  console.log('⚠️ Fichier .env.local non trouvé');
}

const prisma = new PrismaClient();

async function applySchemaFix() {
  console.log('🔧 Application des corrections du schéma Prisma...\n');
  
  try {
    // Vérifier la connexion à la base de données
    console.log('📊 Test de connexion à la base de données...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier si les nouvelles colonnes existent déjà
    console.log('\n🔍 Vérification des colonnes existantes...');
    
    try {
      // Test pour voir si la colonne bioCourte existe
      await prisma.$queryRaw`SELECT bioCourte FROM ColocProfile LIMIT 1`;
      console.log('✅ Colonne bioCourte existe déjà');
    } catch (e) {
      console.log('❌ Colonne bioCourte manquante - ajout en cours...');
      
      // Ajouter les nouvelles colonnes
      const alterQueries = [
        'ALTER TABLE ColocProfile ADD COLUMN bioCourte TEXT',
        'ALTER TABLE ColocProfile ADD COLUMN genre VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN orientation VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN langues JSON',
        'ALTER TABLE ColocProfile ADD COLUMN instagram VARCHAR(255)',
        'ALTER TABLE ColocProfile ADD COLUMN telephone VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN dateDispo VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN prefGenre VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN prefAgeMin INT',
        'ALTER TABLE ColocProfile ADD COLUMN prefAgeMax INT',
        'ALTER TABLE ColocProfile ADD COLUMN accepteFumeurs BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN accepteAnimaux BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN rythme VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN proprete VARCHAR(50)',
        'ALTER TABLE ColocProfile ADD COLUMN sportif BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN vegetarien BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN soirees BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN musique VARCHAR(255)',
        'ALTER TABLE ColocProfile ADD COLUMN fumeur BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN animaux BOOLEAN',
        'ALTER TABLE ColocProfile ADD COLUMN quartiers TEXT',
        'ALTER TABLE ColocProfile ADD COLUMN interets JSON',
        'ALTER TABLE ColocProfile ADD COLUMN codePostal VARCHAR(10)',
        'ALTER TABLE Annonce ADD COLUMN source VARCHAR(50)'
      ];
      
      for (const query of alterQueries) {
        try {
          await prisma.$executeRawUnsafe(query);
          console.log(`✅ ${query}`);
        } catch (e) {
          console.log(`⚠️ ${query} - ${e.message}`);
        }
      }
    }
    
    console.log('\n✅ Corrections du schéma appliquées avec succès !');
    console.log('💡 Vous pouvez maintenant utiliser les nouveaux champs dans vos scripts');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des corrections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applySchemaFix();
