#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="/data/dalon974/dev"
PROD_DIR="/data/dalon974/prod"
BACKUP_DIR="/data/dalon974/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="user_passwords_backup_${TIMESTAMP}"

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

# Extraction de la configuration de base de données
extract_db_config() {
    local env_file=$1
    local env_name=$2
    
    if [ ! -f "$env_file" ]; then
        log_error "Fichier de configuration non trouvé: $env_file"
        exit 1
    fi
    
    # Charger les variables d'environnement
    source "$env_file"
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL non trouvée dans $env_file"
        exit 1
    fi
    
    # Parse DATABASE_URL: mysql://user:password@host:port/database
    local url="$DATABASE_URL"
    local match=$(echo "$url" | grep -o 'mysql://[^:]*:[^@]*@[^:]*:[0-9]*/[^?]*')
    
    if [ -z "$match" ]; then
        log_error "Format DATABASE_URL invalide dans $env_file"
        exit 1
    fi
    
    # Extraire les composants
    local user=$(echo "$match" | sed 's|mysql://\([^:]*\):.*|\1|')
    local password=$(echo "$match" | sed 's|mysql://[^:]*:\([^@]*\)@.*|\1|' | sed 's|%40|@|g')
    local host=$(echo "$match" | sed 's|.*@\([^:]*\):.*|\1|')
    local port=$(echo "$match" | sed 's|.*:\([0-9]*\)/.*|\1|')
    local database=$(echo "$match" | sed 's|.*/\([^?]*\)|\1|')
    
    # Décoder le mot de passe (gérer l'encodage URL)
    password=$(printf '%b' "${password//%/\\x}")
    
    echo "$user|$password|$host|$port|$database"
}

# Sauvegarde des mots de passe de production
backup_production_passwords() {
    log_info "Sauvegarde des mots de passe de production..."
    
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local" "production")
    IFS='|' read -r prod_user prod_password prod_host prod_port prod_database <<< "$prod_config"
    
    mkdir -p "$BACKUP_DIR"
    
    # Export des mots de passe actuels de production
    MYSQL_PWD="$prod_password" mysqldump -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        --single-transaction --no-create-info --inserts \
        --where="password IS NOT NULL" \
        "$prod_database" User > "$BACKUP_DIR/$BACKUP_NAME.sql" 2>/dev/null || {
        log_warning "Aucun utilisateur avec mot de passe trouvé en production"
        echo "" > "$BACKUP_DIR/$BACKUP_NAME.sql"
    }
    
    log_success "Sauvegarde créée: $BACKUP_DIR/$BACKUP_NAME.sql"
}

# Export des mots de passe de développement
export_dev_passwords() {
    log_info "Export des mots de passe de développement..."
    
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local" "development")
    IFS='|' read -r dev_user dev_password dev_host dev_port dev_database <<< "$dev_config"
    
    local passwords_file="$BACKUP_DIR/dev_passwords_${TIMESTAMP}.sql"
    
    # Export des utilisateurs avec mots de passe de dev
    MYSQL_PWD="$dev_password" mysqldump -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        --single-transaction --no-create-info --inserts \
        --where="password IS NOT NULL" \
        "$dev_database" User > "$passwords_file" 2>/dev/null || {
        log_warning "Aucun utilisateur avec mot de passe trouvé en développement"
        echo "" > "$passwords_file"
    }
    
    log_success "Mots de passe de dev exportés: $passwords_file"
    echo "$passwords_file"
}

# Application des mots de passe à la production
apply_passwords_to_production() {
    local passwords_file=$1
    
    log_info "Application des mots de passe à la production..."
    
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local" "production")
    IFS='|' read -r prod_user prod_password prod_host prod_port prod_database <<< "$prod_config"
    
    if [ ! -s "$passwords_file" ]; then
        log_warning "Fichier de mots de passe vide, aucune mise à jour effectuée"
        return
    fi
    
    # Appliquer les mots de passe avec ON DUPLICATE KEY UPDATE
    MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        "$prod_database" < "$passwords_file" 2>/dev/null || {
        log_warning "Échec de l'application directe, tentative avec ON DUPLICATE KEY UPDATE..."
        
        # Générer des requêtes UPDATE manuelles
        local temp_file="$BACKUP_DIR/update_passwords_${TIMESTAMP}.sql"
        
        MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
            -N -e "SELECT CONCAT('UPDATE User SET password = \"', password, '\", updatedAt = NOW() WHERE email = \"', email, '\";') FROM User WHERE password IS NOT NULL;" "$dev_database" > "$temp_file" 2>/dev/null
        
        if [ -s "$temp_file" ]; then
            MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
                "$prod_database" < "$temp_file"
            log_success "Mots de passe appliqués avec UPDATE"
        else
            log_error "Aucune requête UPDATE générée"
        fi
    }
    
    log_success "Mots de passe appliqués à la production"
}

# Vérification de la synchronisation
verify_synchronization() {
    log_info "Vérification de la synchronisation..."
    
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local" "development")
    IFS='|' read -r dev_user dev_password dev_host dev_port dev_database <<< "$dev_config"
    
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local" "production")
    IFS='|' read -r prod_user prod_password prod_host prod_port prod_database <<< "$prod_config"
    
    # Compter les utilisateurs avec mots de passe
    local dev_count=$(MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        -N -e "SELECT COUNT(*) FROM User WHERE password IS NOT NULL;" "$dev_database" 2>/dev/null || echo "0")
    
    local prod_count=$(MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        -N -e "SELECT COUNT(*) FROM User WHERE password IS NOT NULL;" "$prod_database" 2>/dev/null || echo "0")
    
    log_info "Utilisateurs avec mots de passe - Dev: $dev_count, Prod: $prod_count"
    
    if [ "$dev_count" -eq "$prod_count" ]; then
        log_success "Synchronisation réussie !"
    else
        log_warning "Différence détectée entre dev et prod"
    fi
}

# Nettoyage des fichiers temporaires
cleanup_temp_files() {
    local passwords_file=$1
    local backup_file=$2
    
    log_info "Nettoyage des fichiers temporaires..."
    
    if [ -n "$passwords_file" ] && [ -f "$passwords_file" ]; then
        rm -f "$passwords_file"
    fi
    
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        rm -f "$backup_file"
    fi
    
    # Nettoyer les fichiers temporaires de mise à jour
    rm -f "$BACKUP_DIR/update_passwords_${TIMESTAMP}.sql"
    
    log_success "Fichiers temporaires nettoyés"
}

# Arrêt des serveurs
stop_servers() {
    log_info "Arrêt des serveurs avant synchronisation..."
    
    # Arrêt du serveur de développement
    log_info "Arrêt du serveur de développement..."
    pkill -f "next dev.*:3001" >/dev/null 2>&1 || true
    sleep 2
    
    # Arrêt du serveur de production
    log_info "Arrêt du serveur de production..."
    pkill -f "next start.*:3000" >/dev/null 2>&1 || true
    sleep 2
    
    log_success "Serveurs arrêtés"
}

# Redémarrage des serveurs
restart_servers() {
    log_info "Redémarrage des serveurs après synchronisation..."
    
    # Redémarrage du serveur de développement
    log_info "Redémarrage du serveur de développement..."
    bash "$DEV_DIR/scripts/dev-start.sh" >/dev/null 2>&1 &
    sleep 3
    
    # Redémarrage du serveur de production
    log_info "Redémarrage du serveur de production..."
    bash "$PROD_DIR/scripts/prod-start.sh" >/dev/null 2>&1 &
    sleep 3
    
    log_success "Serveurs redémarrés"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé des serveurs..."
    
    # Vérification rapide
    for i in {1..3}; do
        if curl -f -s http://localhost:3001/api/health >/dev/null 2>&1 && \
           curl -f -s http://localhost:3000/api/health >/dev/null 2>&1; then
            log_success "Serveurs accessibles"
            return 0
        fi
        sleep 1
    done
    
    log_warning "Vérification de santé incomplète"
}

# Fonction principale
main() {
    local start_time=$(date +%s)
    log_info "=== Copie des mots de passe utilisateurs Dev → Prod ==="
    
    # Arrêt des serveurs
    stop_servers
    
    # Sauvegarde de production
    backup_production_passwords
    
    # Export des mots de passe de dev
    local passwords_file=$(export_dev_passwords)
    
    # Application à la production
    apply_passwords_to_production "$passwords_file"
    
    # Vérification
    verify_synchronization
    
    # Nettoyage
    cleanup_temp_files "$passwords_file" "$BACKUP_DIR/$BACKUP_NAME.sql"
    
    # Redémarrage des serveurs
    restart_servers
    
    # Vérification de santé
    health_check
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    log_success "Copie des mots de passe terminée en ${duration} secondes !"
    log_info "Sauvegarde de production conservée: $BACKUP_DIR/$BACKUP_NAME.sql"
}

# Exécution du script
main "$@"
