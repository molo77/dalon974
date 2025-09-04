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

# Fonction pour ajouter un timestamp
timestamp_log() {
    while IFS= read -r line; do
        timestamp=$(date '+%Y-%m-%d %H:%M:%S')
        echo "[$timestamp] $line"
    done
}

# Démarrer le serveur avec horodatages
cd /data/dalon974/dev

# Rediriger stdout et stderr vers le fichier de log avec timestamps
npm run dev 2>&1 | timestamp_log | tee "$LOG_FILE"
