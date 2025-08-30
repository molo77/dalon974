#!/bin/bash
set -e

# Configuration
DEV_DIR="/data/dalon974/dev"
DEV_PORT=3001
LOG_DIR="$DEV_DIR/logs"

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
    if lsof -Pi :$DEV_PORT -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Port $DEV_PORT déjà utilisé. Arrêt du processus..."
        pkill -f "next dev.*:$DEV_PORT" || true
        sleep 2
    fi
}

# Création du répertoire de logs
create_log_dir() {
    mkdir -p "$LOG_DIR"
    log_info "Répertoire de logs créé: $LOG_DIR"
}

# Démarrage de l'application
start_application() {
    log_info "Démarrage de l'environnement de développement..."
    cd "$DEV_DIR"
    
    # Vérification des dépendances
    if [ ! -d "node_modules" ]; then
        log_info "Installation des dépendances..."
        npm install
    fi
    
    # Démarrage en arrière-plan
    nohup npm run dev > "$LOG_DIR/dev.log" 2>&1 &
    DEV_PID=$!
    
    log_success "Application démarrée avec PID: $DEV_PID"
    log_info "Logs disponibles dans: $LOG_DIR/dev.log"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé..."
    sleep 5
    
    if curl -f http://localhost:$DEV_PORT/api/health >/dev/null 2>&1; then
        log_success "Application accessible sur http://localhost:$DEV_PORT"
    else
        log_warning "Application pas encore prête, vérifiez les logs"
    fi
}

# Fonction principale
main() {
    log_info "=== Démarrage Environnement Dev ==="
    
    check_port
    create_log_dir
    start_application
    health_check
    
    log_success "Environnement de développement prêt !"
    log_info "URL: http://localhost:$DEV_PORT"
    log_info "Logs: $LOG_DIR/dev.log"
}

# Exécution
main "$@"
