#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="/data/dalon974/dev"
PROD_DIR="/data/dalon974/prod"
UPLOADS_DIR="public/uploads"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification de l'existence des dossiers
check_directories() {
    if [ ! -d "$DEV_DIR/$UPLOADS_DIR" ]; then
        log_error "Dossier uploads de développement non trouvé: $DEV_DIR/$UPLOADS_DIR"
        exit 1
    fi
    
    if [ ! -d "$PROD_DIR/$UPLOADS_DIR" ]; then
        log_info "Création du dossier uploads de production..."
        mkdir -p "$PROD_DIR/$UPLOADS_DIR"
        log_success "Dossier uploads de production créé"
    fi
}

# Affichage des statistiques des uploads
show_stats() {
    log_info "=== Statistiques des uploads ==="
    
    # Statistiques dev
    if [ -d "$DEV_DIR/$UPLOADS_DIR" ]; then
        local dev_count=$(find "$DEV_DIR/$UPLOADS_DIR" -type f | wc -l)
        local dev_size=$(du -sh "$DEV_DIR/$UPLOADS_DIR" 2>/dev/null | cut -f1 || echo "0")
        log_info "Dev uploads: $dev_count fichiers, $dev_size"
    fi
    
    # Statistiques prod
    if [ -d "$PROD_DIR/$UPLOADS_DIR" ]; then
        local prod_count=$(find "$PROD_DIR/$UPLOADS_DIR" -type f | wc -l)
        local prod_size=$(du -sh "$PROD_DIR/$UPLOADS_DIR" 2>/dev/null | cut -f1 || echo "0")
        log_info "Prod uploads: $prod_count fichiers, $prod_size"
    fi
}

# Synchronisation sélective des uploads
sync_uploads() {
    local action=$1
    
    case $action in
        "dev-to-prod")
            log_info "Synchronisation des uploads de dev vers prod..."
            rsync -av --delete "$DEV_DIR/$UPLOADS_DIR/" "$PROD_DIR/$UPLOADS_DIR/"
            log_success "Uploads synchronisés de dev vers prod"
            ;;
        "prod-to-dev")
            log_info "Synchronisation des uploads de prod vers dev..."
            rsync -av --delete "$PROD_DIR/$UPLOADS_DIR/" "$DEV_DIR/$UPLOADS_DIR/"
            log_success "Uploads synchronisés de prod vers dev"
            ;;
        "merge")
            log_info "Fusion des uploads (conservation des deux côtés)..."
            rsync -av "$DEV_DIR/$UPLOADS_DIR/" "$PROD_DIR/$UPLOADS_DIR/"
            rsync -av "$PROD_DIR/$UPLOADS_DIR/" "$DEV_DIR/$UPLOADS_DIR/"
            log_success "Uploads fusionnés"
            ;;
        *)
            log_error "Action invalide: $action"
            exit 1
            ;;
    esac
}

# Nettoyage des uploads
clean_uploads() {
    local environment=$1
    local days=$2
    
    if [ -z "$days" ]; then
        days=30
    fi
    
    log_info "Nettoyage des uploads de $environment (plus de $days jours)..."
    
    case $environment in
        "dev")
            if [ -d "$DEV_DIR/$UPLOADS_DIR" ]; then
                find "$DEV_DIR/$UPLOADS_DIR" -type f -mtime +$days -delete
                log_success "Uploads de dev nettoyés"
            fi
            ;;
        "prod")
            if [ -d "$PROD_DIR/$UPLOADS_DIR" ]; then
                find "$PROD_DIR/$UPLOADS_DIR" -type f -mtime +$days -delete
                log_success "Uploads de prod nettoyés"
            fi
            ;;
        "all")
            if [ -d "$DEV_DIR/$UPLOADS_DIR" ]; then
                find "$DEV_DIR/$UPLOADS_DIR" -type f -mtime +$days -delete
            fi
            if [ -d "$PROD_DIR/$UPLOADS_DIR" ]; then
                find "$PROD_DIR/$UPLOADS_DIR" -type f -mtime +$days -delete
            fi
            log_success "Uploads de dev et prod nettoyés"
            ;;
        *)
            log_error "Environnement invalide: $environment"
            exit 1
            ;;
    esac
}

# Sauvegarde des uploads
backup_uploads() {
    local environment=$1
    local backup_dir="/data/dalon974/backups/uploads"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    
    mkdir -p "$backup_dir"
    
    case $environment in
        "dev")
            log_info "Sauvegarde des uploads de dev..."
            tar -czf "$backup_dir/dev_uploads_$timestamp.tar.gz" -C "$DEV_DIR" "$UPLOADS_DIR"
            log_success "Sauvegarde dev créée: $backup_dir/dev_uploads_$timestamp.tar.gz"
            ;;
        "prod")
            log_info "Sauvegarde des uploads de prod..."
            tar -czf "$backup_dir/prod_uploads_$timestamp.tar.gz" -C "$PROD_DIR" "$UPLOADS_DIR"
            log_success "Sauvegarde prod créée: $backup_dir/prod_uploads_$timestamp.tar.gz"
            ;;
        "all")
            log_info "Sauvegarde des uploads de dev et prod..."
            tar -czf "$backup_dir/dev_uploads_$timestamp.tar.gz" -C "$DEV_DIR" "$UPLOADS_DIR"
            tar -czf "$backup_dir/prod_uploads_$timestamp.tar.gz" -C "$PROD_DIR" "$UPLOADS_DIR"
            log_success "Sauvegardes créées"
            ;;
        *)
            log_error "Environnement invalide: $environment"
            exit 1
            ;;
    esac
    
    # Nettoyage des anciennes sauvegardes (garder les 5 dernières)
    cd "$backup_dir"
    ls -t *.tar.gz | tail -n +6 | xargs -r rm -f
}

# Restauration des uploads
restore_uploads() {
    local backup_file=$1
    local environment=$2
    
    if [ ! -f "$backup_file" ]; then
        log_error "Fichier de sauvegarde non trouvé: $backup_file"
        exit 1
    fi
    
    case $environment in
        "dev")
            log_info "Restauration des uploads de dev..."
            tar -xzf "$backup_file" -C "$DEV_DIR"
            log_success "Uploads de dev restaurés"
            ;;
        "prod")
            log_info "Restauration des uploads de prod..."
            tar -xzf "$backup_file" -C "$PROD_DIR"
            log_success "Uploads de prod restaurés"
            ;;
        *)
            log_error "Environnement invalide: $environment"
            exit 1
            ;;
    esac
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 [COMMANDE] [OPTIONS]"
    echo ""
    echo "Commandes:"
    echo "  stats                    Afficher les statistiques des uploads"
    echo "  sync dev-to-prod         Synchroniser dev vers prod"
    echo "  sync prod-to-dev         Synchroniser prod vers dev"
    echo "  sync merge               Fusionner les uploads"
    echo "  clean [env] [jours]      Nettoyer les uploads (env: dev/prod/all, défaut: 30 jours)"
    echo "  backup [env]             Sauvegarder les uploads (env: dev/prod/all)"
    echo "  restore [file] [env]     Restaurer les uploads"
    echo "  help                     Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 stats"
    echo "  $0 sync dev-to-prod"
    echo "  $0 clean dev 7"
    echo "  $0 backup all"
    echo "  $0 restore /path/to/backup.tar.gz dev"
}

# Fonction principale
main() {
    local command=$1
    local arg1=$2
    local arg2=$3
    
    case $command in
        "stats")
            check_directories
            show_stats
            ;;
        "sync")
            check_directories
            sync_uploads "$arg1"
            show_stats
            ;;
        "clean")
            check_directories
            clean_uploads "$arg1" "$arg2"
            show_stats
            ;;
        "backup")
            check_directories
            backup_uploads "$arg1"
            ;;
        "restore")
            restore_uploads "$arg1" "$arg2"
            ;;
        "help"|"--help"|"-h"|"")
            show_help
            ;;
        *)
            log_error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

# Exécution
main "$@"
