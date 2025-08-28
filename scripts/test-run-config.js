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

async function testRunConfig() {
  console.log('🧪 Test de la sauvegarde de configuration dans les runs...\n');
  
  try {
    // Récupérer les settings actuels
    const settings = await prisma.scraperSetting.findMany();
    const settingsMap = {};
    settings.forEach(setting => {
      if (setting.value) settingsMap[setting.key] = setting.value;
    });
    
    console.log('📊 Configuration actuelle:');
    Object.entries(settingsMap).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });
    
    // Créer un run de test avec la configuration
    console.log('\n🔄 Création d\'un run de test avec configuration...');
    const testRun = await prisma.scraperRun.create({
      data: {
        status: 'success',
        config: settingsMap,
        totalCollected: 42,
        createdCount: 10,
        updatedCount: 5,
        progress: 1.0,
        finishedAt: new Date()
      }
    });
    
    console.log(`✅ Run de test créé: ${testRun.id}`);
    
    // Vérifier que la configuration a été sauvegardée
    const savedRun = await prisma.scraperRun.findUnique({
      where: { id: testRun.id }
    });
    
    console.log('\n📋 Configuration sauvegardée dans le run:');
    if (savedRun?.config) {
      Object.entries(savedRun.config).forEach(([key, value]) => {
        console.log(`   • ${key}: ${value}`);
      });
      
      // Vérifier spécifiquement LBC_USE_PROTONVPN
      const useProtonVPN = savedRun.config.LBC_USE_PROTONVPN;
      console.log(`\n🔌 LBC_USE_PROTONVPN dans le run: ${useProtonVPN}`);
      console.log(`   • Affichage dans l'interface: ${useProtonVPN === 'true' ? 'Oui' : 'Non'}`);
    } else {
      console.log('❌ Aucune configuration trouvée dans le run');
    }
    
    // Nettoyer le run de test
    await prisma.scraperRun.delete({
      where: { id: testRun.id }
    });
    console.log('\n🧹 Run de test supprimé');
    
    console.log('\n✅ Test terminé !');
    console.log('💡 La configuration devrait maintenant être affichée correctement dans l\'interface admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testRunConfig();
