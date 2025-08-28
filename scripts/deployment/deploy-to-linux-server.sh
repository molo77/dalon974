#!/bin/bash

# Script de déploiement pour serveur Linux
# Usage: ./deploy-to-linux-server.sh [serveur] [dossier]

set -e  # Arrêter en cas d'erreur

# Configuration
SERVER_HOST=${1:-"molo:Bulgroz%401977@192.168.1.200"}
PROJECT_DIR=${2:-"/data/dalon974"}
LOCAL_DIR="."

echo "🚀 Déploiement de Dalon974 vers $SERVER_HOST:$PROJECT_DIR"

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé. Assurez-vous d'être dans le répertoire du projet."
    exit 1
fi

# 2. Construire le projet localement
echo "📦 Construction du projet..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la construction du projet"
    exit 1
fi

# 3. Créer un fichier de sauvegarde de la base de données actuelle
echo "💾 Sauvegarde de la base de données..."
ssh $SERVER_HOST "cd $PROJECT_DIR && npm run export-database" || echo "⚠️  Impossible de sauvegarder la base de données"

# 4. Synchroniser les fichiers vers le serveur
echo "📤 Synchronisation des fichiers..."
rsync -avz --exclude 'node_modules' \
           --exclude '.next' \
           --exclude '.git' \
           --exclude 'logs' \
           --exclude 'public/uploads' \
           --exclude '.env.local' \
           --exclude '.env.production' \
           $LOCAL_DIR/ $SERVER_HOST:$PROJECT_DIR/

# 5. Se connecter au serveur et installer les dépendances
echo "🔧 Installation des dépendances sur le serveur..."
ssh $SERVER_HOST "cd $PROJECT_DIR && npm install --production"

# 6. Appliquer les migrations de base de données
echo "🗄️  Application des migrations de base de données..."
ssh $SERVER_HOST "cd $PROJECT_DIR && npx prisma migrate deploy"

# 7. Générer le client Prisma
echo "🔌 Génération du client Prisma..."
ssh $SERVER_HOST "cd $PROJECT_DIR && npx prisma generate"

# 8. Redémarrer le service (si systemd est utilisé)
echo "🔄 Redémarrage du service..."
ssh $SERVER_HOST "sudo systemctl restart dalon974" || echo "⚠️  Impossible de redémarrer le service (peut-être pas configuré)"

# 9. Vérifier le statut
echo "✅ Vérification du statut..."
ssh $SERVER_HOST "cd $PROJECT_DIR && npm run health-check" || echo "⚠️  Impossible de vérifier la santé de l'application"

echo "🎉 Déploiement terminé !"
echo "📍 Application disponible sur: http://$SERVER_HOST:3000"
