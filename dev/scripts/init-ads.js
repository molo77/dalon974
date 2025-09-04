#!/usr/bin/env node

/**
 * Script pour initialiser les données de publicités AdSense
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initAds() {
  try {
    console.log('🚀 Initialisation des données de publicités AdSense...');

    const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "0000000000";
    console.log(`📝 Utilisation du slot: ${slot}`);

    // Créer ou mettre à jour les unités publicitaires
    const ads = [
      {
        id: "seed-home-below-hero",
        name: "Home dessous image",
        placementKey: "home.initial.belowHero",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 90,
        isActive: true,
      },
      {
        id: "seed-listing-inline-1",
        name: "Listing inline #1",
        placementKey: "listing.inline.1",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 90,
        isActive: true,
      },
      {
        id: "seed-home-right-sidebar",
        name: "Home droite (sidebar)",
        placementKey: "home.list.rightSidebar",
        slot,
        format: "auto",
        fullWidthResponsive: true,
        height: 600,
        isActive: true,
      },
    ];

    for (const ad of ads) {
      const result = await prisma.adUnit.upsert({
        where: { id: ad.id },
        update: {
          slot: ad.slot,
          format: ad.format,
          fullWidthResponsive: ad.fullWidthResponsive,
          height: ad.height,
          isActive: ad.isActive,
          updatedAt: new Date(),
        },
        create: ad,
      });
      console.log(`✅ ${ad.name} (${ad.placementKey}) - ${result.id}`);
    }

    console.log('🎉 Initialisation terminée !');
    
    // Vérifier les données créées
    const allAds = await prisma.adUnit.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 ${allAds.length} unités publicitaires actives:`);
    allAds.forEach(ad => {
      console.log(`  - ${ad.name} (${ad.placementKey})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

initAds();
