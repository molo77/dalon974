#!/bin/bash
set -e

# Configuration
PROD_DIR="/data/dalon974/prod"
PROD_PORT=3000
LOG_DIR="$PROD_DIR/logs"

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

# Vérification du port
check_port() {
    if lsof -Pi :$PROD_PORT -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Port $PROD_PORT déjà utilisé. Arrêt du processus..."
        pkill -f "next start.*:$PROD_PORT" || true
        sleep 2
    fi
}

# Création du répertoire de logs
create_log_dir() {
    mkdir -p "$LOG_DIR"
    log_info "Répertoire de logs créé: $LOG_DIR"
}

# Vérification du build
check_build() {
    if [ ! -d ".next" ]; then
        log_info "Build de production manquant. Construction..."
        npm run build
    fi
}

# Démarrage de l'application
start_application() {
    log_info "Démarrage de l'environnement de production..."
    cd "$PROD_DIR"
    
    # Vérification des dépendances
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances..."
        npm install
    fi
    
    # Vérification du build
    check_build
    
    # Démarrage en arrière-plan
    nohup npm start > "$LOG_DIR/prod.log" 2>&1 &
    PROD_PID=$!
    
    log_success "Application démarrée avec PID: $PROD_PID"
    log_info "Logs disponibles dans: $LOG_DIR/prod.log"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé..."
    sleep 5
    
    if curl -f http://localhost:$PROD_PORT/api/health >/dev/null 2>&1; then
        log_success "Application accessible sur http://localhost:$PROD_PORT"
    else
        log_warning "Application pas encore prête, vérifiez les logs"
    fi
}

# Fonction principale
main() {
    log_info "=== Démarrage Environnement Prod ==="
    
    check_port
    create_log_dir
    start_application
    health_check
    
    log_success "Environnement de production prêt !"
    log_info "URL: http://localhost:$PROD_PORT"
    log_info "Logs: $LOG_DIR/prod.log"
}

# Exécution
main "$@"
