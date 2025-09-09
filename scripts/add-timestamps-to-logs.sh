#!/bin/bash

# Script pour ajouter des horodatages aux logs existants
# Usage: ./scripts/add-timestamps-to-logs.sh

LOG_DIR="/data/rodcoloc/logs"
BACKUP_DIR="/data/rodcoloc/logs/backup"

echo "🕒 Ajout d'horodatages aux logs..."

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

# Fonction pour ajouter un timestamp à une ligne
add_timestamp() {
    local line="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Si la ligne commence déjà par un timestamp, la laisser telle quelle
    if [[ $line =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2} ]]; then
        echo "$line"
    else
        echo "[$timestamp] $line"
    fi
}

# Traiter le fichier dev.log
if [ -f "$LOG_DIR/dev.log" ]; then
    echo "📝 Traitement de dev.log..."
    
    # Sauvegarder l'original
    cp "$LOG_DIR/dev.log" "$BACKUP_DIR/dev.log.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Créer une version avec timestamps
    temp_file=$(mktemp)
    while IFS= read -r line; do
        add_timestamp "$line" >> "$temp_file"
    done < "$LOG_DIR/dev.log"
    
    # Remplacer le fichier original
    mv "$temp_file" "$LOG_DIR/dev.log"
    echo "✅ dev.log traité"
fi

# Traiter le fichier prod.log s'il existe
if [ -f "$LOG_DIR/prod.log" ]; then
    echo "📝 Traitement de prod.log..."
    
    # Sauvegarder l'original
    cp "$LOG_DIR/prod.log" "$BACKUP_DIR/prod.log.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Créer une version avec timestamps
    temp_file=$(mktemp)
    while IFS= read -r line; do
        add_timestamp "$line" >> "$temp_file"
    done < "$LOG_DIR/prod.log"
    
    # Remplacer le fichier original
    mv "$temp_file" "$LOG_DIR/prod.log"
    echo "✅ prod.log traité"
fi

# Traiter le fichier maintenance.log s'il existe
if [ -f "$LOG_DIR/maintenance.log" ]; then
    echo "📝 Traitement de maintenance.log..."
    
    # Sauvegarder l'original
    cp "$LOG_DIR/maintenance.log" "$BACKUP_DIR/maintenance.log.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Créer une version avec timestamps
    temp_file=$(mktemp)
    while IFS= read -r line; do
        add_timestamp "$line" >> "$temp_file"
    done < "$LOG_DIR/maintenance.log"
    
    # Remplacer le fichier original
    mv "$temp_file" "$LOG_DIR/maintenance.log"
    echo "✅ maintenance.log traité"
fi

echo "🎉 Horodatages ajoutés avec succès !"
echo "📁 Sauvegardes créées dans: $BACKUP_DIR"
echo ""
echo "💡 Pour les futurs logs, utilisez:"
echo "   npm run dev 2>&1 | while read line; do echo \"[\$(date '+%Y-%m-%d %H:%M:%S')] \$line\"; done | tee logs/dev.log"
