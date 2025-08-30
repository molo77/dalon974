#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEV_DIR="$PROJECT_ROOT/dev"
PROD_DIR="$PROJECT_ROOT/prod"
BACKUP_DIR="$PROJECT_ROOT/backups"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" >&2
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

# Extraction des paramètres de connexion depuis .env.local
extract_db_config() {
    local env_file="$1"
    local db_url=$(grep "DATABASE_URL=" "$env_file" | cut -d'"' -f2)
    
    # Parse MySQL URL: mysql://user:pass@host:port/database
    local user_pass=$(echo "$db_url" | sed 's|mysql://||' | cut -d'@' -f1)
    local host_port=$(echo "$db_url" | sed 's|mysql://||' | cut -d'@' -f2 | cut -d'/' -f1)
    local database=$(echo "$db_url" | sed 's|mysql://||' | cut -d'/' -f2)
    
    local user=$(echo "$user_pass" | cut -d':' -f1)
    local password=$(echo "$user_pass" | cut -d':' -f2 | sed 's/%40/@/g')
    local host=$(echo "$host_port" | cut -d':' -f1)
    local port=$(echo "$host_port" | cut -d':' -f2)
    
    echo "$user:$password:$host:$port:$database"
}

# Création de sauvegarde de la base de production
backup_production_database() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="$BACKUP_DIR/prod_db_backup_$timestamp.sql"
    
    log_info "Création de sauvegarde de la base de production..."
    
    # Extraction des paramètres de connexion prod
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local")
    local prod_user=$(echo "$prod_config" | cut -d':' -f1)
    local prod_password=$(echo "$prod_config" | cut -d':' -f2)
    local prod_host=$(echo "$prod_config" | cut -d':' -f3)
    local prod_port=$(echo "$prod_config" | cut -d':' -f4)
    local prod_database=$(echo "$prod_config" | cut -d':' -f5)
    
    # Création du répertoire de sauvegarde
    mkdir -p "$BACKUP_DIR"
    
    # Sauvegarde de la structure et des données
    MYSQL_PWD="$prod_password" mysqldump -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        --single-transaction --routines --triggers --events \
        "$prod_database" > "$backup_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Sauvegarde créée: $backup_file"
        echo "$backup_file"
    else
        log_error "Échec de la sauvegarde de la base de production"
        return 1
    fi
}

# Export de la structure de la base de développement
export_dev_structure() {
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local structure_file="$BACKUP_DIR/dev_structure_$timestamp.sql"
    
    log_info "Export de la structure de la base de développement..."
    
    # Extraction des paramètres de connexion dev
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local")
    local dev_user=$(echo "$dev_config" | cut -d':' -f1)
    local dev_password=$(echo "$dev_config" | cut -d':' -f2)
    local dev_host=$(echo "$dev_config" | cut -d':' -f3)
    local dev_port=$(echo "$dev_config" | cut -d':' -f4)
    local dev_database=$(echo "$dev_config" | cut -d':' -f5)
    
    # Export de la structure uniquement (pas les données)
    MYSQL_PWD="$dev_password" mysqldump -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        --no-data --single-transaction --routines --triggers --events \
        "$dev_database" > "$structure_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Structure exportée: $structure_file"
        echo "$structure_file"
    else
        log_error "Échec de l'export de la structure de développement"
        return 1
    fi
}

# Application de la structure à la base de production
apply_structure_to_production() {
    local structure_file="$1"
    
    log_info "Application de la structure à la base de production..."
    
    # Extraction des paramètres de connexion prod
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local")
    local prod_user=$(echo "$prod_config" | cut -d':' -f1)
    local prod_password=$(echo "$prod_config" | cut -d':' -f2)
    local prod_host=$(echo "$prod_config" | cut -d':' -f3)
    local prod_port=$(echo "$prod_config" | cut -d':' -f4)
    local prod_database=$(echo "$prod_config" | cut -d':' -f5)
    
    # Application de la structure
    MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        "$prod_database" < "$structure_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Structure appliquée avec succès à la base de production"
    else
        log_error "Échec de l'application de la structure à la production"
        return 1
    fi
}

# Vérification de la synchronisation
verify_synchronization() {
    log_info "Vérification de la synchronisation..."
    
    # Extraction des paramètres de connexion
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local")
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local")
    
    local dev_user=$(echo "$dev_config" | cut -d':' -f1)
    local dev_password=$(echo "$dev_config" | cut -d':' -f2)
    local dev_host=$(echo "$dev_config" | cut -d':' -f3)
    local dev_port=$(echo "$dev_config" | cut -d':' -f4)
    local dev_database=$(echo "$dev_config" | cut -d':' -f5)
    
    local prod_user=$(echo "$prod_config" | cut -d':' -f1)
    local prod_password=$(echo "$prod_config" | cut -d':' -f2)
    local prod_host=$(echo "$prod_config" | cut -d':' -f3)
    local prod_port=$(echo "$prod_config" | cut -d':' -f4)
    local prod_database=$(echo "$prod_config" | cut -d':' -f5)
    
    # Comparaison des structures
    local dev_structure=$(MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        -N -e "SHOW TABLES" "$dev_database" | sort)
    
    local prod_structure=$(MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        -N -e "SHOW TABLES" "$prod_database" | sort)
    
    if [ "$dev_structure" = "$prod_structure" ]; then
        log_success "Synchronisation vérifiée : les structures sont identiques"
        echo "Tables synchronisées :"
        echo "$dev_structure" | sed 's/^/  - /'
    else
        log_warning "Différences détectées entre les structures"
        echo "Tables en dev mais pas en prod :"
        comm -23 <(echo "$dev_structure") <(echo "$prod_structure") | sed 's/^/  - /'
        echo "Tables en prod mais pas en dev :"
        comm -13 <(echo "$dev_structure") <(echo "$prod_structure") | sed 's/^/  - /'
    fi
}

# Nettoyage des fichiers temporaires
cleanup_temp_files() {
    local structure_file="$1"
    local backup_file="$2"
    
    log_info "Nettoyage des fichiers temporaires..."
    
    if [ -n "$structure_file" ] && [ -f "$structure_file" ]; then
        rm "$structure_file"
        log_info "Fichier de structure supprimé"
    fi
    
    # Garder la sauvegarde pour sécurité
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        log_info "Sauvegarde conservée: $backup_file"
    fi
}

# Arrêt des serveurs
stop_servers() {
    log_info "Arrêt des serveurs avant synchronisation MySQL..."
    
    # Arrêt du serveur de développement
    log_info "Arrêt du serveur de développement..."
    pkill -f "next dev.*:3001" || true
    sleep 2
    
    # Arrêt du serveur de production
    log_info "Arrêt du serveur de production..."
    pkill -f "next start.*:3000" || true
    sleep 2
    
    log_success "Serveurs arrêtés pour synchronisation MySQL"
}

# Redémarrage des serveurs
restart_servers() {
    log_info "Redémarrage des serveurs après synchronisation MySQL..."
    
    # Redémarrage du serveur de développement
    log_info "Redémarrage du serveur de développement..."
    bash "$DEV_DIR/scripts/dev-start.sh" &
    sleep 5
    
    # Redémarrage du serveur de production
    log_info "Redémarrage du serveur de production..."
    bash "$PROD_DIR/scripts/prod-start.sh" &
    sleep 5
    
    log_success "Serveurs redémarrés après synchronisation MySQL"
}

# Fonction principale
main() {
    log_info "=== Synchronisation Structure MySQL Dev → Prod ==="
    
    # Arrêt des serveurs avant synchronisation
    stop_servers
    
    # Vérification des prérequis
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL client non installé"
        exit 1
    fi
    
    if ! command -v mysqldump &> /dev/null; then
        log_error "mysqldump non installé"
        exit 1
    fi
    
    # Vérification des fichiers de configuration
    if [ ! -f "$DEV_DIR/.env.local" ]; then
        log_error "Fichier de configuration dev manquant: $DEV_DIR/.env.local"
        exit 1
    fi
    
    if [ ! -f "$PROD_DIR/.env.local" ]; then
        log_error "Fichier de configuration prod manquant: $PROD_DIR/.env.local"
        exit 1
    fi
    
    local backup_file=""
    local structure_file=""
    
    # Sauvegarde de la production
    backup_file=$(backup_production_database)
    
    # Export de la structure de développement
    structure_file=$(export_dev_structure)
    
    # Vérification que le fichier existe
    if [ ! -f "$structure_file" ]; then
        log_error "Fichier de structure non trouvé: $structure_file"
        exit 1
    fi
    
    # Application à la production
    apply_structure_to_production "$structure_file"
    
    # Vérification
    verify_synchronization
    
    # Nettoyage
    cleanup_temp_files "$structure_file" "$backup_file"
    
    # Redémarrage des serveurs après synchronisation
    restart_servers
    
    log_success "Synchronisation de la structure MySQL terminée !"
    log_info "Sauvegarde de production conservée: $backup_file"
}

# Exécution du script
main "$@"
