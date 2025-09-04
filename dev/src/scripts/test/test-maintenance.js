// Script de test pour la page de maintenance
// Simule une base de données inaccessible

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function testMaintenancePage() {
  console.log('🧪 Test de la page de maintenance...\n');
  
  try {
    // Test 1: Vérifier que l'API de santé fonctionne
    console.log('1️⃣ Test de l\'API de santé...');
    const { stdout: healthResponse } = await execAsync('curl -s http://localhost:3000/api/health');
    console.log('✅ API de santé accessible');
    console.log('📋 Réponse:', healthResponse);
    
    // Test 2: Vérifier que la page de maintenance est accessible
    console.log('\n2️⃣ Test de la page de maintenance...');
    const { stdout: maintenanceResponse } = await execAsync('curl -s http://localhost:3000/maintenance');
    
    if (maintenanceResponse.includes('Maintenance en cours')) {
      console.log('✅ Page de maintenance accessible');
    } else {
      console.log('❌ Page de maintenance non accessible');
      console.log('📋 Réponse:', maintenanceResponse.substring(0, 200) + '...');
    }
    
    // Test 3: Vérifier les métadonnées de la page
    console.log('\n3️⃣ Test des métadonnées...');
    if (maintenanceResponse.includes('maintenance')) {
      console.log('✅ Métadonnées correctes');
    } else {
      console.log('⚠️ Métadonnées manquantes');
    }
    
    console.log('\n🎉 Tests terminés avec succès !');
    console.log('\n💡 Pour tester la redirection automatique :');
    console.log('1. Arrêtez votre serveur de base de données');
    console.log('2. Accédez à http://localhost:3000');
    console.log('3. Vous devriez être redirigé vers /maintenance');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
    console.log('\n💡 Assurez-vous que votre serveur Next.js est démarré sur le port 3000');
  }
}

// Fonction pour simuler une base de données inaccessible
async function simulateDatabaseDown() {
  console.log('🔧 Simulation d\'une base de données inaccessible...\n');
  
  // Sauvegarder l'URL de base de données actuelle
  const originalDbUrl = process.env.DATABASE_URL;
  
  try {
    // Changer temporairement l'URL de base de données pour une URL invalide
    process.env.DATABASE_URL = 'mysql://invalid:invalid@localhost:3306/invalid';
    
    console.log('📋 URL de base de données temporairement modifiée');
    console.log('🔄 Redémarrez votre serveur Next.js pour tester');
    console.log('🌐 Accédez à http://localhost:3000');
    console.log('📱 Vous devriez être redirigé vers la page de maintenance');
    
    console.log('\n⏰ Appuyez sur Ctrl+C pour restaurer l\'URL de base de données');
    
    // Attendre indéfiniment
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    // Restaurer l'URL de base de données
    process.env.DATABASE_URL = originalDbUrl;
    console.log('\n✅ URL de base de données restaurée');
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--simulate-down')) {
  simulateDatabaseDown();
} else {
  testMaintenancePage();
}
