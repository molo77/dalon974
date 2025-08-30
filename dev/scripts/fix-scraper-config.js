#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixScraperConfig() {
  console.log('🔧 Correction de la configuration du scraper...\n');
  
  try {
    // Configuration par défaut à ajouter
    const defaultSettings = [
      { key: 'LBC_SEARCH_URL', value: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26' },
      { key: 'LBC_BROWSER_HEADLESS', value: 'true' },
      { key: 'LBC_MAX', value: '20' },
      { key: 'LBC_FETCH_DETAILS', value: 'false' },
      { key: 'LBC_DETAIL_LIMIT', value: '5' },
      { key: 'LBC_PAGES', value: '1' },
      { key: 'LBC_DEBUG', value: 'false' },
      { key: 'LBC_USE_PROTONVPN', value: 'false' },
      { key: 'LBC_DELAY_BETWEEN_REQUESTS', value: '2000' }
    ];
    
    console.log('📋 Ajout des paramètres de configuration par défaut...');
    
    for (const setting of defaultSettings) {
      try {
        await prisma.scraperSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: { key: setting.key, value: setting.value }
        });
        console.log(`✅ ${setting.key}: ${setting.value}`);
      } catch (error) {
        console.log(`⚠️ Erreur pour ${setting.key}: ${error.message}`);
      }
    }
    
    // Vérifier les paramètres existants
    console.log('\n📊 Paramètres actuels:');
    const settings = await prisma.scraperSetting.findMany();
    
    if (settings.length === 0) {
      console.log('❌ Aucun paramètre trouvé');
    } else {
      settings.forEach(setting => {
        console.log(`- ${setting.key}: ${setting.value}`);
      });
    }
    
    console.log('\n✅ Configuration corrigée !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
fixScraperConfig();
