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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateProtonVPNWait() {
  console.log('🧪 Simulation de l\'attente automatique ProtonVPN...\n');
  
  try {
    // Activer ProtonVPN temporairement pour le test
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_USE_PROTONVPN' },
      update: { value: 'true' },
      create: { key: 'LBC_USE_PROTONVPN', value: 'true' }
    });
    
    console.log('✅ ProtonVPN activé pour le test');
    
    // Simuler la fonction promptUserForProtonVPN
    console.log('\n🔄 Changement d\'IP avec ProtonVPN');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez l\'application ProtonVPN');
    console.log('2. Déconnectez-vous si vous êtes connecté');
    console.log('3. Connectez-vous à un serveur français (FR) ou européen (NL, DE)');
    console.log('4. Vérifiez que l\'IP a changé sur https://whatismyipaddress.com/');
    console.log('5. Le script attendra automatiquement 30 secondes...');
    
    console.log('\n⏰ Attente automatique de 30 secondes...');
    console.log('💡 Simulation en cours (5 secondes au lieu de 30 pour le test)...');
    await sleep(5000); // 5 secondes pour le test
    console.log('✅ Attente terminée, continuation...');
    
    // Remettre ProtonVPN à false
    await prisma.scraperSetting.upsert({
      where: { key: 'LBC_USE_PROTONVPN' },
      update: { value: 'false' },
      create: { key: 'LBC_USE_PROTONVPN', value: 'false' }
    });
    
    console.log('\n✅ Test terminé !');
    console.log('💡 Le script attend maintenant automatiquement 30 secondes au lieu de demander d\'appuyer sur Entrée');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simulateProtonVPNWait();
