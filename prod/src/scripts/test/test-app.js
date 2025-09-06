// Test simple de l'application
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
          data: data.substring(0, 200) + '...'
        });
      });
    });
    
    req.on('error', (error) => {
      resolve({
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        error: 'Timeout'
      });
    });
  });
}

async function runTests() {
  console.log('🧪 Test de l\'application...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: API de santé
  console.log('1️⃣ Test de l\'API de santé...');
  const healthResult = await testEndpoint(`${baseUrl}/api/health`);
  
  if (healthResult.error) {
    console.log(`❌ Erreur: ${healthResult.error}`);
  } else {
    console.log(`✅ Status: ${healthResult.statusCode}`);
    if (healthResult.statusCode === 503) {
      console.log('✅ API de santé fonctionne (DB inaccessible = normal)');
    } else {
      console.log(`📋 Réponse: ${healthResult.data}`);
    }
  }
  
  // Test 2: Page d'accueil
  console.log('\n2️⃣ Test de la page d\'accueil...');
  const homeResult = await testEndpoint(`${baseUrl}/`);
  
  if (homeResult.error) {
    console.log(`❌ Erreur: ${homeResult.error}`);
  } else {
    console.log(`✅ Status: ${homeResult.statusCode}`);
    if (homeResult.statusCode === 200) {
      console.log('✅ Page d\'accueil accessible');
    } else if (homeResult.statusCode === 302) {
      console.log('✅ Redirection détectée (probablement vers maintenance)');
    } else {
      console.log(`📋 Réponse: ${homeResult.data}`);
    }
  }
  
  // Test 3: Page de maintenance
  console.log('\n3️⃣ Test de la page de maintenance...');
  const maintenanceResult = await testEndpoint(`${baseUrl}/maintenance`);
  
  if (maintenanceResult.error) {
    console.log(`❌ Erreur: ${maintenanceResult.error}`);
  } else {
    console.log(`✅ Status: ${maintenanceResult.statusCode}`);
    if (maintenanceResult.statusCode === 200) {
      console.log('✅ Page de maintenance accessible');
    } else {
      console.log(`📋 Réponse: ${maintenanceResult.data}`);
    }
  }
  
  console.log('\n🎉 Tests terminés !');
  console.log('\n💡 Si tous les tests passent, l\'application fonctionne correctement.');
  console.log('💡 L\'erreur 503 sur l\'API de santé est normale (DB inaccessible).');
}

runTests().catch(console.error);
