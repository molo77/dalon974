#!/bin/bash

# Script pour arrêter tous les processus serveur et redémarrer proprement

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

# Fonction pour arrêter tous les processus serveur
stop_all_servers() {
    log_info "Arrêt de tous les processus serveur..."
    
    # Arrêter tous les processus Next.js
    log_info "Arrêt des processus Next.js..."
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "next.*start" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    
    # Attendre un peu
    sleep 2
    
    # Forcer l'arrêt si nécessaire
    log_info "Arrêt forcé des processus restants..."
    pkill -9 -f "next.*dev" 2>/dev/null || true
    pkill -9 -f "next.*start" 2>/dev/null || true
    pkill -9 -f "node.*next" 2>/dev/null || true
    
    # Libérer les ports
    log_info "Libération des ports 3000 et 3001..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    
    # Attendre que tout soit arrêté
    sleep 3
    
    # Supprimer les dossiers .next pour forcer un rebuild complet
    log_info "🧹 Nettoyage des builds précédents..."
    if [ -d "dev/.next" ]; then
        rm -rf dev/.next
        log_success "Dossier .next de dev supprimé"
    fi
    if [ -d "prod/.next" ]; then
        rm -rf prod/.next
        log_success "Dossier .next de prod supprimé"
    fi
    
    log_success "Tous les processus serveur arrêtés et builds nettoyés"
}

# Fonction pour vérifier qu'aucun processus ne tourne
check_no_servers() {
    local running_processes=$(ps aux | grep -E "(next|node.*3000|node.*3001)" | grep -v grep | wc -l)
    
    if [ "$running_processes" -eq 0 ]; then
        log_success "Aucun processus serveur en cours"
        return 0
    else
        log_warning "Il reste $running_processes processus serveur en cours"
        return 1
    fi
}

# Fonction pour démarrer le serveur de développement
start_dev() {
    log_info "🚀 Démarrage du serveur de développement..."
    
    if ! check_no_servers; then
        log_warning "Arrêt forcé des processus restants..."
        stop_all_servers
    fi
    
    cd dev
    
    # Pré-build de développement
    log_info "🔨 Pré-build de développement..."
    log_warning "Construction de l'application de développement..."
    npm run build
    log_success "Build de développement terminé"
    
    log_success "Démarrage de Next.js en mode développement..."
    npm run dev
}

# Fonction pour démarrer le serveur de production
start_prod() {
    log_info "🚀 Démarrage du serveur de production..."
    
    if ! check_no_servers; then
        log_warning "Arrêt forcé des processus restants..."
        stop_all_servers
    fi
    
    cd prod
    
    # Pré-build de production (toujours reconstruire)
    log_info "🔨 Pré-build de production..."
    log_warning "Reconstruction de l'application de production..."
    npm run build
    log_success "Build de production terminé"
    
    log_success "Démarrage de Next.js en mode production..."
    npm run start
}

# Fonction pour démarrer les deux serveurs
start_both() {
    log_info "🚀 Démarrage des deux serveurs..."
    
    if ! check_no_servers; then
        log_warning "Arrêt forcé des processus restants..."
        stop_all_servers
    fi
    
    # Démarrer la production en arrière-plan
    log_info "Démarrage du serveur de production en arrière-plan..."
    cd prod
    
    # Pré-build de production
    log_info "🔨 Pré-build de production..."
    log_warning "Reconstruction de l'application de production..."
    npm run build
    log_success "Build de production terminé"
    
    npm run start &
    PROD_PID=$!
    
    # Attendre un peu
    sleep 5
    
    # Démarrer le développement
    log_info "Démarrage du serveur de développement..."
    cd ../dev
    npm run dev
}

# Fonction principale
main() {
    case "${1:-}" in
        "dev")
            stop_all_servers
            start_dev
            ;;
        "prod")
            stop_all_servers
            start_prod
            ;;
        "both")
            stop_all_servers
            start_both
            ;;
        "stop")
            stop_all_servers
            ;;
        *)
            echo "Usage: $0 {dev|prod|both|stop}"
            echo "  dev  - Démarrer le serveur de développement"
            echo "  prod - Démarrer le serveur de production"
            echo "  both - Démarrer les deux serveurs"
            echo "  stop - Arrêter tous les serveurs"
            exit 1
            ;;
    esac
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
