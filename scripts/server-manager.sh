#!/bin/bash

# Script principal de gestion des serveurs Dalon974
# Remplace start-dev.sh, start-prod.sh, start-clean.sh

set -e

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
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

# Configuration
DEV_PORT=3001
PROD_PORT=3000
DEV_DIR="dev"
PROD_DIR="prod"

# Fonction pour arrêter tous les serveurs
stop_all_servers() {
    log_info "🛑 Arrêt de tous les serveurs..."
    
    # Arrêter tous les processus Next.js
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "next.*start" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    
    # Attendre un peu
    sleep 2
    
    # Forcer l'arrêt si nécessaire
    pkill -9 -f "next.*dev" 2>/dev/null || true
    pkill -9 -f "next.*start" 2>/dev/null || true
    pkill -9 -f "node.*next" 2>/dev/null || true
    
    # Libérer les ports
    lsof -ti:$DEV_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$PROD_PORT | xargs kill -9 2>/dev/null || true
    
    # Attendre que tout soit arrêté
    sleep 3
    
    log_success "Tous les serveurs arrêtés"
}

# Fonction pour nettoyer les builds et fichiers de lock
clean_builds() {
    log_info "🧹 Nettoyage des builds et fichiers de lock..."
    
    # Supprimer les dossiers .next
    if [ -d "$DEV_DIR/.next" ]; then
        rm -rf "$DEV_DIR/.next"
        log_success "Build dev supprimé"
    fi
    
    if [ -d "$PROD_DIR/.next" ]; then
        rm -rf "$PROD_DIR/.next"
        log_success "Build prod supprimé"
    fi
    
    # Supprimer les package-lock.json
    if [ -f "$DEV_DIR/package-lock.json" ]; then
        rm -f "$DEV_DIR/package-lock.json"
        log_success "package-lock.json dev supprimé"
    fi
    
    if [ -f "$PROD_DIR/package-lock.json" ]; then
        rm -f "$PROD_DIR/package-lock.json"
        log_success "package-lock.json prod supprimé"
    fi
    
    # Supprimer les node_modules (optionnel, plus agressif)
    if [ -d "$DEV_DIR/node_modules" ]; then
        rm -rf "$DEV_DIR/node_modules"
        log_success "node_modules dev supprimé"
    fi
    
    if [ -d "$PROD_DIR/node_modules" ]; then
        rm -rf "$PROD_DIR/node_modules"
        log_success "node_modules prod supprimé"
    fi
    
    # Supprimer les fichiers de cache npm
    if [ -d "$DEV_DIR/.npm" ]; then
        rm -rf "$DEV_DIR/.npm"
        log_success "Cache npm dev supprimé"
    fi
    
    if [ -d "$PROD_DIR/.npm" ]; then
        rm -rf "$PROD_DIR/.npm"
        log_success "Cache npm prod supprimé"
    fi
}

# Fonction pour préparer l'environnement (sans build)
prepare_environment() {
    local dir=$1
    local env_name=$2
    
    log_info "🔧 Préparation de l'environnement $env_name..."
    
    cd "$dir"
    
    # Installer les dépendances
    log_info "📦 Installation des dépendances pour $env_name..."
    npm install
    
    # Générer Prisma client si nécessaire
    if [ -f "prisma/schema.prisma" ]; then
        log_info "🗄️  Génération du client Prisma pour $env_name..."
        npx prisma generate
    fi
    
    cd ..
    
    log_success "Environnement $env_name préparé"
}

# Fonction pour rebuild complet (avec build)
rebuild() {
    local dir=$1
    local env_name=$2
    
    log_info "🔨 Rebuild complet de $env_name..."
    
    # Préparer l'environnement
    prepare_environment "$dir" "$env_name"
    
    # Build
    cd "$dir"
    log_info "🏗️  Build de $env_name..."
    npm run build
    cd ..
    
    log_success "Rebuild de $env_name terminé"
}

# Fonction pour vérifier qu'un port est libre
check_port() {
    local port=$1
    if lsof -ti:$port >/dev/null 2>&1; then
        return 1  # Port occupé
    else
        return 0  # Port libre
    fi
}

# Fonction pour démarrer le serveur de développement
start_dev() {
    log_info "🚀 Démarrage du serveur de développement..."
    
    # Vérifier que le port est libre
    if ! check_port $DEV_PORT; then
        log_error "Port $DEV_PORT déjà occupé"
        return 1
    fi
    
    # Vérifier que package.json existe
    if [ ! -f "$DEV_DIR/package.json" ]; then
        log_error "package.json non trouvé dans $DEV_DIR"
        return 1
    fi
    
    # Préparer l'environnement
    prepare_environment "$DEV_DIR" "développement"
    
    # Build de développement
    cd "$DEV_DIR"
    log_info "🔨 Build de développement..."
    npm run build
    
    # Démarrer le serveur
    log_success "Démarrage du serveur de développement sur le port $DEV_PORT..."
    npm run dev &
    cd ..
    
    log_success "Serveur de développement démarré"
}

# Fonction pour démarrer le serveur de production
start_prod() {
    log_info "🚀 Démarrage du serveur de production..."
    
    # Vérifier que le port est libre
    if ! check_port $PROD_PORT; then
        log_error "Port $PROD_PORT déjà occupé"
        return 1
    fi
    
    # Vérifier que package.json existe
    if [ ! -f "$PROD_DIR/package.json" ]; then
        log_error "package.json non trouvé dans $PROD_DIR"
        return 1
    fi
    
    # Préparer l'environnement
    prepare_environment "$PROD_DIR" "production"
    
    # Build de production
    cd "$PROD_DIR"
    log_info "🔨 Build de production..."
    npm run build
    
    # Démarrer le serveur
    log_success "Démarrage du serveur de production sur le port $PROD_PORT..."
    npm run start &
    cd ..
    
    log_success "Serveur de production démarré"
}

# Fonction pour démarrer les deux serveurs
start_both() {
    log_info "🚀 Démarrage des deux serveurs..."
    
    # Démarrer la production en arrière-plan
    start_prod &
    PROD_PID=$!
    
    # Attendre un peu
    sleep 5
    
    # Démarrer le développement
    start_dev &
    DEV_PID=$!
    
    log_success "Les deux serveurs sont en cours de démarrage"
}

# Fonction pour afficher le statut des serveurs
status() {
    log_info "📊 Statut des serveurs..."
    
    echo ""
    echo "Serveurs Next.js en cours :"
    ps aux | grep -E "(next.*dev|next.*start)" | grep -v grep || echo "Aucun serveur Next.js en cours"
    
    echo ""
    echo "Ports utilisés :"
    if check_port $DEV_PORT; then
        echo "Port $DEV_PORT (dev): Libre"
    else
        echo "Port $DEV_PORT (dev): Occupé"
    fi
    
    if check_port $PROD_PORT; then
        echo "Port $PROD_PORT (prod): Libre"
    else
        echo "Port $PROD_PORT (prod): Occupé"
    fi
    
    echo ""
    echo "Tests de connectivité :"
    if curl -s http://localhost:$DEV_PORT/api/health >/dev/null 2>&1; then
        echo "Dev (port $DEV_PORT): ✅ Connecté"
    else
        echo "Dev (port $DEV_PORT): ❌ Non connecté"
    fi
    
    if curl -s http://localhost:$PROD_PORT/api/health >/dev/null 2>&1; then
        echo "Prod (port $PROD_PORT): ✅ Connecté"
    else
        echo "Prod (port $PROD_PORT): ❌ Non connecté"
    fi
}

# Fonction pour afficher l'aide
show_help() {
    echo "Script de gestion des serveurs Dalon974"
    echo ""
    echo "Usage: $0 {dev|prod|both|stop|status|clean|clean-all|restart-dev|restart-prod|restart-both}"
    echo ""
    echo "Commandes :"
    echo "  dev           - Démarrer le serveur de développement (port $DEV_PORT)"
    echo "  prod          - Démarrer le serveur de production (port $PROD_PORT)"
    echo "  both          - Démarrer les deux serveurs"
    echo "  stop          - Arrêter tous les serveurs"
    echo "  status        - Afficher le statut des serveurs"
    echo "  clean         - Nettoyer les builds (.next et package-lock.json)"
    echo "  clean-all     - Nettoyer complètement (inclut node_modules et cache)"
    echo "  restart-dev   - Redémarrer le serveur de développement (clean + rebuild)"
    echo "  restart-prod  - Redémarrer le serveur de production (clean + rebuild)"
    echo "  restart-both  - Redémarrer les deux serveurs (clean + rebuild)"
    echo ""
    echo "Exemples :"
    echo "  $0 dev        # Démarrer le serveur de développement"
    echo "  $0 stop       # Arrêter tous les serveurs"
    echo "  $0 status     # Voir le statut"
    echo "  $0 clean-all  # Nettoyage complet"
}

# Fonction principale
main() {
    case "${1:-}" in
        "dev")
            stop_all_servers
            clean_builds
            start_dev
            ;;
        "prod")
            stop_all_servers
            clean_builds
            start_prod
            ;;
        "both")
            stop_all_servers
            clean_builds
            start_both
            ;;
        "stop")
            stop_all_servers
            ;;
        "status")
            status
            ;;
        "clean")
            stop_all_servers
            clean_builds
            ;;
        "clean-all")
            stop_all_servers
            clean_builds
            ;;
        "restart-dev")
            stop_all_servers
            clean_builds
            start_dev
            ;;
        "restart-prod")
            stop_all_servers
            clean_builds
            start_prod
            ;;
        "restart-both")
            stop_all_servers
            clean_builds
            start_both
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
