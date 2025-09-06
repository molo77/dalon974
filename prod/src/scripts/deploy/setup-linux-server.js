const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const SERVER_HOST = process.argv[2] || "molo:Bulgroz@1977@192.168.1.200";
const PROJECT_DIR = process.argv[3] || "/data/dalon974";

console.log('🔧 Configuration initiale du serveur Linux pour Dalon974');

try {
  // 1. Créer le répertoire du projet
  console.log('📁 Création du répertoire du projet...');
  execSync(`ssh ${SERVER_HOST} "mkdir -p ${PROJECT_DIR}"`, { stdio: 'inherit' });

  // 2. Installer Node.js et npm (si pas déjà installé)
  console.log('📦 Vérification/Installation de Node.js...');
  execSync(`ssh ${SERVER_HOST} "if ! command -v node &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs; fi"`, { stdio: 'inherit' });

  // 3. Installer PM2 pour la gestion des processus (avec gestion d'erreur)
  console.log('⚡ Installation de PM2...');
  try {
    execSync(`ssh ${SERVER_HOST} "sudo npm install -g pm2"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Installation PM2 globale échouée, tentative avec npm local...');
    execSync(`ssh ${SERVER_HOST} "npm install pm2 --save-dev"`, { stdio: 'inherit' });
  }

  // 4. Créer le fichier de configuration PM2
  console.log('📝 Création de la configuration PM2...');
  const ecosystemConfig = `module.exports = {
  apps: [{
    name: 'dalon974',
    script: 'npm',
    args: 'start',
    cwd: '${PROJECT_DIR}',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}`;

  fs.writeFileSync('ecosystem.config.js', ecosystemConfig);

  // 5. Copier la configuration PM2 sur le serveur
  execSync(`scp ecosystem.config.js ${SERVER_HOST}:${PROJECT_DIR}/`, { stdio: 'inherit' });

  // 6. Créer un script de service systemd
  console.log('🔧 Création du service systemd...');
  const systemdService = `[Unit]
Description=Dalon974 Application
After=network.target

[Service]
Type=forking
User=molo
WorkingDirectory=${PROJECT_DIR}
ExecStart=/usr/bin/env pm2 start ecosystem.config.js
ExecReload=/usr/bin/env pm2 reload dalon974
ExecStop=/usr/bin/env pm2 stop dalon974
Restart=always
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/games:/usr/games

[Install]
WantedBy=multi-user.target`;

  execSync(`ssh ${SERVER_HOST} "sudo tee /etc/systemd/system/dalon974.service > /dev/null"`, { 
    input: systemdService,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  // 7. Activer et démarrer le service
  console.log('🚀 Activation du service...');
  execSync(`ssh ${SERVER_HOST} "sudo systemctl daemon-reload && sudo systemctl enable dalon974"`, { stdio: 'inherit' });

  // 8. Configurer le firewall (si nécessaire)
  console.log('🔥 Configuration du firewall...');
  try {
    execSync(`ssh ${SERVER_HOST} "sudo ufw allow 3000/tcp"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de configurer le firewall');
  }

  // 9. Créer un script de maintenance
  console.log('🛠️  Création du script de maintenance...');
  const maintenanceScript = `#!/bin/bash
# Script de maintenance pour Dalon974

case "$1" in
  "restart")
    pm2 restart dalon974
    ;;
  "stop")
    pm2 stop dalon974
    ;;
  "start")
    pm2 start dalon974
    ;;
  "logs")
    pm2 logs dalon974
    ;;
  "status")
    pm2 status
    ;;
  *)
    echo "Usage: $0 {restart|stop|start|logs|status}"
    exit 1
    ;;
esac`;

  execSync(`ssh ${SERVER_HOST} "cat > ${PROJECT_DIR}/maintenance.sh"`, { 
    input: maintenanceScript,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  execSync(`ssh ${SERVER_HOST} "chmod +x ${PROJECT_DIR}/maintenance.sh"`, { stdio: 'inherit' });

  // Nettoyer le fichier temporaire
  fs.unlinkSync('ecosystem.config.js');

  console.log('✅ Configuration initiale terminée !');
  console.log('📋 Commandes utiles:');
  console.log(`  - Redémarrer: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh restart'`);
  console.log(`  - Voir les logs: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh logs'`);
  console.log(`  - Statut: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh status'`);

} catch (error) {
  console.error('❌ Erreur lors de la configuration:', error.message);
  process.exit(1);
}
