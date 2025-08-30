// Test simple du système de maintenance
const { PrismaClient } = require('@prisma/client');

async function testDatabaseHealth() {
  console.log('🧪 Test simple du système de maintenance...\n');
  
  const prisma = new PrismaClient();
  const startTime = Date.now();
  
  try {
    console.log('1️⃣ Test de connexion à la base de données...');
    
    // Test de connexion simple
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    console.log('✅ Base de données accessible');
    console.log(`📊 Temps de réponse: ${responseTime}ms`);
    
    return {
      isHealthy: true,
      responseTime
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    console.log('❌ Base de données inaccessible');
    console.log(`📊 Temps de réponse: ${responseTime}ms`);
    console.log(`🚨 Erreur: ${error.message}`);
    
    return {
      isHealthy: false,
      error: error.message,
      responseTime
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function testComponents() {
  console.log('\n2️⃣ Vérification des composants...');
  
  const fs = require('fs');
  const components = [
    'lib/databaseHealth.ts',
    'components/DatabaseGuard.tsx',
    'components/SystemStatus.tsx',
    'components/MaintenanceAlert.tsx',
    'hooks/useDatabaseHealth.ts',
    'app/maintenance/page.tsx',
    'app/api/health/route.ts'
  ];
  
  let allExist = true;
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      console.log(`✅ ${component} existe`);
    } else {
      console.log(`❌ ${component} manquant`);
      allExist = false;
    }
  }
  
  return allExist;
}

async function runTests() {
  console.log('🚀 Test du système de maintenance\n');
  
  // Test 1: Vérification des composants
  const componentsOk = await testComponents();
  
  // Test 2: Test de la base de données
  const dbHealth = await testDatabaseHealth();
  
  // Résumé
  console.log('\n📊 Résumé des tests:');
  console.log(`Composants: ${componentsOk ? '✅ OK' : '❌ Manquants'}`);
  console.log(`Base de données: ${dbHealth.isHealthy ? '✅ Accessible' : '❌ Inaccessible'}`);
  
  if (dbHealth.isHealthy) {
    console.log(`Temps de réponse: ${dbHealth.responseTime}ms`);
  } else {
    console.log(`Erreur: ${dbHealth.error}`);
  }
  
  if (componentsOk && dbHealth.isHealthy) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('💡 Le système de maintenance est opérationnel.');
  } else {
    console.log('\n⚠️ Certains tests ont échoué.');
    if (!componentsOk) {
      console.log('💡 Vérifiez que tous les composants sont présents.');
    }
    if (!dbHealth.isHealthy) {
      console.log('💡 Vérifiez la connexion à la base de données.');
    }
  }
}

// Exécuter les tests
runTests().catch(console.error);
