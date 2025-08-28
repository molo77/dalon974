// Vérifier et nettoyer les runs de scraper bloqués
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

async function checkScraperStatus() {
  console.log('🔍 Vérification du statut du scraper...\n');
  
  try {
    // Récupérer tous les runs
    const runs = await prisma.scraperRun.findMany({
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        currentStep: true,
        currentMessage: true,
        childPid: true,
        progress: true
      }
    });
    
    console.log(`📊 ${runs.length} runs trouvés dans la base de données\n`);
    
    if (runs.length === 0) {
      console.log('✅ Aucun run trouvé - base de données propre');
      return;
    }
    
    // Analyser chaque run
    for (const run of runs) {
      const duration = run.finishedAt 
        ? Math.round((new Date(run.finishedAt) - new Date(run.startedAt)) / 1000)
        : Math.round((new Date() - new Date(run.startedAt)) / 1000);
      
      console.log(`🔍 Run: ${run.id}`);
      console.log(`   • Statut: ${run.status}`);
      console.log(`   • Début: ${new Date(run.startedAt).toLocaleString()}`);
      console.log(`   • Durée: ${duration} secondes`);
      console.log(`   • Progression: ${(run.progress * 100).toFixed(1)}%`);
      console.log(`   • Étape: ${run.currentStep || 'N/A'}`);
      console.log(`   • Message: ${run.currentMessage || 'N/A'}`);
      console.log(`   • PID: ${run.childPid || 'N/A'}`);
      
      // Vérifier si le run est bloqué
      if (run.status === 'running' && duration > 300) { // Plus de 5 minutes
        console.log(`   ⚠️  RUN BLOQUÉ - Durée: ${duration}s`);
        
        // Vérifier si le processus existe encore
        if (run.childPid) {
          try {
            const { execSync } = require('child_process');
            execSync(`tasklist /FI "PID eq ${run.childPid}"`, { stdio: 'pipe' });
            console.log(`   ❌ Processus ${run.childPid} toujours actif`);
          } catch (e) {
            console.log(`   ✅ Processus ${run.childPid} terminé`);
          }
        }
      }
      console.log('');
    }
    
    // Proposer de nettoyer les runs bloqués
    const blockedRuns = runs.filter(run => 
      run.status === 'running' && 
      (new Date() - new Date(run.startedAt)) > 300000 // 5 minutes
    );
    
    if (blockedRuns.length > 0) {
      console.log(`⚠️  ${blockedRuns.length} run(s) bloqué(s) détecté(s)`);
      console.log('💡 Voulez-vous les marquer comme "error" ? (y/n)');
      
      // Simuler une réponse automatique pour le nettoyage
      console.log('🔄 Nettoyage automatique des runs bloqués...');
      
      for (const run of blockedRuns) {
        await prisma.scraperRun.update({
          where: { id: run.id },
          data: {
            status: 'error',
            finishedAt: new Date(),
            errorMessage: 'Run bloqué - arrêté automatiquement',
            currentStep: 'Arrêté',
            currentMessage: 'Run bloqué détecté et arrêté'
          }
        });
        console.log(`   ✅ Run ${run.id} marqué comme "error"`);
      }
      
      console.log('\n🎉 Nettoyage terminé !');
    } else {
      console.log('✅ Aucun run bloqué détecté');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScraperStatus();
