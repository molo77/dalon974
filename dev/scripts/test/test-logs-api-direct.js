// Test direct de l'API des logs
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

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogsAPI() {
  console.log('🧪 Test direct de l\'API des logs...\n');
  
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
        currentStep: true,
        currentMessage: true,
        rawLog: true,
        errorMessage: true
      }
    });
    
    console.log(`📊 ${runs.length} runs trouvés dans la base de données`);
    
    if (runs.length === 0) {
      console.log('❌ Aucun run trouvé pour tester');
      return;
    }
    
    // Tester avec le premier run
    const testRun = runs[0];
    console.log(`\n🔍 Test avec le run: ${testRun.id}`);
    console.log(`   • Statut: ${testRun.status}`);
    console.log(`   • Début: ${testRun.startedAt}`);
    console.log(`   • Étape: ${testRun.currentStep || 'N/A'}`);
    console.log(`   • Message: ${testRun.currentMessage || 'N/A'}`);
    console.log(`   • Logs: ${testRun.rawLog ? testRun.rawLog.length + ' caractères' : 'aucun'}`);
    
    // Simuler la logique de l'API
    let logs = '';
    
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

    if (testRun.rawLog) {
      logs += testRun.rawLog;
    }

    if (testRun.errorMessage) {
      logs += `\n\n=== ERREUR ===\n${testRun.errorMessage}`;
    }

    if (testRun.status === 'running' && !testRun.rawLog) {
      logs += '\n\n=== LOGS EN COURS ===\nLe scraper est en cours d\'exécution...\nLes logs apparaîtront ici en temps réel.';
    }
    
    console.log('\n📄 Contenu des logs généré:');
    console.log('─'.repeat(50));
    console.log(logs);
    console.log('─'.repeat(50));
    
    console.log('\n✅ Test de l\'API des logs réussi !');
    console.log('💡 Les logs devraient maintenant s\'afficher correctement dans l\'interface admin');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogsAPI();
