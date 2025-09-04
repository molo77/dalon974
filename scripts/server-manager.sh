#!/bin/bash

# Script de gestion des serveurs dalon974
# Usage: ./scripts/server-manager.sh [dev|prod|both|stop|status|clean]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEV_DIR="$PROJECT_ROOT/dev"
PROD_DIR="$PROJECT_ROOT/prod"
LOG_DIR="$PROJECT_ROOT/logs"

# Couleurs pour la console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
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
    echo -e "${CYAN}🚀 $1${NC}"
}

# Créer le dossier logs si nécessaire
mkdir -p "$LOG_DIR"

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    if lsof -i :$port >/dev/null 2>&1; then
        return 0  # Port utilisé
    elif netstat -tuln 2>/dev/null | grep -q ":$port "; then
        return 0  # Port utilisé (fallback avec netstat)
    else
        return 1  # Port libre
    fi
}

# Fonction pour arrêter les serveurs
stop_servers() {
    log_info "Arrêt des serveurs..."
    
    # Arrêt du serveur de développement (port 3001)
    if check_port 3001; then
        log_info "Arrêt du serveur de développement (port 3001)..."
        pkill -f "next dev.*:3001" || true
        sleep 2
    fi
    
    # Arrêt du serveur de production (port 3000)
    if check_port 3000; then
        log_info "Arrêt du serveur de production (port 3000)..."
        pkill -f "next start.*:3000" || true
        sleep 2
    fi
    
    # Arrêt de tous les processus Next.js restants
    pkill -f "next" || true
    sleep 1
    
    log_success "Serveurs arrêtés"
}

# Fonction pour nettoyer les caches et fichiers temporaires
clean_environment() {
    log_info "Nettoyage de l'environnement..."
    
    # Suppression des dossiers .next
    if [ -d "$DEV_DIR/.next" ]; then
        log_info "Suppression du cache dev (.next)..."
        rm -rf "$DEV_DIR/.next"
    fi
    
    if [ -d "$PROD_DIR/.next" ]; then
        log_info "Suppression du cache prod (.next)..."
        rm -rf "$PROD_DIR/.next"
    fi
    
    # Suppression des caches node_modules
    if [ -d "$DEV_DIR/node_modules/.cache" ]; then
        log_info "Suppression du cache node_modules dev..."
        rm -rf "$DEV_DIR/node_modules/.cache"
    fi
    
    if [ -d "$PROD_DIR/node_modules/.cache" ]; then
        log_info "Suppression du cache node_modules prod..."
        rm -rf "$PROD_DIR/node_modules/.cache"
    fi
    
    # Suppression des fichiers de lock
    find "$PROJECT_ROOT" -name "*.lock" -type f -delete 2>/dev/null || true
    
    log_success "Environnement nettoyé"
}

# Fonction pour vérifier le statut des serveurs
check_status() {
    log_header "Statut des serveurs dalon974"
    echo ""
    
    # Vérification du serveur de développement
    if check_port 3001; then
        log_success "Serveur de développement: ACTIF (port 3001)"
    else
        log_warning "Serveur de développement: INACTIF (port 3001)"
    fi
    
    # Vérification du serveur de production
    if check_port 3000; then
        log_success "Serveur de production: ACTIF (port 3000)"
    else
        log_warning "Serveur de production: INACTIF (port 3000)"
    fi
    
    echo ""
    log_info "Processus Next.js en cours:"
    ps aux | grep -E "(next|node)" | grep -v grep || echo "Aucun processus Next.js trouvé"
}

# Fonction pour démarrer le serveur de développement
start_dev() {
    log_header "Démarrage du serveur de développement"
    
    # Arrêter le serveur de développement s'il est déjà en cours d'exécution
    if check_port 3001; then
        log_info "Arrêt du serveur de développement existant..."
        pkill -f "next dev.*:3001" || true
        pkill -f "next.*3001" || true
        sleep 3
        # Vérifier si le port est toujours utilisé
        if check_port 3001; then
            log_warning "Le port 3001 est toujours utilisé, arrêt forcé..."
            fuser -k 3001/tcp 2>/dev/null || true
            sleep 2
        fi
    fi
    
    if [ ! -d "$DEV_DIR" ]; then
        log_error "Le dossier de développement n'existe pas: $DEV_DIR"
        exit 1
    fi
    
    log_info "Installation des dépendances dev..."
    cd "$DEV_DIR"
    npm install --silent
    
    log_info "Démarrage du serveur de développement sur le port 3001..."
    nohup npm run dev > "$LOG_DIR/dev.log" 2>&1 &
    DEV_PID=$!
    echo $DEV_PID > "$LOG_DIR/dev.pid"
    
    # Attendre que le serveur démarre
    sleep 5
    
    if check_port 3001; then
        log_success "Serveur de développement démarré avec succès (PID: $DEV_PID)"
        log_info "Logs disponibles dans: $LOG_DIR/dev.log"
        log_info "URL: http://localhost:3001"
    else
        log_error "Échec du démarrage du serveur de développement"
        exit 1
    fi
}

# Fonction pour démarrer le serveur de production
start_prod() {
    log_header "Démarrage du serveur de production"
    
    # Arrêter le serveur de production s'il est déjà en cours d'exécution
    if check_port 3000; then
        log_info "Arrêt du serveur de production existant..."
        pkill -f "next start.*:3000" || true
        pkill -f "next.*3000" || true
        sleep 3
        # Vérifier si le port est toujours utilisé
        if check_port 3000; then
            log_warning "Le port 3000 est toujours utilisé, arrêt forcé..."
            fuser -k 3000/tcp 2>/dev/null || true
            sleep 2
        fi
    fi
    
    if [ ! -d "$PROD_DIR" ]; then
        log_error "Le dossier de production n'existe pas: $PROD_DIR"
        exit 1
    fi
    
    log_info "Installation des dépendances prod..."
    cd "$PROD_DIR"
    npm install --silent
    
    log_info "Build de l'application de production..."
    npm run build
    
    log_info "Démarrage du serveur de production sur le port 3000..."
    nohup npm run start > "$LOG_DIR/prod.log" 2>&1 &
    PROD_PID=$!
    echo $PROD_PID > "$LOG_DIR/prod.pid"
    
    # Attendre que le serveur démarre
    sleep 5
    
    if check_port 3000; then
        log_success "Serveur de production démarré avec succès (PID: $PROD_PID)"
        log_info "Logs disponibles dans: $LOG_DIR/prod.log"
        log_info "URL: http://localhost:3000"
    else
        log_error "Échec du démarrage du serveur de production"
        exit 1
    fi
}

# Fonction pour démarrer les deux serveurs
start_both() {
    log_header "Démarrage des serveurs dev et prod"
    
    # Arrêter les serveurs existants d'abord
    stop_servers
    
    # Démarrer le serveur de développement
    start_dev
    
    # Démarrer le serveur de production
    start_prod
    
    log_success "Les deux serveurs sont démarrés"
    echo ""
    log_info "URLs disponibles:"
    log_info "  - Développement: http://localhost:3001"
    log_info "  - Production: http://localhost:3000"
}

# Fonction pour redémarrer les serveurs
restart_servers() {
    log_header "Redémarrage des serveurs"
    
    # Arrêter les serveurs
    stop_servers
    
    # Nettoyer l'environnement
    clean_environment
    
    # Redémarrer selon le contexte
    case "$1" in
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        "both")
            start_both
            ;;
        *)
            log_info "Redémarrage des deux serveurs..."
            start_both
            ;;
    esac
}

# Fonction d'aide
show_help() {
    echo -e "${CYAN}🚀 Server Manager - Gestionnaire de serveurs dalon974${NC}"
    echo ""
    echo "Usage: $0 [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  dev     - Démarrer le serveur de développement (port 3001)"
    echo "  prod    - Démarrer le serveur de production (port 3000)"
    echo "  both    - Démarrer les deux serveurs"
    echo "  stop    - Arrêter tous les serveurs"
    echo "  status  - Afficher le statut des serveurs"
    echo "  clean   - Nettoyer les caches et fichiers temporaires"
    echo "  restart - Redémarrer les serveurs (avec nettoyage)"
    echo "  help    - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 dev          # Démarrer le serveur de développement"
    echo "  $0 prod         # Démarrer le serveur de production"
    echo "  $0 both         # Démarrer les deux serveurs"
    echo "  $0 stop         # Arrêter tous les serveurs"
    echo "  $0 status       # Vérifier le statut"
    echo "  $0 clean        # Nettoyer l'environnement"
    echo "  $0 restart dev  # Redémarrer le serveur de développement"
    echo ""
}

# Fonction principale
main() {
    local command=${1:-"help"}
    
    case "$command" in
        "dev")
            start_dev
            ;;
        "prod")
            start_prod
            ;;
        "both")
            start_both
            ;;
        "stop")
            stop_servers
            ;;
        "status")
            check_status
            ;;
        "clean")
            clean_environment
            ;;
        "restart")
            restart_servers "$2"
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
