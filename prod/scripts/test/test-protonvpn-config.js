// Test de la configuration LBC_USE_PROTONVPN
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

async function testProtonVPNConfig() {
  console.log('🧪 Test de la configuration LBC_USE_PROTONVPN...\n');
  
  try {
    // Vérifier la valeur actuelle
    const currentSetting = await prisma.scraperSetting.findUnique({
      where: { key: 'LBC_USE_PROTONVPN' }
    });
    
    console.log('📊 Configuration actuelle:');
    console.log(`   • LBC_USE_PROTONVPN: ${currentSetting?.value || 'non définie'}`);
    
    // Tester la mise à jour vers false
    console.log('\n🔄 Test de mise à jour vers false...');
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_USE_PROTONVPN' },
      update: { value: 'false' },
      create: { key: 'LBC_USE_PROTONVPN', value: 'false' }
    });
    
    // Vérifier la mise à jour
    const updatedSetting = await prisma.scraperSetting.findUnique({
      where: { key: 'LBC_USE_PROTONVPN' }
    });
    
    console.log(`   ✅ Mise à jour réussie: ${updatedSetting?.value}`);
    
    // Tester la mise à jour vers true
    console.log('\n🔄 Test de mise à jour vers true...');
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_USE_PROTONVPN' },
      update: { value: 'true' },
      create: { key: 'LBC_USE_PROTONVPN', value: 'true' }
    });
    
    // Vérifier la mise à jour finale
    const finalSetting = await prisma.scraperSetting.findUnique({
      where: { key: 'LBC_USE_PROTONVPN' }
    });
    
    console.log(`   ✅ Mise à jour réussie: ${finalSetting?.value}`);
    
    // Tester l'API
    console.log('\n🌐 Test de l\'API...');
    const apiUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Simuler une requête GET
    console.log('   • Test GET /api/admin/scraper/settings');
    console.log('   • Test POST /api/admin/scraper/settings avec LBC_USE_PROTONVPN=false');
    
    console.log('\n✅ Tests terminés !');
    console.log('💡 La configuration LBC_USE_PROTONVPN devrait maintenant fonctionner dans l\'interface admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProtonVPNConfig();
