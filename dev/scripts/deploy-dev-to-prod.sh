#!/bin/bash
set -e

# Configuration
DEV_DIR="/data/dalon974/dev"
PROD_DIR="/data/dalon974/prod"
BACKUP_DIR="/data/dalon974/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="prod_backup_${TIMESTAMP}"

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

# Vérification des processus
check_process() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Port $port utilisé, arrêt du processus..."
        pkill -f "next.*:$port" || true
        sleep 2
    fi
}

# Création de sauvegarde
create_backup() {
    log_info "Création de sauvegarde de production..."
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$PROD_DIR" ]; then
        cp -r "$PROD_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        log_success "Sauvegarde créée: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "Aucune production existante à sauvegarder"
    fi
}

# Nettoyage de production
clean_prod() {
    log_info "Nettoyage de l'environnement de production..."
    cd "$PROD_DIR"
    
    # Arrêt des processus
    check_process 3000
    
    # Nettoyage des fichiers
    rm -rf .next node_modules package-lock.json
    log_success "Environnement de production nettoyé"
}

# Copie des fichiers
copy_files() {
    log_info "Copie des fichiers de dev vers prod..."
    
    # Fichiers applicatifs
    rsync -av --exclude='node_modules' --exclude='.next' --exclude='logs' \
        "$DEV_DIR/" "$PROD_DIR/"
    
    log_success "Fichiers copiés avec succès"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances de production..."
    cd "$PROD_DIR"
    npm install
    log_success "Dépendances installées"
}

# Build de l'application
build_application() {
    log_info "Build de l'application de production..."
    cd "$PROD_DIR"
    npm run build
    log_success "Build terminé"
}

# Démarrage de l'application
start_application() {
    log_info "Démarrage de l'application de production..."
    cd "$PROD_DIR"
    
    # Démarrage en arrière-plan
    nohup npm start > logs/prod.log 2>&1 &
    PROD_PID=$!
    
    log_success "Application démarrée avec PID: $PROD_PID"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé..."
    sleep 10
    
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Application de production accessible"
    else
        log_error "Application de production non accessible"
        exit 1
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_backups() {
    log_info "Nettoyage des anciennes sauvegardes..."
    
    # Garder seulement les 5 dernières sauvegardes
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    log_success "Anciennes sauvegardes supprimées"
}

# Fonction principale
main() {
    log_info "=== Déploiement Dev vers Prod ==="
    
    create_backup
    clean_prod
    copy_files
    install_dependencies
    build_application
    start_application
    health_check
    cleanup_backups
    
    log_success "Déploiement terminé avec succès !"
    log_info "URL Production: http://localhost:3000"
    log_info "Sauvegarde: $BACKUP_DIR/$BACKUP_NAME"
}

# Exécution
main "$@"
