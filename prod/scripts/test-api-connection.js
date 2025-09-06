#!/usr/bin/env node

/**
 * Script pour tester la connexion à la base de données depuis l'API
 */

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Test de connexion à la base de données...');
    
    // Test simple
    const count = await prisma.adUnit.count();
    console.log(`📊 Nombre total d'AdUnits: ${count}`);
    
    // Test avec placementKey
    const specific = await prisma.adUnit.findMany({
      where: { 
        isActive: true,
        placementKey: 'home.initial.belowHero'
      }
    });
    console.log(`🎯 AdUnits pour home.initial.belowHero: ${specific.length}`);
    
    if (specific.length > 0) {
      console.log('✅ Données trouvées:', specific[0]);
    }
    
    // Test sans placementKey
    const allActive = await prisma.adUnit.findMany({
      where: { isActive: true }
    });
    console.log(`📋 Toutes les AdUnits actives: ${allActive.length}`);
    
    allActive.forEach(ad => {
      console.log(`  - ${ad.placementKey} (${ad.name})`);
    });
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
