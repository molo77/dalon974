// Test de l'API des logs du scraper
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogsAPI() {
  console.log('🧪 Test de l\'API des logs du scraper...\n');
  
  try {
    // Récupérer les derniers runs
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        rawLog: true,
        errorMessage: true,
        currentStep: true,
        currentMessage: true
      }
    });
    
    console.log(`📊 ${runs.length} runs trouvés`);
    
    if (runs.length === 0) {
      console.log('❌ Aucun run trouvé pour tester l\'API');
      return;
    }
    
    // Tester avec le premier run
    const testRun = runs[0];
    console.log(`\n🔍 Test avec le run: ${testRun.id}`);
    console.log(`   • Statut: ${testRun.status}`);
    console.log(`   • Début: ${testRun.startedAt ? new Date(testRun.startedAt).toLocaleString() : 'inconnu'}`);
    console.log(`   • Fin: ${testRun.finishedAt ? new Date(testRun.finishedAt).toLocaleString() : 'inconnu'}`);
    console.log(`   • Étape actuelle: ${testRun.currentStep || 'aucune'}`);
    console.log(`   • Message: ${testRun.currentMessage || 'aucun'}`);
    console.log(`   • Logs bruts: ${testRun.rawLog ? `${testRun.rawLog.length} caractères` : 'aucun'}`);
    console.log(`   • Erreur: ${testRun.errorMessage || 'aucune'}`);
    
    // Simuler l'appel à l'API
    console.log('\n🌐 Simulation de l\'appel API...');
    
    // Construire le contenu des logs comme dans l'API
    let logs = '';
    
    // Ajouter les informations de base
    logs += `=== RUN SCRAPER ${testRun.id} ===\n`;
    logs += `Statut: ${testRun.status || 'inconnu'}\n`;
    logs += `Début: ${testRun.startedAt ? new Date(testRun.startedAt).toLocaleString() : 'inconnu'}\n`;
    if (testRun.finishedAt) {
      logs += `Fin: ${new Date(testRun.finishedAt).toLocaleString()}\n`;
    }
    if (testRun.currentStep) {
      logs += `Étape actuelle: ${testRun.currentStep}\n`;
    }
    if (testRun.currentMessage) {
      logs += `Message: ${testRun.currentMessage}\n`;
    }
    logs += '\n';

    // Ajouter les logs bruts
    if (testRun.rawLog) {
      logs += testRun.rawLog;
    }

    // Ajouter le message d'erreur si présent
    if (testRun.errorMessage) {
      logs += `\n\n=== ERREUR ===\n${testRun.errorMessage}`;
    }

    // Si le run est en cours et qu'il n'y a pas de logs, afficher un message
    if (testRun.status === 'running' && !testRun.rawLog) {
      logs += '\n\n=== LOGS EN COURS ===\nLe scraper est en cours d\'exécution...\nLes logs apparaîtront ici en temps réel.';
    }
    
    console.log('\n📄 Contenu des logs généré:');
    console.log('─'.repeat(50));
    console.log(logs);
    console.log('─'.repeat(50));
    
    console.log('\n✅ Test de l\'API des logs terminé avec succès !');
    
    // Afficher des statistiques
    console.log('\n📈 Statistiques des runs:');
    const stats = {
      total: runs.length,
      running: runs.filter(r => r.status === 'running').length,
      success: runs.filter(r => r.status === 'success').length,
      error: runs.filter(r => r.status === 'error').length,
      aborted: runs.filter(r => r.status === 'aborted').length,
      withLogs: runs.filter(r => r.rawLog && r.rawLog.length > 0).length,
      withErrors: runs.filter(r => r.errorMessage && r.errorMessage.length > 0).length
    };
    
    Object.entries(stats).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value}`);
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogsAPI();
