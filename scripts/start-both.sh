#!/bin/bash

# Script pour démarrer les deux serveurs (dev et prod) en parallèle

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

# Fonction pour arrêter tous les serveurs existants
stop_existing_servers() {
    log_info "Arrêt des serveurs existants..."
    
    # Arrêter les processus sur les ports spécifiques
    local pids_3000=$(lsof -ti:3000 2>/dev/null || true)
    local pids_3001=$(lsof -ti:3001 2>/dev/null || true)
    
    if [ -n "$pids_3000" ] || [ -n "$pids_3001" ]; then
        log_warning "Arrêt des serveurs en cours..."
        
        # Arrêter les processus
        for pid in $pids_3000 $pids_3001; do
            if [ -n "$pid" ]; then
                kill -TERM $pid 2>/dev/null || true
            fi
        done
        
        # Attendre un peu puis forcer si nécessaire
        sleep 3
        for pid in $pids_3000 $pids_3001; do
            if [ -n "$pid" ] && kill -0 $pid 2>/dev/null; then
                log_warning "Arrêt forcé du processus $pid..."
                kill -KILL $pid 2>/dev/null || true
            fi
        done
        
        log_success "Serveurs existants arrêtés"
    else
        log_info "Aucun serveur existant trouvé"
    fi
}

# Fonction pour démarrer le serveur de développement
start_dev_server() {
    log_info "Démarrage du serveur de développement..."
    cd dev
    npm run dev &
    local dev_pid=$!
    echo $dev_pid > /tmp/dev_server.pid
    log_success "Serveur de développement démarré (PID: $dev_pid)"
}

# Fonction pour démarrer le serveur de production
start_prod_server() {
    log_info "Démarrage du serveur de production..."
    cd prod
    
    # Vérifier si le build existe
    if [ ! -d ".next" ]; then
        log_warning "Build de production non trouvé. Construction en cours..."
        npm run build
        log_success "Build terminé"
    fi
    
    npm run start &
    local prod_pid=$!
    echo $prod_pid > /tmp/prod_server.pid
    log_success "Serveur de production démarré (PID: $prod_pid)"
}

# Fonction pour vérifier l'état des serveurs
check_servers_status() {
    log_info "Vérification de l'état des serveurs..."
    
    # Attendre un peu pour que les serveurs démarrent
    sleep 5
    
    # Vérifier le serveur de développement
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        log_success "Serveur de développement (port 3001) : ACTIF"
    else
        log_error "Serveur de développement (port 3001) : INACTIF"
    fi
    
    # Vérifier le serveur de production
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Serveur de production (port 3000) : ACTIF"
    else
        log_error "Serveur de production (port 3000) : INACTIF"
    fi
}

# Fonction pour afficher les informations de connexion
show_connection_info() {
    log_info "Informations de connexion :"
    log_info "=========================="
    log_info "Développement : http://localhost:3001"
    log_info "Production    : http://localhost:3000"
    log_info ""
    log_info "Pour arrêter les serveurs : npm run stop"
    log_info "Pour voir les logs : tail -f /tmp/dev_server.log /tmp/prod_server.log"
}

# Fonction principale
main() {
    log_info "🚀 Démarrage des serveurs dev et prod"
    log_info "====================================="
    
    # Arrêter les serveurs existants
    stop_existing_servers
    
    # Attendre un peu pour s'assurer que les ports sont libres
    sleep 2
    
    # Démarrer les serveurs en parallèle
    start_dev_server &
    start_prod_server &
    
    # Attendre que les deux processus de démarrage se terminent
    wait
    
    # Vérifier l'état des serveurs
    check_servers_status
    
    # Afficher les informations de connexion
    show_connection_info
    
    log_success "Les deux serveurs sont maintenant démarrés !"
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Gestion de l'arrêt propre
trap 'log_info "Arrêt des serveurs..."; npm run stop; exit 0' INT TERM

# Exécution
main "$@"
