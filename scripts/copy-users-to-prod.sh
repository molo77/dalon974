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
    local backup_file="$BACKUP_DIR/prod_users_backup_$timestamp.sql"
    
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
    
    # Sauvegarde de la table User (même si vide)
    MYSQL_PWD="$prod_password" mysqldump -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        --single-transaction --no-create-info --inserts \
        "$prod_database" User > "$backup_file" 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        log_success "Sauvegarde créée: $backup_file"
        echo "$backup_file"
    else
        log_error "Échec de la sauvegarde de la base de production"
        return 1
    fi
}

# Vérification des utilisateurs dans la base de développement
check_dev_users() {
    local emails="$1"
    
    log_info "Vérification des utilisateurs dans la base de développement..."
    
    # Extraction des paramètres de connexion dev
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local")
    local dev_user=$(echo "$dev_config" | cut -d':' -f1)
    local dev_password=$(echo "$dev_config" | cut -d':' -f2)
    local dev_host=$(echo "$dev_config" | cut -d':' -f3)
    local dev_port=$(echo "$dev_config" | cut -d':' -f4)
    local dev_database=$(echo "$dev_config" | cut -d':' -f5)
    
    # Vérification des utilisateurs
    local result=$(MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        -N -e "SELECT COUNT(*) FROM User WHERE email IN ($emails);" "$dev_database" 2>/dev/null)
    
    if [ "$result" -gt 0 ]; then
        log_success "Utilisateurs trouvés dans la base de développement"
        return 0
    else
        log_warning "Aucun utilisateur trouvé dans la base de développement"
        return 1
    fi
}

# Export des utilisateurs de la base de développement
export_dev_users() {
    local emails="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local users_file="$BACKUP_DIR/dev_users_$timestamp.sql"
    
    log_info "Export des utilisateurs de la base de développement..."
    
    # Extraction des paramètres de connexion dev
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local")
    local dev_user=$(echo "$dev_config" | cut -d':' -f1)
    local dev_password=$(echo "$dev_config" | cut -d':' -f2)
    local dev_host=$(echo "$dev_config" | cut -d':' -f3)
    local dev_port=$(echo "$dev_config" | cut -d':' -f4)
    local dev_database=$(echo "$dev_config" | cut -d':' -f5)
    
    # Export des utilisateurs
    MYSQL_PWD="$dev_password" mysqldump -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        --single-transaction --no-create-info --inserts \
        --where="email IN ($emails)" \
        "$dev_database" User > "$users_file" 2>/dev/null || {
        # Fallback: export manuel si mysqldump échoue
        log_warning "mysqldump échoué, export manuel..."
        MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
            -N -e "SELECT CONCAT('INSERT INTO \`User\` (\`id\`, \`email\`, \`name\`, \`displayName\`, \`role\`, \`createdAt\`, \`updatedAt\`) VALUES (\"', id, '\", \"', email, '\", \"', COALESCE(name, ''), '\", \"', COALESCE(displayName, ''), '\", \"', COALESCE(role, ''), '\", \"', createdAt, '\", \"', COALESCE(updatedAt, createdAt), '\") ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`displayName\`=VALUES(\`displayName\`), \`role\`=VALUES(\`role\`), \`updatedAt\`=VALUES(\`updatedAt\`);') FROM User WHERE email IN ($emails);" "$dev_database" > "$users_file" 2>/dev/null
    }
    
    if [ $? -eq 0 ]; then
        log_success "Utilisateurs exportés: $users_file"
        echo "$users_file"
    else
        log_error "Échec de l'export des utilisateurs"
        return 1
    fi
}

# Application des utilisateurs à la base de production
apply_users_to_production() {
    local users_file="$1"
    
    log_info "Application des utilisateurs à la base de production..."
    
    # Extraction des paramètres de connexion prod
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local")
    local prod_user=$(echo "$prod_config" | cut -d':' -f1)
    local prod_password=$(echo "$prod_config" | cut -d':' -f2)
    local prod_host=$(echo "$prod_config" | cut -d':' -f3)
    local prod_port=$(echo "$prod_config" | cut -d':' -f4)
    local prod_database=$(echo "$prod_config" | cut -d':' -f5)
    
    # Application des utilisateurs
    MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        "$prod_database" < "$users_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Utilisateurs appliqués avec succès à la base de production"
    else
        log_error "Échec de l'application des utilisateurs à la production"
        return 1
    fi
}

# Vérification de la copie
verify_users_copy() {
    local emails="$1"
    
    log_info "Vérification de la copie des utilisateurs..."
    
    # Extraction des paramètres de connexion prod
    local prod_config=$(extract_db_config "$PROD_DIR/.env.local")
    local prod_user=$(echo "$prod_config" | cut -d':' -f1)
    local prod_password=$(echo "$prod_config" | cut -d':' -f2)
    local prod_host=$(echo "$prod_config" | cut -d':' -f3)
    local prod_port=$(echo "$prod_config" | cut -d':' -f4)
    local prod_database=$(echo "$prod_config" | cut -d':' -f5)
    
    # Vérification des utilisateurs en production
    local result=$(MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
        -N -e "SELECT COUNT(*) FROM User WHERE email IN ($emails);" "$prod_database" 2>/dev/null)
    
    if [ "$result" -gt 0 ]; then
        log_success "Utilisateurs vérifiés en production"
        
        # Affichage des utilisateurs copiés
        echo "Utilisateurs copiés :"
        MYSQL_PWD="$prod_password" mysql -h "$prod_host" -P "$prod_port" -u "$prod_user" \
            -e "SELECT email, name, displayName, role FROM User WHERE email IN ($emails);" "$prod_database" 2>/dev/null
    else
        log_error "Aucun utilisateur trouvé en production"
        return 1
    fi
}

# Nettoyage des fichiers temporaires
cleanup_temp_files() {
    local users_file="$1"
    local backup_file="$2"
    
    log_info "Nettoyage des fichiers temporaires..."
    
    if [ -n "$users_file" ] && [ -f "$users_file" ]; then
        rm "$users_file"
        log_info "Fichier d'utilisateurs supprimé"
    fi
    
    # Garder la sauvegarde pour sécurité
    if [ -n "$backup_file" ] && [ -f "$backup_file" ]; then
        log_info "Sauvegarde conservée: $backup_file"
    fi
}

# Arrêt des serveurs
stop_servers() {
    log_info "Arrêt des serveurs avant copie d'utilisateurs..."
    
    # Arrêt du serveur de développement
    log_info "Arrêt du serveur de développement..."
    pkill -f "next dev.*:3001" || true
    sleep 2
    
    # Arrêt du serveur de production
    log_info "Arrêt du serveur de production..."
    pkill -f "next start.*:3000" || true
    sleep 2
    
    log_success "Serveurs arrêtés pour copie d'utilisateurs"
}

# Redémarrage des serveurs
restart_servers() {
    log_info "Redémarrage des serveurs après copie d'utilisateurs..."
    
    # Redémarrage du serveur de développement
    log_info "Redémarrage du serveur de développement..."
    bash "$DEV_DIR/scripts/dev-start.sh" &
    sleep 5
    
    # Redémarrage du serveur de production
    log_info "Redémarrage du serveur de production..."
    bash "$PROD_DIR/scripts/prod-start.sh" &
    sleep 5
    
    log_success "Serveurs redémarrés après copie d'utilisateurs"
}

# Fonction principale
main() {
    local emails="'molo777@gmail.com', 'cedric.roddier@gmail.com'"
    
    log_info "=== Copie Utilisateurs Dev → Prod ==="
    log_info "Emails à copier: $emails"
    
    # Arrêt des serveurs avant copie
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
    local users_file=""
    
    # Vérification des utilisateurs en dev
    if ! check_dev_users "$emails"; then
        log_warning "Aucun utilisateur à copier trouvé en développement"
        log_info "Création d'utilisateurs par défaut..."
        create_default_users "$emails"
    fi
    
    # Sauvegarde de la production
    backup_file=$(backup_production_database)
    
    # Export des utilisateurs de développement
    users_file=$(export_dev_users "$emails")
    
    # Vérification que le fichier existe
    if [ ! -f "$users_file" ]; then
        log_error "Fichier d'utilisateurs non trouvé: $users_file"
        exit 1
    fi
    
    # Application à la production
    apply_users_to_production "$users_file"
    
    # Vérification
    verify_users_copy "$emails"
    
    # Nettoyage
    cleanup_temp_files "$users_file" "$backup_file"
    
    # Redémarrage des serveurs après copie
    restart_servers
    
    log_success "Copie des utilisateurs terminée !"
    log_info "Sauvegarde de production conservée: $backup_file"
}

# Création d'utilisateurs par défaut si aucun n'existe
create_default_users() {
    local emails="$1"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local users_file="$BACKUP_DIR/default_users_$timestamp.sql"
    
    log_info "Création d'utilisateurs par défaut..."
    
    # Extraction des paramètres de connexion dev
    local dev_config=$(extract_db_config "$DEV_DIR/.env.local")
    local dev_user=$(echo "$dev_config" | cut -d':' -f1)
    local dev_password=$(echo "$dev_config" | cut -d':' -f2)
    local dev_host=$(echo "$dev_config" | cut -d':' -f3)
    local dev_port=$(echo "$dev_config" | cut -d':' -f4)
    local dev_database=$(echo "$dev_config" | cut -d':' -f5)
    
    # Création du fichier SQL avec les utilisateurs par défaut
    cat > "$users_file" << EOF
INSERT INTO \`User\` (\`id\`, \`email\`, \`name\`, \`displayName\`, \`role\`, \`createdAt\`, \`updatedAt\`) VALUES
('molo777-user-id', 'molo777@gmail.com', 'Molo', 'Molo Admin', 'admin', NOW(), NOW()),
('cedric-user-id', 'cedric.roddier@gmail.com', 'Cedric', 'Cedric Roddier', 'user', NOW(), NOW());
EOF
    
    # Application à la base de développement
    MYSQL_PWD="$dev_password" mysql -h "$dev_host" -P "$dev_port" -u "$dev_user" \
        "$dev_database" < "$users_file" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Utilisateurs par défaut créés en développement"
        rm "$users_file"
    else
        log_error "Échec de la création des utilisateurs par défaut"
        return 1
    fi
}

# Exécution du script
main "$@"
