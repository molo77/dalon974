const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Vérification de la configuration du scraper...\n');
  
  try {
    const settings = await prisma.scraperSetting.findMany({
      orderBy: { key: 'asc' }
    });

    if (settings.length === 0) {
      console.log('❌ Aucune configuration trouvée dans la base de données');
      console.log('\n📋 Configuration par défaut du scraper:');
      console.log('- LBC_SEARCH_URL: https://www.leboncoin.fr/recherche?category=11&locations=r_26');
      console.log('- LBC_BROWSER_HEADLESS: true');
      console.log('- LBC_MAX: 40');
      console.log('- LBC_FETCH_DETAILS: true');
      console.log('- LBC_DETAIL_LIMIT: 12');
      console.log('- LBC_PAGES: 1');
      console.log('- LBC_DEBUG: false');
    } else {
      console.log('✅ Configuration actuelle:');
      settings.forEach(s => {
        console.log(`- ${s.key}: ${s.value || '(non défini)'}`);
      });
    }

    // Vérifier les dernières exécutions
    console.log('\n📊 Dernières exécutions du scraper:');
    const recentRuns = await prisma.scraperRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    });

    if (recentRuns.length === 0) {
      console.log('❌ Aucune exécution trouvée');
    } else {
      recentRuns.forEach((run, index) => {
        console.log(`${index + 1}. ${run.startedAt.toLocaleString()} - ${run.status} - Collectées: ${run.totalCollected || 0}`);
        if (run.errorMessage) {
          console.log(`   Erreur: ${run.errorMessage}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
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
