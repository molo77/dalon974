#!/bin/bash

# Script de rotation des logs pour rodcoloc
# Usage: ./scripts/rotate-logs.sh [prod|dev|all]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/logs"
BACKUP_DIR="$LOG_DIR/backup"

# Couleurs pour la console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${CYAN}🔄 $1${NC}"
}

# Créer le dossier de sauvegarde si nécessaire
mkdir -p "$BACKUP_DIR"

# Fonction pour faire la rotation d'un fichier de log
rotate_log() {
    local log_file="$1"
    local log_name="$2"
    
    if [ ! -f "$log_file" ]; then
        log_warning "Fichier de log non trouvé: $log_file"
        return 0
    fi
    
    # Vérifier la taille du fichier (en MB)
    local file_size=$(du -m "$log_file" | cut -f1)
    
    if [ "$file_size" -lt 10 ]; then
        log_info "$log_name: Fichier trop petit pour rotation ($file_size MB)"
        return 0
    fi
    
    # Créer le nom de sauvegarde avec timestamp
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/${log_name}_${timestamp}.log"
    
    log_info "Rotation de $log_name (${file_size} MB) vers $backup_file"
    
    # Copier le fichier vers la sauvegarde
    cp "$log_file" "$backup_file"
    
    # Vider le fichier original (garder le fichier mais vider le contenu)
    > "$log_file"
    
    log_success "Rotation terminée pour $log_name"
    
    # Compresser l'ancien fichier de sauvegarde s'il est volumineux
    if [ "$file_size" -gt 50 ]; then
        log_info "Compression de la sauvegarde..."
        gzip "$backup_file"
        log_success "Sauvegarde compressée: ${backup_file}.gz"
    fi
}

# Fonction pour nettoyer les anciennes sauvegardes
cleanup_old_backups() {
    local days_to_keep=${1:-30}
    
    log_info "Nettoyage des sauvegardes plus anciennes que $days_to_keep jours..."
    
    # Supprimer les fichiers .log plus anciens que X jours
    find "$BACKUP_DIR" -name "*.log" -type f -mtime +$days_to_keep -delete 2>/dev/null || true
    
    # Supprimer les fichiers .gz plus anciens que X jours
    find "$BACKUP_DIR" -name "*.log.gz" -type f -mtime +$days_to_keep -delete 2>/dev/null || true
    
    log_success "Nettoyage terminé"
}

# Fonction pour afficher les statistiques des logs
show_log_stats() {
    log_header "Statistiques des logs"
    echo ""
    
    # Statistiques des logs actuels
    if [ -f "$LOG_DIR/prod.log" ]; then
        local prod_size=$(du -h "$LOG_DIR/prod.log" | cut -f1)
        local prod_lines=$(wc -l < "$LOG_DIR/prod.log" 2>/dev/null || echo "0")
        log_info "Log de production: $prod_size ($prod_lines lignes)"
    fi
    
    if [ -f "$LOG_DIR/dev.log" ]; then
        local dev_size=$(du -h "$LOG_DIR/dev.log" | cut -f1)
        local dev_lines=$(wc -l < "$LOG_DIR/dev.log" 2>/dev/null || echo "0")
        log_info "Log de développement: $dev_size ($dev_lines lignes)"
    fi
    
    # Statistiques des sauvegardes
    local backup_count=$(find "$BACKUP_DIR" -name "*.log*" -type f | wc -l)
    local backup_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1 || echo "0")
    
    echo ""
    log_info "Sauvegardes: $backup_count fichiers ($backup_size)"
    
    if [ "$backup_count" -gt 0 ]; then
        echo ""
        log_info "Dernières sauvegardes:"
        find "$BACKUP_DIR" -name "*.log*" -type f -printf "%T@ %Tc %p\n" | sort -nr | head -5 | while read timestamp date file; do
            local size=$(du -h "$file" | cut -f1)
            echo "  - $(basename "$file") ($size) - $date"
        done
    fi
}

# Fonction d'aide
show_help() {
    echo -e "${CYAN}🔄 Log Rotation Manager${NC}"
    echo ""
    echo "Usage: $0 [commande] [options]"
    echo ""
    echo "Commandes disponibles:"
    echo "  prod           - Rotation du log de production uniquement"
    echo "  dev            - Rotation du log de développement uniquement"
    echo "  all            - Rotation de tous les logs"
    echo "  stats          - Afficher les statistiques des logs"
    echo "  cleanup [days] - Nettoyer les sauvegardes anciennes (défaut: 30 jours)"
    echo "  help           - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 prod                    # Rotation du log de production"
    echo "  $0 all                     # Rotation de tous les logs"
    echo "  $0 stats                   # Voir les statistiques"
    echo "  $0 cleanup 7               # Nettoyer les sauvegardes > 7 jours"
    echo ""
}

# Fonction principale
main() {
    local command=${1:-"help"}
    local option=${2:-""}
    
    case "$command" in
        "prod")
            log_header "Rotation du log de production"
            rotate_log "$LOG_DIR/prod.log" "prod"
            ;;
        "dev")
            log_header "Rotation du log de développement"
            rotate_log "$LOG_DIR/dev.log" "dev"
            ;;
        "all")
            log_header "Rotation de tous les logs"
            rotate_log "$LOG_DIR/prod.log" "prod"
            rotate_log "$LOG_DIR/dev.log" "dev"
            ;;
        "stats")
            show_log_stats
            ;;
        "cleanup")
            local days=${option:-30}
            log_header "Nettoyage des sauvegardes anciennes"
            cleanup_old_backups "$days"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Commande inconnue: $command"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Exécution du script
main "$@"

