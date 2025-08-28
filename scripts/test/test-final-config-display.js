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

async function testFinalConfigDisplay() {
  console.log('🧪 Test final de l\'affichage de configuration dans les runs...\n');
  
  try {
    // Créer deux runs de test avec des configurations différentes
    console.log('🔄 Création de runs de test...');
    
    // Run 1: ProtonVPN désactivé
    const run1 = await prisma.scraperRun.create({
      data: {
        status: 'success',
        config: {
          LBC_USE_PROTONVPN: 'false',
          LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
          LBC_MAX: '40'
        },
        totalCollected: 25,
        createdCount: 5,
        updatedCount: 3,
        progress: 1.0,
        finishedAt: new Date()
      }
    });
    
    // Run 2: ProtonVPN activé
    const run2 = await prisma.scraperRun.create({
      data: {
        status: 'success',
        config: {
          LBC_USE_PROTONVPN: 'true',
          LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
          LBC_MAX: '40'
        },
        totalCollected: 30,
        createdCount: 8,
        updatedCount: 4,
        progress: 1.0,
        finishedAt: new Date()
      }
    });
    
    console.log(`✅ Run 1 créé: ${run1.id} (ProtonVPN: false)`);
    console.log(`✅ Run 2 créé: ${run2.id} (ProtonVPN: true)`);
    
    // Récupérer les runs pour vérifier l'affichage
    const runs = await prisma.scraperRun.findMany({
      where: {
        id: { in: [run1.id, run2.id] }
      },
      orderBy: { startedAt: 'asc' }
    });
    
    console.log('\n📋 Affichage simulé dans l\'interface admin:');
    console.log('┌─────────────────────────────────────────────────────────────────────────────────────────────────┐');
    console.log('│ Début                    │ Fin                      │ Statut │ Progress │ Collectées │ Use Proton │');
    console.log('├─────────────────────────────────────────────────────────────────────────────────────────────────┤');
    
    runs.forEach((run, index) => {
      const startTime = run.startedAt ? new Date(run.startedAt).toLocaleString() : '-';
      const endTime = run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '-';
      const status = run.status || '-';
      const progress = run.progress ? `${Math.round(run.progress * 100)}%` : '-';
      const collected = run.totalCollected || '-';
      const useProton = run.config?.LBC_USE_PROTONVPN === 'true' ? 'Oui' : 'Non';
      const protonColor = run.config?.LBC_USE_PROTONVPN === 'true' ? '🟢' : '⚪';
      
      console.log(`│ ${startTime.padEnd(22)} │ ${endTime.padEnd(22)} │ ${status.padEnd(6)} │ ${progress.padEnd(8)} │ ${String(collected).padEnd(10)} │ ${protonColor} ${useProton.padEnd(8)} │`);
    });
    
    console.log('└─────────────────────────────────────────────────────────────────────────────────────────────────┘');
    
    console.log('\n💡 Légende:');
    console.log('   🟢 Oui = ProtonVPN activé pour ce run');
    console.log('   ⚪ Non = ProtonVPN désactivé pour ce run');
    
    // Nettoyer les runs de test
    await prisma.scraperRun.deleteMany({
      where: {
        id: { in: [run1.id, run2.id] }
      }
    });
    console.log('\n🧹 Runs de test supprimés');
    
    console.log('\n✅ Test terminé !');
    console.log('💡 L\'interface admin devrait maintenant afficher correctement la configuration de chaque run');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalConfigDisplay();
