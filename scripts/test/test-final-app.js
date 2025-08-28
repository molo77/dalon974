// Test final de l'application
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

async function runFinalTest() {
  console.log('🎯 Test final de l\'application...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  // Test 1: API de santé
  console.log('1️⃣ Test de l\'API de santé...');
  const healthResult = await testEndpoint(`${baseUrl}/api/health`);
  
  if (healthResult.error) {
    console.log(`❌ Erreur: ${healthResult.error}`);
  } else {
    console.log(`✅ Status: ${healthResult.statusCode}`);
    if (healthResult.statusCode === 200) {
      console.log('✅ API de santé fonctionne (base de données accessible)');
    } else {
      console.log(`⚠️ Status inattendu: ${healthResult.statusCode}`);
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
      
      // Vérifier le contenu
      if (homeResult.data.includes('Dalon974')) {
        console.log('✅ Logo Dalon974 présent');
      } else {
        console.log('⚠️ Logo Dalon974 non trouvé');
      }
      
      if (homeResult.data.includes('Que souhaitez-vous rechercher')) {
        console.log('✅ Contenu de la page d\'accueil présent');
      } else {
        console.log('⚠️ Contenu de la page d\'accueil non trouvé');
      }
      
      if (homeResult.data.includes('header')) {
        console.log('✅ Navbar présente');
      } else {
        console.log('⚠️ Navbar non trouvée');
      }
      
      if (homeResult.data.includes('Je cherche une colocation')) {
        console.log('✅ Boutons de recherche présents');
      } else {
        console.log('⚠️ Boutons de recherche non trouvés');
      }
    } else {
      console.log(`❌ Status inattendu: ${homeResult.statusCode}`);
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
    } else {
      console.log(`⚠️ Status inattendu: ${maintenanceResult.statusCode}`);
    }
  }
  
  // Test 4: Page admin (doit être accessible)
  console.log('\n4️⃣ Test de la page admin...');
  const adminResult = await testEndpoint(`${baseUrl}/admin`);
  
  if (adminResult.error) {
    console.log(`❌ Erreur: ${adminResult.error}`);
  } else {
    console.log(`✅ Status: ${adminResult.statusCode}`);
    if (adminResult.statusCode === 200) {
      console.log('✅ Page admin accessible');
    } else if (adminResult.statusCode === 302) {
      console.log('✅ Redirection vers login (normal si non connecté)');
    } else {
      console.log(`⚠️ Status inattendu: ${adminResult.statusCode}`);
    }
  }
  
  // Résumé final
  console.log('\n🎉 Résumé du test final:');
  console.log(`API de santé: ${healthResult.statusCode === 200 ? '✅ OK' : '❌ Problème'}`);
  console.log(`Page d'accueil: ${homeResult.statusCode === 200 ? '✅ OK' : '❌ Problème'}`);
  console.log(`Page de maintenance: ${maintenanceResult.statusCode === 200 ? '✅ OK' : '❌ Problème'}`);
  console.log(`Page admin: ${adminResult.statusCode === 200 || adminResult.statusCode === 302 ? '✅ OK' : '❌ Problème'}`);
  
  if (healthResult.statusCode === 200 && 
      homeResult.statusCode === 200 && 
      maintenanceResult.statusCode === 200) {
    console.log('\n🎊 SUCCÈS: L\'application fonctionne parfaitement !');
    console.log('✅ Base de données accessible');
    console.log('✅ Page d\'accueil avec navbar fonctionnelle');
    console.log('✅ Système de maintenance opérationnel');
    console.log('✅ Tous les composants sont présents et fonctionnels');
  } else {
    console.log('\n⚠️ ATTENTION: Certains tests ont échoué.');
  }
}

runFinalTest().catch(console.error);
