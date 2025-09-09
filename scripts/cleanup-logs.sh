#!/bin/bash

# Script pour nettoyer et gérer la rotation des logs
# Usage: ./scripts/cleanup-logs.sh [--keep-days N] [--compress] [--dry-run]

LOG_DIR="/data/rodcoloc/logs"
BACKUP_DIR="/data/rodcoloc/logs/backup"
KEEP_DAYS=30
COMPRESS=false
DRY_RUN=false

# Fonction d'aide
show_help() {
    echo "🧹 Nettoyage des logs - rodcoloc"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --keep-days N  - Conserver les logs des N derniers jours (défaut: 30)"
    echo "  --compress     - Compresser les anciens logs"
    echo "  --dry-run      - Afficher ce qui serait fait sans l'exécuter"
    echo "  --help         - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 --keep-days 7 --compress"
    echo "  $0 --dry-run"
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --keep-days)
            KEEP_DAYS="$2"
            shift 2
            ;;
        --compress)
            COMPRESS=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

echo "🧹 Nettoyage des logs..."
echo "📁 Dossier des logs: $LOG_DIR"
echo "📁 Dossier de sauvegarde: $BACKUP_DIR"
echo "📅 Conservation: $KEEP_DAYS jours"
echo "🗜️  Compression: $([ "$COMPRESS" = true ] && echo "Oui" || echo "Non")"
echo "🔍 Mode dry-run: $([ "$DRY_RUN" = true ] && echo "Oui" || echo "Non")"
echo ""

# Créer le dossier de sauvegarde s'il n'existe pas
if [ "$DRY_RUN" = false ]; then
    mkdir -p "$BACKUP_DIR"
fi

# Fonction pour nettoyer un fichier de log
cleanup_log_file() {
    local log_file="$1"
    local log_name=$(basename "$log_file" .log)
    
    if [ ! -f "$log_file" ]; then
        echo "⚠️  Fichier non trouvé: $log_file"
        return
    fi
    
    echo "📝 Traitement de: $log_name.log"
    
    # Calculer la date de coupure
    local cutoff_date=$(date -d "$KEEP_DAYS days ago" '+%Y-%m-%d')
    echo "📅 Suppression des logs antérieurs à: $cutoff_date"
    
    # Séparer les logs récents des anciens
    local recent_file="${log_file}.recent"
    local old_file="${log_file}.old"
    
    if [ "$DRY_RUN" = true ]; then
        echo "🔍 [DRY-RUN] Séparation des logs récents/anciens"
        local old_lines=$(grep -c "^\[$cutoff_date\|^\[$(date -d "$cutoff_date - 1 day" '+%Y-%m-%d')\|^\[$(date -d "$cutoff_date - 2 days" '+%Y-%m-%d')" "$log_file" 2>/dev/null || echo "0")
        echo "🔍 [DRY-RUN] Lignes anciennes trouvées: $old_lines"
    else
        # Séparer les logs
        grep "^\[$cutoff_date\|^\[$(date -d "$cutoff_date - 1 day" '+%Y-%m-%d')\|^\[$(date -d "$cutoff_date - 2 days" '+%Y-%m-%d')" "$log_file" > "$old_file" 2>/dev/null || touch "$old_file"
        grep -v "^\[$cutoff_date\|^\[$(date -d "$cutoff_date - 1 day" '+%Y-%m-%d')\|^\[$(date -d "$cutoff_date - 2 days" '+%Y-%m-%d')" "$log_file" > "$recent_file" 2>/dev/null || cp "$log_file" "$recent_file"
        
        # Compresser les anciens logs si demandé
        if [ "$COMPRESS" = true ] && [ -s "$old_file" ]; then
            echo "🗜️  Compression des anciens logs..."
            gzip "$old_file"
            old_file="${old_file}.gz"
        fi
        
        # Déplacer les anciens logs vers le dossier de sauvegarde
        if [ -s "$old_file" ]; then
            local backup_name="${log_name}_$(date +%Y%m%d_%H%M%S)$([ "$old_file" = *.gz ] && echo ".gz" || echo "")"
            mv "$old_file" "$BACKUP_DIR/$backup_name"
            echo "📦 Anciens logs sauvegardés: $backup_name"
        else
            rm -f "$old_file"
        fi
        
        # Remplacer le fichier original par les logs récents
        mv "$recent_file" "$log_file"
        echo "✅ Logs récents conservés"
    fi
}

# Nettoyer les fichiers de log principaux
for log_type in dev prod maintenance; do
    log_file="$LOG_DIR/${log_type}.log"
    cleanup_log_file "$log_file"
    echo ""
done

# Nettoyer les anciennes sauvegardes
echo "🧹 Nettoyage des anciennes sauvegardes..."
if [ "$DRY_RUN" = true ]; then
    echo "🔍 [DRY-RUN] Recherche des sauvegardes anciennes..."
    find "$BACKUP_DIR" -name "*.log*" -mtime +$KEEP_DAYS 2>/dev/null | wc -l | xargs -I {} echo "🔍 [DRY-RUN] {} sauvegardes seraient supprimées"
else
    old_backups=$(find "$BACKUP_DIR" -name "*.log*" -mtime +$KEEP_DAYS 2>/dev/null)
    if [ -n "$old_backups" ]; then
        echo "🗑️  Suppression des sauvegardes anciennes..."
        echo "$old_backups" | while read -r backup; do
            echo "  - $(basename "$backup")"
            rm -f "$backup"
        done
    else
        echo "✅ Aucune sauvegarde ancienne à supprimer"
    fi
fi

# Afficher les statistiques
echo ""
echo "📊 Statistiques des logs:"
for log_type in dev prod maintenance; do
    log_file="$LOG_DIR/${log_type}.log"
    if [ -f "$log_file" ]; then
        size=$(du -h "$log_file" | cut -f1)
        lines=$(wc -l < "$log_file")
        echo "  📝 $log_type.log: $size ($lines lignes)"
    fi
done

backup_count=$(find "$BACKUP_DIR" -name "*.log*" 2>/dev/null | wc -l)
backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
echo "  📦 Sauvegardes: $backup_count fichiers ($backup_size)"

echo ""
echo "🎉 Nettoyage terminé !"
