const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVER_HOST = process.argv[2] || "molo@192.168.1.200";
const SERVER_IP = SERVER_HOST.split('@')[1];
const USERNAME = SERVER_HOST.split('@')[0];

console.log('🔑 Configuration de l\'authentification SSH par clé pour', SERVER_HOST);

try {
  const sshDir = path.join(process.env.USERPROFILE || process.env.HOME, '.ssh');
  const privateKeyPath = path.join(sshDir, 'id_rsa');
  const publicKeyPath = path.join(sshDir, 'id_rsa.pub');

  // 1. Vérifier si les clés SSH existent déjà
  console.log('🔍 Vérification des clés SSH existantes...');
  if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
    console.log('📝 Génération de nouvelles clés SSH...');
    execSync(`ssh-keygen -t rsa -b 4096 -f "${privateKeyPath}" -N ""`, { stdio: 'inherit' });
    console.log('✅ Clés SSH générées');
  } else {
    console.log('✅ Clés SSH existantes trouvées');
  }

  // 2. Lire la clé publique
  console.log('📖 Lecture de la clé publique...');
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8').trim();

  // 3. Créer le répertoire .ssh sur le serveur et copier la clé
  console.log('📤 Copie de la clé publique vers le serveur...');
  console.log('🔐 Entrez votre mot de passe une dernière fois :');
  
  const setupCommands = [
    `mkdir -p ~/.ssh`,
    `echo "${publicKey}" >> ~/.ssh/authorized_keys`,
    `chmod 700 ~/.ssh`,
    `chmod 600 ~/.ssh/authorized_keys`,
    `echo "Configuration SSH terminée"`
  ].join(' && ');

  execSync(`ssh -o StrictHostKeyChecking=no ${SERVER_HOST} "${setupCommands}"`, { stdio: 'inherit' });

  // 4. Tester la connexion sans mot de passe
  console.log('🧪 Test de connexion sans mot de passe...');
  execSync(`ssh -o StrictHostKeyChecking=no ${SERVER_HOST} "echo 'Connexion SSH sans mot de passe réussie!'"`, { stdio: 'inherit' });

  console.log('✅ Configuration SSH terminée !');
  console.log('🚀 Vous pouvez maintenant utiliser les scripts de déploiement sans mot de passe');

} catch (error) {
  console.error('❌ Erreur lors de la configuration SSH:', error.message);
  console.log('\n📋 Solutions alternatives :');
  console.log('1. Vérifiez que vous pouvez vous connecter manuellement : ssh molo@192.168.1.200');
  console.log('2. Assurez-vous que le serveur accepte les connexions SSH');
  console.log('3. Vérifiez que le mot de passe est correct');
  process.exit(1);
}
