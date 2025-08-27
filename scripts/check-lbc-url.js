const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Vérification de LBC_SEARCH_URL...\n');
  
  try {
    const searchUrlSetting = await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_SEARCH_URL' }
    });

    if (searchUrlSetting) {
      console.log('✅ LBC_SEARCH_URL trouvé:', searchUrlSetting.value);
    } else {
      console.log('❌ LBC_SEARCH_URL non configuré');
      console.log('📋 URL par défaut attendue: https://www.leboncoin.fr/recherche?category=11&locations=r_26');
    }

    // Vérifier toutes les configurations
    const allSettings = await prisma.scraperSetting.findMany({
      orderBy: { key: 'asc' }
    });

    console.log('\n📊 Toutes les configurations:');
    allSettings.forEach(s => {
      console.log(`- ${s.key}: ${s.value}`);
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
