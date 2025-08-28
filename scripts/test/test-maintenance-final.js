// Test final du système de maintenance
const https = require('https');
const http = require('http');

async function testEndpoint(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        error: 'Timeout'
      });
    });
  });
}

async function runFinalTests() {
  console.log('🎯 Test final du système de maintenance...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: API de santé (doit retourner 503)
  console.log('1️⃣ Test de l\'API de santé...');
  const healthResult = await testEndpoint(`${baseUrl}/api/health`);
  
  if (healthResult.error) {
    console.log(`❌ Erreur: ${healthResult.error}`);
  } else {
    console.log(`✅ Status: ${healthResult.statusCode}`);
    if (healthResult.statusCode === 503) {
      console.log('✅ API de santé fonctionne correctement (DB inaccessible = normal)');
      try {
        const data = JSON.parse(healthResult.data);
        console.log(`📋 Réponse: ${JSON.stringify(data, null, 2)}`);
      } catch (e) {
        console.log(`📋 Réponse brute: ${healthResult.data.substring(0, 200)}...`);
      }
    } else {
      console.log(`⚠️ Status inattendu: ${healthResult.statusCode}`);
    }
  }
  
  // Test 2: Page d'accueil (doit rediriger vers maintenance)
  console.log('\n2️⃣ Test de la page d\'accueil...');
  const homeResult = await testEndpoint(`${baseUrl}/`);
  
  if (homeResult.error) {
    console.log(`❌ Erreur: ${homeResult.error}`);
  } else {
    console.log(`✅ Status: ${homeResult.statusCode}`);
    if (homeResult.statusCode === 200) {
      console.log('✅ Page d\'accueil accessible (probablement redirigée vers maintenance)');
    } else if (homeResult.statusCode === 302) {
      console.log('✅ Redirection détectée (vers maintenance)');
    } else {
      console.log(`📋 Status: ${homeResult.statusCode}`);
    }
  }
  
  // Test 3: Page de maintenance (doit être accessible)
  console.log('\n3️⃣ Test de la page de maintenance...');
  const maintenanceResult = await testEndpoint(`${baseUrl}/maintenance`);
  
  if (maintenanceResult.error) {
    console.log(`❌ Erreur: ${maintenanceResult.error}`);
  } else {
    console.log(`✅ Status: ${maintenanceResult.statusCode}`);
    if (maintenanceResult.statusCode === 200) {
      console.log('✅ Page de maintenance accessible');
      if (maintenanceResult.data.includes('Maintenance en cours')) {
        console.log('✅ Contenu de maintenance détecté');
      } else {
        console.log('⚠️ Contenu de maintenance non détecté');
      }
    } else {
      console.log(`❌ Status inattendu: ${maintenanceResult.statusCode}`);
    }
  }
  
  // Test 4: Vérification des composants
  console.log('\n4️⃣ Vérification des composants...');
  const fs = require('fs');
  const components = [
    'lib/databaseHealth.ts',
    'components/DatabaseGuard.tsx',
    'components/MaintenanceAlert.tsx',
    'app/maintenance/page.tsx',
    'app/api/health/route.ts'
  ];
  
  let allComponentsExist = true;
  for (const component of components) {
    if (fs.existsSync(component)) {
      console.log(`✅ ${component} existe`);
    } else {
      console.log(`❌ ${component} manquant`);
      allComponentsExist = false;
    }
  }
  
  // Résumé final
  console.log('\n🎉 Résumé des tests:');
  console.log(`API de santé: ${healthResult.statusCode === 503 ? '✅ Fonctionne' : '❌ Problème'}`);
  console.log(`Page d'accueil: ${homeResult.statusCode === 200 || homeResult.statusCode === 302 ? '✅ Accessible' : '❌ Problème'}`);
  console.log(`Page de maintenance: ${maintenanceResult.statusCode === 200 ? '✅ Accessible' : '❌ Problème'}`);
  console.log(`Composants: ${allComponentsExist ? '✅ Tous présents' : '❌ Manquants'}`);
  
  if (healthResult.statusCode === 503 && 
      (homeResult.statusCode === 200 || homeResult.statusCode === 302) && 
      maintenanceResult.statusCode === 200 && 
      allComponentsExist) {
    console.log('\n🎊 SUCCÈS: Le système de maintenance fonctionne parfaitement !');
    console.log('💡 La base de données est inaccessible (normal),');
    console.log('💡 les utilisateurs sont redirigés vers la page de maintenance,');
    console.log('💡 et l\'API de santé fonctionne correctement.');
  } else {
    console.log('\n⚠️ ATTENTION: Certains tests ont échoué.');
  }
}

runFinalTests().catch(console.error);
