const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const SERVER_HOST = process.argv[2] || "molo@192.168.1.200";
const PROJECT_DIR = process.argv[3] || "/data/rodcoloc";

console.log('🔧 Configuration initiale du serveur Linux pour Dalon974 (version simplifiée)');

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

  // 4. Créer un service systemd simple
  console.log('🔧 Création du service systemd...');
  const systemdService = `[Unit]
Description=Dalon974 Application
After=network.target

[Service]
Type=simple
User=molo
WorkingDirectory=${PROJECT_DIR}
ExecStart=${PROJECT_DIR}/start.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target`;

  execSync(`ssh ${SERVER_HOST} "sudo tee /etc/systemd/system/rodcoloc.service > /dev/null"`, { 
    input: systemdService,
    stdio: ['pipe', 'inherit', 'inherit']
  });

  // 5. Activer le service
  console.log('🚀 Activation du service...');
  execSync(`ssh ${SERVER_HOST} "sudo systemctl daemon-reload && sudo systemctl enable rodcoloc"`, { stdio: 'inherit' });

  // 6. Configurer le firewall
  console.log('🔥 Configuration du firewall...');
  try {
    execSync(`ssh ${SERVER_HOST} "sudo ufw allow 3000/tcp"`, { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Impossible de configurer le firewall');
  }

  // 7. Créer un script de maintenance
  console.log('🛠️  Création du script de maintenance...');
  const maintenanceScript = `#!/bin/bash
# Script de maintenance pour Dalon974

case "$1" in
  "restart")
    sudo systemctl restart rodcoloc
    ;;
  "stop")
    sudo systemctl stop rodcoloc
    ;;
  "start")
    sudo systemctl start rodcoloc
    ;;
  "logs")
    sudo journalctl -u rodcoloc -f
    ;;
  "status")
    sudo systemctl status rodcoloc
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

  console.log('✅ Configuration initiale terminée !');
  console.log('📋 Commandes utiles:');
  console.log(`  - Redémarrer: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh restart'`);
  console.log(`  - Voir les logs: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh logs'`);
  console.log(`  - Statut: ssh ${SERVER_HOST} 'cd ${PROJECT_DIR} && ./maintenance.sh status'`);

} catch (error) {
  console.error('❌ Erreur lors de la configuration:', error.message);
  process.exit(1);
}
