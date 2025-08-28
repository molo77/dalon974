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

async function addConfigColumn() {
  console.log('🔧 Ajout de la colonne config à ScraperRun...\n');
  
  try {
    // Vérifier la connexion à la base de données
    console.log('📊 Test de connexion à la base de données...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion à la base de données réussie');
    
    // Vérifier si la colonne config existe déjà
    console.log('\n🔍 Vérification de la colonne config...');
    
    try {
      // Test pour voir si la colonne config existe
      await prisma.$queryRaw`SELECT config FROM ScraperRun LIMIT 1`;
      console.log('✅ Colonne config existe déjà');
    } catch (e) {
      console.log('❌ Colonne config manquante - ajout en cours...');
      
      // Ajouter la colonne config
      try {
        await prisma.$executeRawUnsafe('ALTER TABLE ScraperRun ADD COLUMN config JSON');
        console.log('✅ Colonne config ajoutée avec succès');
      } catch (e) {
        console.log(`⚠️ Erreur lors de l'ajout de la colonne config: ${e.message}`);
      }
    }
    
    console.log('\n✅ Opération terminée !');
    console.log('💡 La colonne config devrait maintenant être disponible dans ScraperRun');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'opération:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addConfigColumn();
