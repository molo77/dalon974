const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Correction de la configuration du scraper...\n');
  
  try {
    // Configuration par défaut pour le scraper
    const defaultConfig = {
      'LBC_SEARCH_URL': 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
      'LBC_BROWSER_HEADLESS': 'true',
      'LBC_MAX': '40',
      'LBC_FETCH_DETAILS': 'true',
      'LBC_DETAIL_LIMIT': '12',
      'LBC_DETAIL_SLEEP': '500',
      'LBC_PAGES': '1',
      'LBC_VERBOSE_LIST': 'false',
      'LBC_EXPORT_JSON': 'false',
      'LBC_NO_DB': 'false',
      'LBC_UPDATE_COOLDOWN_HOURS': '0',
      'LBC_EXTRA_SLEEP': '0',
      'LBC_COOKIES': '',
      'LBC_DEBUG': 'false'
    };

    console.log('📋 Ajout des configurations manquantes...');
    
    for (const [key, value] of Object.entries(defaultConfig)) {
      const existing = await prisma.scraperSetting.findFirst({
        where: { key }
      });

      if (!existing) {
        await prisma.scraperSetting.create({
          data: { key, value }
        });
        console.log(`✅ Ajouté: ${key} = ${value}`);
      } else {
        console.log(`⏭️ Déjà configuré: ${key} = ${existing.value}`);
      }
    }

    console.log('\n🎯 Configuration finale:');
    const allSettings = await prisma.scraperSetting.findMany({
      orderBy: { key: 'asc' }
    });
    
    allSettings.forEach(s => {
      console.log(`- ${s.key}: ${s.value}`);
    });

    console.log('\n✅ Configuration du scraper corrigée !');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
