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

async function testProtonVPNAutoWait() {
  console.log('🧪 Test de l\'attente automatique ProtonVPN...\n');
  
  try {
    // Vérifier la configuration actuelle
    const settings = await prisma.scraperSetting.findMany();
    const config = {};
    settings.forEach(setting => {
      config[setting.key] = setting.value;
    });
    
    console.log('📊 Configuration actuelle:');
    console.log(`   • LBC_USE_PROTONVPN: ${config.LBC_USE_PROTONVPN || 'non définie'}`);
    console.log(`   • LBC_SEARCH_URL: ${config.LBC_SEARCH_URL || 'non définie'}`);
    
    // Simuler la logique du script
    const useProtonVPN = config.LBC_USE_PROTONVPN === 'true';
    
    if (useProtonVPN) {
      console.log('\n🔌 ProtonVPN activé - test de l\'attente automatique...');
      console.log('📋 Instructions affichées :');
      console.log('1. Ouvrez l\'application ProtonVPN');
      console.log('2. Déconnectez-vous si vous êtes connecté');
      console.log('3. Connectez-vous à un serveur français (FR) ou européen (NL, DE)');
      console.log('4. Vérifiez que l\'IP a changé sur https://whatismyipaddress.com/');
      console.log('5. Le script attendra automatiquement 30 secondes...');
      
      console.log('\n⏰ Simulation de l\'attente automatique de 30 secondes...');
      console.log('💡 Dans le vrai script, cela attendrait 30 secondes');
      console.log('✅ Attente terminée, continuation...');
    } else {
      console.log('\n🔌 ProtonVPN désactivé par configuration (LBC_USE_PROTONVPN=false)');
      console.log('💡 Aucune attente nécessaire');
    }
    
    console.log('\n✅ Test terminé !');
    console.log('💡 Le script devrait maintenant attendre automatiquement 30 secondes au lieu de demander d\'appuyer sur Entrée');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProtonVPNAutoWait();
