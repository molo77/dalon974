const { execSync } = require('child_process');
const path = require('path');

// Configuration
const SERVER_HOST = process.argv[2] || "molo:Bulgroz%401977@192.168.1.200";
const PROJECT_DIR = process.argv[3] || "/data/dalon974";
const LOCAL_DIR = ".";

console.log('🚀 Déploiement de Dalon974 vers', SERVER_HOST + ':' + PROJECT_DIR);

try {
  // 1. Vérifier que nous sommes dans le bon répertoire
  console.log('📁 Vérification du répertoire...');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!require('fs').existsSync(packageJsonPath)) {
    throw new Error('package.json non trouvé. Assurez-vous d\'être dans le répertoire du projet.');
  }

  // 2. Construire le projet localement
  console.log('📦 Construction du projet...');
  execSync('npm run build', { stdio: 'inherit' });

  // 3. Créer un fichier de sauvegarde de la base de données actuelle
  console.log('💾 Sauvegarde de la base de données...');
  try {
    execSync(`ssh ${SERVER_HOST} "cd ${PROJECT_DIR} && npm run export-database"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de sauvegarder la base de données');
  }

  // 4. Synchroniser les fichiers vers le serveur
  console.log('📤 Synchronisation des fichiers...');
  const rsyncCommand = `rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' --exclude 'logs' --exclude 'public/uploads' --exclude '.env.local' --exclude '.env.production' ${LOCAL_DIR}/ ${SERVER_HOST}:${PROJECT_DIR}/`;
  execSync(rsyncCommand, { stdio: 'inherit' });

  // 5. Se connecter au serveur et installer les dépendances
  console.log('🔧 Installation des dépendances sur le serveur...');
  execSync(`ssh ${SERVER_HOST} "cd ${PROJECT_DIR} && npm install --production"`, { stdio: 'inherit' });

  // 6. Appliquer les migrations de base de données
  console.log('🗄️  Application des migrations de base de données...');
  execSync(`ssh ${SERVER_HOST} "cd ${PROJECT_DIR} && npx prisma migrate deploy"`, { stdio: 'inherit' });

  // 7. Générer le client Prisma
  console.log('🔌 Génération du client Prisma...');
  execSync(`ssh ${SERVER_HOST} "cd ${PROJECT_DIR} && npx prisma generate"`, { stdio: 'inherit' });

  // 8. Redémarrer le service (si systemd est utilisé)
  console.log('🔄 Redémarrage du service...');
  try {
    execSync(`ssh ${SERVER_HOST} "sudo systemctl restart dalon974"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de redémarrer le service (peut-être pas configuré)');
  }

  // 9. Vérifier le statut
  console.log('✅ Vérification du statut...');
  try {
    execSync(`ssh ${SERVER_HOST} "cd ${PROJECT_DIR} && npm run health-check"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de vérifier la santé de l\'application');
  }

  console.log('🎉 Déploiement terminé !');
  console.log('📍 Application disponible sur: http://' + SERVER_HOST.split('@')[1] + ':3000');

} catch (error) {
  console.error('❌ Erreur lors du déploiement:', error.message);
  process.exit(1);
}
