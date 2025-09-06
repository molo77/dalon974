const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const SERVER_HOST = process.argv[2] || "molo@192.168.1.200";
const PROJECT_DIR = process.argv[3] || "/data/dalon974";

console.log('🔧 Configuration initiale du serveur Linux pour Dalon974 (utilisateur uniquement)');

try {
  // 1. Créer le répertoire du projet
  console.log('📁 Création du répertoire du projet...');
  execSync(`ssh ${SERVER_HOST} "mkdir -p ${PROJECT_DIR}"`, { stdio: 'inherit' });

  // 2. Installer Node.js et npm (si pas déjà installé)
  console.log('📦 Vérification/Installation de Node.js...');
  execSync(`ssh ${SERVER_HOST} "if ! command -v node &> /dev/null; then curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt-get install -y nodejs; fi"`, { stdio: 'inherit' });

  // 3. Créer un script de démarrage simple
  console.log('📝 Création du script de démarrage...');
  const startScript = `#!/bin/bash
# Script de démarrage pour Dalon974

cd ${PROJECT_DIR}
export NODE_ENV=production
export PORT=3000

# Démarrer l'application
npm start

# En cas d'erreur, redémarrer après 5 secondes
if [ $? -ne 0 ]; then
  echo "Erreur de démarrage, redémarrage dans 5 secondes..."
  sleep 5
  npm start
fi`;

  execSync(`ssh ${SERVER_HOST} "cat > ${PROJECT_DIR}/start.sh"`, { 
    input: startScript,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  execSync(`ssh ${SERVER_HOST} "chmod +x ${PROJECT_DIR}/start.sh"`, { stdio: 'inherit' });

  // 4. Créer un script de service utilisateur systemd
  console.log('🔧 Création du service systemd utilisateur...');
  const userServiceDir = `/home/molo/.config/systemd/user`;
  execSync(`ssh ${SERVER_HOST} "mkdir -p ${userServiceDir}"`, { stdio: 'inherit' });

  const systemdService = `[Unit]
Description=Dalon974 Application
After=network.target

[Service]
Type=simple
WorkingDirectory=${PROJECT_DIR}
ExecStart=${PROJECT_DIR}/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=default.target`;

  execSync(`ssh ${SERVER_HOST} "cat > ${userServiceDir}/dalon974.service"`, { 
    input: systemdService,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  // 5. Activer le service utilisateur
  console.log('🚀 Activation du service utilisateur...');
  execSync(`ssh ${SERVER_HOST} "systemctl --user daemon-reload && systemctl --user enable dalon974"`, { stdio: 'inherit' });

  // 6. Créer un script de maintenance
  console.log('🛠️  Création du script de maintenance...');
  const maintenanceScript = `#!/bin/bash
# Script de maintenance pour Dalon974

case "$1" in
  "restart")
    systemctl --user restart dalon974
    ;;
  "stop")
    systemctl --user stop dalon974
    ;;
  "start")
    systemctl --user start dalon974
    ;;
  "logs")
    journalctl --user -u dalon974 -f
    ;;
  "status")
    systemctl --user status dalon974
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

  // 7. Créer un script de démarrage automatique
  console.log('🔄 Configuration du démarrage automatique...');
  execSync(`ssh ${SERVER_HOST} "loginctl enable-linger molo"`, { stdio: 'inherit' });

  console.log('✅ Configuration initiale terminée !');
  console.log('📋 Commandes utiles:');
  console.log(`  - Redémarrer: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh restart'`);
  console.log(`  - Voir les logs: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh logs'`);
  console.log(`  - Statut: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh status'`);
  console.log('🌐 Application accessible sur: http://192.168.1.200:3000');

} catch (error) {
  console.error('❌ Erreur lors de la configuration:', error.message);
  process.exit(1);
}
