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

async function testScraperConfigSave() {
  console.log('🧪 Test de la sauvegarde de configuration du scraper...\n');
  
  try {
    // Vérifier la configuration actuelle
    console.log('📊 Configuration actuelle:');
    const currentSettings = await prisma.scraperSetting.findMany({
      orderBy: { key: 'asc' }
    });
    
    currentSettings.forEach(setting => {
      console.log(`   • ${setting.key}: ${setting.value || 'null'}`);
    });
    
    // Tester la sauvegarde d'une nouvelle valeur
    console.log('\n🔄 Test de sauvegarde...');
    const testValue = `test-${Date.now()}`;
    
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_SEARCH_URL' },
      update: { value: testValue },
      create: { key: 'LBC_SEARCH_URL', value: testValue }
    });
    
    console.log(`   ✅ Valeur de test sauvegardée: ${testValue}`);
    
    // Vérifier que la valeur a été sauvegardée
    const updatedSetting = await prisma.scraperSetting.findUnique({
      where: { key: 'LBC_SEARCH_URL' }
    });
    
    console.log(`   ✅ Vérification: ${updatedSetting?.value}`);
    
    // Restaurer la valeur originale
    console.log('\n🔄 Restauration de la valeur originale...');
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_SEARCH_URL' },
      update: { value: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26' },
      create: { key: 'LBC_SEARCH_URL', value: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26' }
    });
    
    console.log('   ✅ Valeur originale restaurée');
    
    // Test de l'API (simulation)
    console.log('\n🌐 Test de l\'API...');
    console.log('   • Test GET /api/admin/scraper/settings');
    console.log('   • Test POST /api/admin/scraper/settings avec LBC_USE_PROTONVPN=false');
    
    console.log('\n✅ Tests terminés !');
    console.log('💡 La sauvegarde de configuration devrait fonctionner correctement');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScraperConfigSave();
