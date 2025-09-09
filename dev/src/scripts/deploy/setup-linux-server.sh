#!/bin/bash

# Script de configuration initiale pour serveur Linux
# Usage: ./setup-linux-server.sh [serveur] [dossier]

set -e

# Configuration
SERVER_HOST=${1:-"molo:Bulgroz%401977@192.168.1.200"}
PROJECT_DIR=${2:-"/data/rodcoloc"}

echo "🔧 Configuration initiale du serveur Linux pour Dalon974"

# 1. Créer le répertoire du projet
echo "📁 Création du répertoire du projet..."
ssh $SERVER_HOST "mkdir -p $PROJECT_DIR"

# 2. Installer Node.js et npm (si pas déjà installé)
echo "📦 Vérification/Installation de Node.js..."
ssh $SERVER_HOST "if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi"

# 3. Installer PM2 pour la gestion des processus
echo "⚡ Installation de PM2..."
ssh $SERVER_HOST "npm install -g pm2"

# 4. Créer le fichier de configuration PM2
echo "📝 Création de la configuration PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'rodcoloc',
    script: 'npm',
    args: 'start',
    cwd: '$PROJECT_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# 5. Copier la configuration PM2 sur le serveur
scp ecosystem.config.js $SERVER_HOST:$PROJECT_DIR/

# 6. Créer un script de service systemd
echo "🔧 Création du service systemd..."
ssh $SERVER_HOST "sudo tee /etc/systemd/system/rodcoloc.service > /dev/null" << EOF
[Unit]
Description=Dalon974 Application
After=network.target

[Service]
Type=forking
User=molo
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload rodcoloc
ExecStop=/usr/bin/pm2 stop rodcoloc
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# 7. Activer et démarrer le service
echo "🚀 Activation du service..."
ssh $SERVER_HOST "sudo systemctl daemon-reload && sudo systemctl enable rodcoloc"

# 8. Configurer le firewall (si nécessaire)
echo "🔥 Configuration du firewall..."
ssh $SERVER_HOST "sudo ufw allow 3000/tcp" || echo "⚠️  Impossible de configurer le firewall"

# 9. Créer un script de maintenance
echo "🛠️  Création du script de maintenance..."
ssh $SERVER_HOST "cat > $PROJECT_DIR/maintenance.sh" << 'EOF'
#!/bin/bash
# Script de maintenance pour Dalon974

case "$1" in
  "restart")
    pm2 restart rodcoloc
    ;;
  "stop")
    pm2 stop rodcoloc
    ;;
  "start")
    pm2 start rodcoloc
    ;;
  "logs")
    pm2 logs rodcoloc
    ;;
  "status")
    pm2 status
    ;;
  *)
    echo "Usage: $0 {restart|stop|start|logs|status}"
    exit 1
    ;;
esac
EOF

ssh $SERVER_HOST "chmod +x $PROJECT_DIR/maintenance.sh"

echo "✅ Configuration initiale terminée !"
echo "📋 Commandes utiles:"
echo "  - Redémarrer: ssh $SERVER_HOST 'cd $PROJECT_DIR && ./maintenance.sh restart'"
echo "  - Voir les logs: ssh $SERVER_HOST 'cd $PROJECT_DIR && ./maintenance.sh logs'"
echo "  - Statut: ssh $SERVER_HOST 'cd $PROJECT_DIR && ./maintenance.sh status'"
