#!/usr/bin/env node

/**
 * Script pour vérifier les données de publicités dans la base
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAds() {
  try {
    console.log('🔍 Vérification des données de publicités...');

    const allAds = await prisma.adUnit.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 ${allAds.length} unités publicitaires trouvées:`);
    allAds.forEach(ad => {
      console.log(`  - ${ad.name} (${ad.placementKey}) - Actif: ${ad.isActive}`);
    });

    const activeAds = await prisma.adUnit.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n✅ ${activeAds.length} unités publicitaires actives:`);
    activeAds.forEach(ad => {
      console.log(`  - ${ad.name} (${ad.placementKey})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkAds();
