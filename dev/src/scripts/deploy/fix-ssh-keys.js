const { execSync } = require('child_process');

// Configuration
const SERVER_HOST = process.argv[2] || "molo:Bulgroz%401977@192.168.1.200";
const SERVER_IP = SERVER_HOST.split('@')[1];

console.log('🔧 Résolution des problèmes de clés SSH pour', SERVER_HOST);

try {
  console.log('🗑️  Suppression de l\'ancienne clé SSH...');
  
  // Supprimer l'ancienne clé du fichier known_hosts
  try {
    execSync(`ssh-keygen -R ${SERVER_IP}`, { stdio: 'inherit' });
    console.log('✅ Ancienne clé supprimée');
  } catch (error) {
    console.log('⚠️  Impossible de supprimer l\'ancienne clé (peut-être déjà supprimée)');
  }

  console.log('🔑 Test de connexion SSH...');
  console.log('📝 Si demandé, tapez "yes" pour accepter la nouvelle clé');
  
  // Tester la connexion SSH pour accepter la nouvelle clé
  execSync(`ssh -o StrictHostKeyChecking=accept-new ${SERVER_HOST} "echo 'Connexion SSH réussie!'"`, { stdio: 'inherit' });
  
  console.log('✅ Problème de clés SSH résolu !');
  console.log('🚀 Vous pouvez maintenant exécuter les commandes de déploiement');

} catch (error) {
  console.error('❌ Erreur lors de la résolution des clés SSH:', error.message);
  console.log('\n📋 Solutions alternatives :');
  console.log('1. Se connecter manuellement : ssh molo@192.168.1.200');
  console.log('2. Accepter la nouvelle clé quand demandé');
  console.log('3. Ou utiliser : ssh -o StrictHostKeyChecking=no molo@192.168.1.200');
  process.exit(1);
}
