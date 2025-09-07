#!/bin/bash

# Script pour démarrer le serveur de développement avec horodatages automatiques
# Usage: ./scripts/dev-with-timestamps.sh

LOG_DIR="/data/dalon974/logs"
LOG_FILE="$LOG_DIR/dev.log"

echo "🚀 Démarrage du serveur de développement avec horodatages..."
echo "📝 Logs enregistrés dans: $LOG_FILE"
echo ""

# Créer le dossier de logs s'il n'existe pas
mkdir -p "$LOG_DIR"

# Fonction pour arrêter le serveur de développement
stop_dev_server() {
    echo "🛑 Arrêt du serveur de développement existant..."
    
    # Arrêter tous les processus Next.js (sans sudo)
    NEXT_PIDS=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep | awk '{print $2}')
    if [ ! -z "$NEXT_PIDS" ]; then
        echo "📋 Arrêt des processus Next.js: $NEXT_PIDS"
        for PID in $NEXT_PIDS; do
            kill -TERM $PID 2>/dev/null
            sleep 1
            if kill -0 $PID 2>/dev/null; then
                kill -KILL $PID 2>/dev/null
            fi
        done
    fi
    
    # Arrêter les processus nohup liés au développement (sauf le processus actuel)
    CURRENT_PID=$$
    NOHUP_PIDS=$(ps aux | grep -E "(dev-with-timestamps)" | grep -v grep | awk '{print $2}' | grep -v $CURRENT_PID)
    if [ ! -z "$NOHUP_PIDS" ]; then
        echo "📋 Arrêt des processus nohup: $NOHUP_PIDS"
        for PID in $NOHUP_PIDS; do
            kill -TERM $PID 2>/dev/null
            sleep 1
            if kill -0 $PID 2>/dev/null; then
                kill -KILL $PID 2>/dev/null
            fi
        done
    fi
    
    # Nettoyer les fichiers de verrouillage
    if [ -f "/data/dalon974/dev/.next.lock" ]; then
        rm -f "/data/dalon974/dev/.next.lock"
        echo "🧹 Fichier .next.lock supprimé"
    fi
    
    # Attendre que les processus se terminent
    sleep 2
    
    # Vérifier qu'il n'y a plus de processus Next.js
    REMAINING_NEXT=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep)
    if [ -z "$REMAINING_NEXT" ]; then
        echo "✅ Serveur de développement arrêté avec succès"
    else
        echo "⚠️  Certains processus Next.js sont encore en cours"
        echo "$REMAINING_NEXT"
    fi
    echo ""
}

# Fonction pour ajouter un timestamp
timestamp_log() {
    while IFS= read -r line; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$timestamp] $line"
    done
}

# Arrêter le serveur existant avant de démarrer
stop_dev_server

# Démarrer le serveur avec horodatages
cd /data/dalon974/dev

echo "🚀 Démarrage du nouveau serveur de développement..."
echo ""

# Précompiler les pages pour améliorer les performances
echo "📦 Précompilation des pages..."
echo ""

# Nettoyer le cache Next.js
if [ -d ".next" ]; then
    echo "🧹 Nettoyage du cache Next.js..."
    rm -rf .next
fi

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    echo "📥 Installation des dépendances..."
    npm install --legacy-peer-deps
fi

# Générer les types Prisma
echo "🔧 Génération des types Prisma..."
npx prisma generate --no-hints

# Précompiler les pages statiques
echo "⚡ Précompilation des pages..."
npm run build 2>&1 | timestamp_log

echo ""
echo "✅ Précompilation terminée, démarrage du serveur..."
echo ""

# Rediriger stdout et stderr vers le fichier de log avec timestamps
npm run dev 2>&1 | timestamp_log | tee "$LOG_FILE"
