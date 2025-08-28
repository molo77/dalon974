// Créer un run de test avec des logs pour tester l'affichage
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

async function createTestRun() {
  console.log('🧪 Création d\'un run de test avec des logs...\n');
  
  try {
    // Créer un run de test
    const testRun = await prisma.scraperRun.create({
      data: {
        status: 'success',
        startedAt: new Date(Date.now() - 3600000), // Il y a 1 heure
        finishedAt: new Date(),
        totalCollected: 25,
        totalUpserts: 12,
        createdCount: 8,
        updatedCount: 4,
        skippedRecentCount: 0,
        progress: 1.0,
        currentStep: 'Étape 5/5',
        currentMessage: 'Sauvegarde terminée',
        rawLog: `=== RUN SCRAPER TEST ${Date.now()} ===
Statut: success
Début: ${new Date(Date.now() - 3600000).toLocaleString()}
Fin: ${new Date().toLocaleString()}

🚀 [ÉTAPE 1/5] Initialisation du scraper...
🔌 [VPN] ProtonVPN désactivé par configuration
✅ [ÉTAPE 1/5] Initialisation terminée

📋 [ÉTAPE 2/5] Collecte des annonces...
🔍 URL de recherche: https://www.leboncoin.fr/recherche?category=11&locations=r_26
📄 Pages à traiter: 1
🎯 Annonces max: 40
📄 [PAGE 1/1] Navigation vers la page...
📄 [PAGE 1/1] Chargement du contenu...
📄 [PAGE 1/1] Contenu chargé avec succès
📄 [PAGE 1/1] 25 annonces trouvées
📊 [RÉSUMÉ] Total annonces collectées: 25
✅ [ÉTAPE 2/5] Collecte terminée - 25 annonces trouvées

🔍 [ÉTAPE 3/5] Récupération des détails...
🔍 [DÉTAILS] Limite de traitement: 12
🔍 [DÉTAIL 1/12] Traitement: Colocation 2 chambres Saint-Denis...
🔍 [DÉTAIL 2/12] Traitement: Studio meublé Saint-Pierre...
🔍 [DÉTAIL 3/12] Traitement: Appartement 3 pièces Le Port...
🔍 [DÉTAIL 4/12] Traitement: Maison 4 chambres Saint-Paul...
🔍 [DÉTAIL 5/12] Traitement: T2 meublé Saint-Louis...
🔍 [DÉTAIL 6/12] Traitement: Colocation 1 chambre Sainte-Marie...
🔍 [DÉTAIL 7/12] Traitement: Studio Saint-Joseph...
🔍 [DÉTAIL 8/12] Traitement: Appartement 2 pièces Saint-André...
🔍 [DÉTAIL 9/12] Traitement: Maison 3 chambres Saint-Benoît...
🔍 [DÉTAIL 10/12] Traitement: T3 meublé Saint-Philippe...
🔍 [DÉTAIL 11/12] Traitement: Colocation 2 chambres Saint-Pierre...
🔍 [DÉTAIL 12/12] Traitement: Studio Saint-Denis...
✅ [ÉTAPE 3/5] Récupération des détails terminée

💾 [ÉTAPE 4/5] Export des données...
✅ [ÉTAPE 4/5] Export terminé

💾 [ÉTAPE 5/5] Sauvegarde en base de données...
✅ [ÉTAPE 5/5] Sauvegarde terminée - 8 créées, 4 mises à jour, 0 ignorées

🎉 [SCRAPER] Toutes les étapes terminées avec succès !
📈 [STATISTIQUES FINALES]
   • Annonces collectées: 25
   • Annonces traitées: 12
   • Nouvelles annonces: 8
   • Annonces mises à jour: 4
   • Annonces ignorées: 0
   • Temps total: 45 secondes
   • Vitesse: 0.53 annonces/seconde

✅ [FIN] Scraper terminé avec succès !`
      }
    });
    
    console.log('✅ Run de test créé avec succès !');
    console.log(`   • ID: ${testRun.id}`);
    console.log(`   • Statut: ${testRun.status}`);
    console.log(`   • Début: ${testRun.startedAt}`);
    console.log(`   • Fin: ${testRun.finishedAt}`);
    console.log(`   • Annonces collectées: ${testRun.totalCollected}`);
    console.log(`   • Logs: ${testRun.rawLog ? testRun.rawLog.length + ' caractères' : 'aucun'}`);
    
    // Créer aussi un run en cours pour tester les logs en temps réel
    const runningRun = await prisma.scraperRun.create({
      data: {
        status: 'running',
        startedAt: new Date(),
        totalCollected: 15,
        progress: 0.4,
        currentStep: 'Étape 2/5',
        currentMessage: 'Collecte des annonces en cours...',
        rawLog: `=== RUN SCRAPER EN COURS ${Date.now()} ===
Statut: running
Début: ${new Date().toLocaleString()}

🚀 [ÉTAPE 1/5] Initialisation du scraper...
🔌 [VPN] ProtonVPN désactivé par configuration
✅ [ÉTAPE 1/5] Initialisation terminée

📋 [ÉTAPE 2/5] Collecte des annonces...
🔍 URL de recherche: https://www.leboncoin.fr/recherche?category=11&locations=r_26
📄 Pages à traiter: 1
🎯 Annonces max: 40
📄 [PAGE 1/1] Navigation vers la page...
📄 [PAGE 1/1] Chargement du contenu...
📄 [PAGE 1/1] Contenu chargé avec succès
📄 [PAGE 1/1] 15 annonces trouvées jusqu'à présent...
📊 [RÉSUMÉ] Total annonces collectées: 15
⏳ [ÉTAPE 2/5] Collecte en cours...`
      }
    });
    
    console.log('\n✅ Run en cours créé avec succès !');
    console.log(`   • ID: ${runningRun.id}`);
    console.log(`   • Statut: ${runningRun.status}`);
    console.log(`   • Progression: ${(runningRun.progress * 100).toFixed(1)}%`);
    console.log(`   • Étape: ${runningRun.currentStep}`);
    console.log(`   • Message: ${runningRun.currentMessage}`);
    
    console.log('\n🎉 Tests créés avec succès !');
    console.log('💡 Vous pouvez maintenant tester l\'affichage des logs dans l\'interface admin');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des runs de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestRun();
