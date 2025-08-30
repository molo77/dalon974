#!/bin/bash
set -e

# Configuration
DEV_DIR="/data/dalon974/dev"
PROD_DIR="/data/dalon974/prod"
DEV_PORT=3001
PROD_PORT=3000

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

# Gestion de l'environnement dev
manage_dev() {
    local action=$1
    
    case $action in
        "start")
            log_info "Démarrage de l'environnement dev..."
            bash "$DEV_DIR/scripts/dev-start.sh"
            ;;
        "stop")
            log_info "Arrêt de l'environnement dev..."
            pkill -f "next dev.*:$DEV_PORT" || true
            log_success "Environnement dev arrêté"
            ;;
        "restart")
            log_info "Redémarrage de l'environnement dev..."
            pkill -f "next dev.*:$DEV_PORT" || true
            sleep 2
            bash "$DEV_DIR/scripts/dev-start.sh"
            ;;
        "status")
            if lsof -Pi :$DEV_PORT -sTCP:LISTEN -t >/dev/null ; then
                log_success "Environnement dev: ACTIF (port $DEV_PORT)"
            else
                log_warning "Environnement dev: INACTIF"
            fi
            ;;
        "logs")
            if [ -f "$DEV_DIR/logs/dev.log" ]; then
                tail -f "$DEV_DIR/logs/dev.log"
            else
                log_error "Fichier de logs non trouvé"
            fi
            ;;
        "build")
            log_info "Build de l'environnement dev..."
            cd "$DEV_DIR"
            npm run build
            log_success "Build dev terminé"
            ;;
        *)
            log_error "Action '$action' non reconnue pour dev"
            exit 1
            ;;
    esac
}

# Gestion de l'environnement prod
manage_prod() {
    local action=$1
    
    case $action in
        "start")
            log_info "Démarrage de l'environnement prod..."
            bash "$PROD_DIR/scripts/prod-start.sh"
            ;;
        "stop")
            log_info "Arrêt de l'environnement prod..."
            pkill -f "next start.*:$PROD_PORT" || true
            log_success "Environnement prod arrêté"
            ;;
        "restart")
            log_info "Redémarrage de l'environnement prod..."
            pkill -f "next start.*:$PROD_PORT" || true
            sleep 2
            bash "$PROD_DIR/scripts/prod-start.sh"
            ;;
        "status")
            if lsof -Pi :$PROD_PORT -sTCP:LISTEN -t >/dev/null ; then
                log_success "Environnement prod: ACTIF (port $PROD_PORT)"
            else
                log_warning "Environnement prod: INACTIF"
            fi
            ;;
        "logs")
            if [ -f "$PROD_DIR/logs/prod.log" ]; then
                tail -f "$PROD_DIR/logs/prod.log"
            else
                log_error "Fichier de logs non trouvé"
            fi
            ;;
        "build")
            log_info "Build de l'environnement prod..."
            cd "$PROD_DIR"
            npm run build
            log_success "Build prod terminé"
            ;;
        *)
            log_error "Action '$action' non reconnue pour prod"
            exit 1
            ;;
    esac
}

# Gestion de tous les environnements
manage_all() {
    local action=$1
    
    case $action in
        "start")
            log_info "Démarrage de tous les environnements..."
            manage_dev start
            manage_prod start
            ;;
        "stop")
            log_info "Arrêt de tous les environnements..."
            manage_dev stop
            manage_prod stop
            ;;
        "restart")
            log_info "Redémarrage de tous les environnements..."
            manage_dev restart
            manage_prod restart
            ;;
        "status")
            log_info "Statut de tous les environnements..."
            manage_dev status
            manage_prod status
            ;;
        "build")
            log_info "Build de tous les environnements..."
            manage_dev build
            manage_prod build
            ;;
        *)
            log_error "Action '$action' non reconnue pour all"
            exit 1
            ;;
    esac
}

# Affichage de l'aide
show_help() {
    echo "Usage: $0 {dev|prod|all} {start|stop|restart|status|logs|build}"
    echo ""
    echo "Environnements:"
    echo "  dev   - Environnement de développement (port 3001)"
    echo "  prod  - Environnement de production (port 3000)"
    echo "  all   - Tous les environnements"
    echo ""
    echo "Actions:"
    echo "  start   - Démarrer l'environnement"
    echo "  stop    - Arrêter l'environnement"
    echo "  restart - Redémarrer l'environnement"
    echo "  status  - Afficher le statut"
    echo "  logs    - Afficher les logs (dev/prod seulement)"
    echo "  build   - Construire l'application"
    echo ""
    echo "Exemples:"
    echo "  $0 dev start    # Démarrer dev"
    echo "  $0 prod status  # Statut prod"
    echo "  $0 all restart  # Redémarrer tout"
}

# Vérification des arguments
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

environment=$1
action=$2

# Exécution selon l'environnement
case $environment in
    "dev")
        manage_dev "$action"
        ;;
    "prod")
        manage_prod "$action"
        ;;
    "all")
        manage_all "$action"
        ;;
    *)
        log_error "Environnement '$environment' non reconnu"
        show_help
        exit 1
        ;;
esac
