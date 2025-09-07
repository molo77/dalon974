#!/usr/bin/env node

/**
 * Script de configuration du scraper pour utiliser uniquement Datadome
 * Supprime les références à ProtonVPN et configure le scraper pour Datadome
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration optimisée pour Datadome uniquement
const DATADOME_CONFIG = {
  'LBC_SEARCH_URL': 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
  'LBC_BROWSER_HEADLESS': 'true',
  'LBC_MAX': '15', // Réduit pour éviter la détection
  'LBC_FETCH_DETAILS': 'false', // Désactivé pour éviter les blocages
  'LBC_DETAIL_LIMIT': '5',
  'LBC_PAGES': '1',
  'LBC_DEBUG': 'false',
  'LBC_USE_PROTONVPN': 'false', // Désactivé
  'LBC_DELAY_BETWEEN_REQUESTS': '3000', // Augmenté pour éviter la détection
  'LBC_USER_AGENT_ROTATION': 'true', // Rotation des user agents
  'LBC_ANTI_DETECTION': 'true' // Mode anti-détection activé
};

async function configureScraperForDatadome() {
  console.log('🔧 Configuration du scraper pour Datadome uniquement...\n');
  
  try {
    // Vérifier les paramètres existants
    const existingSettings = await prisma.scraperSetting.findMany();
    console.log(`📋 ${existingSettings.length} paramètres existants trouvés`);
    
    // Mettre à jour ou créer les paramètres
    for (const [key, value] of Object.entries(DATADOME_CONFIG)) {
      try {
        await prisma.scraperSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value }
        });
        console.log(`✅ ${key}: ${value}`);
      } catch (error) {
        console.log(`❌ Erreur pour ${key}: ${error.message}`);
      }
    }
    
    // Supprimer les anciens paramètres ProtonVPN s'ils existent
    const protonSettings = [
      'LBC_PROTONVPN_USERNAME',
      'LBC_PROTONVPN_PASSWORD',
      'LBC_PROTONVPN_SERVER',
      'LBC_PROTONVPN_PROTOCOL',
      'LBC_VPN_ENABLED',
      'LBC_USE_VPN'
    ];
    
    for (const key of protonSettings) {
      try {
        await prisma.scraperSetting.deleteMany({
          where: { key }
        });
        console.log(`🗑️ Supprimé: ${key}`);
      } catch (error) {
        // Ignorer les erreurs si le paramètre n'existe pas
      }
    }
    
    // Vérifier le token Datadome
    const datadomeSetting = await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_DATADOME' }
    });
    
    if (datadomeSetting && datadomeSetting.value) {
      console.log(`🍪 Token Datadome: Présent (${datadomeSetting.value.length} caractères)`);
    } else {
      console.log('⚠️ Token Datadome: Absent - Utilisez l\'API /api/admin/scraper/datadome pour le récupérer');
    }
    
    console.log('\n✅ Configuration terminée !');
    console.log('\n📝 Résumé de la configuration:');
    console.log('- ProtonVPN: Désactivé');
    console.log('- Datadome: Activé (si token présent)');
    console.log('- Mode headless: Activé');
    console.log('- Anti-détection: Activé');
    console.log('- Rotation User-Agent: Activée');
    console.log('- Délai entre requêtes: 3 secondes');
    console.log('- Max annonces: 15');
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script
configureScraperForDatadome()
  .then(() => {
    console.log('\n🎉 Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
