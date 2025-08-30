#!/bin/bash

# Script pour arrêter tous les serveurs Next.js

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

# Fonction pour arrêter les processus sur un port
stop_process_on_port() {
    local port=$1
    local process_name=$2
    
    log_info "Vérification des processus sur le port $port..."
    
    # Chercher les processus utilisant le port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log_warning "Arrêt de $process_name sur le port $port..."
        
        # Arrêter les processus
        for pid in $pids; do
            log_info "Arrêt du processus $pid..."
            kill -TERM $pid 2>/dev/null || true
            
            # Attendre un peu puis forcer si nécessaire
            sleep 2
            if kill -0 $pid 2>/dev/null; then
                log_warning "Processus $pid encore actif, arrêt forcé..."
                kill -KILL $pid 2>/dev/null || true
            fi
        done
        
        # Vérifier que le port est libre
        sleep 1
        if lsof -ti:$port >/dev/null 2>&1; then
            log_error "Impossible de libérer le port $port"
            return 1
        else
            log_success "Port $port libéré"
        fi
    else
        log_info "Aucun processus trouvé sur le port $port"
    fi
}

# Fonction pour arrêter tous les serveurs Next.js
stop_all_next_servers() {
    log_info "Arrêt de tous les serveurs Next.js..."
    
    # Chercher les processus Next.js
    local next_pids=$(pgrep -f "next.*dev\|next.*start" 2>/dev/null || true)
    
    if [ -n "$next_pids" ]; then
        log_warning "Arrêt des serveurs Next.js en cours..."
        
        for pid in $next_pids; do
            log_info "Arrêt du processus Next.js $pid..."
            kill -TERM $pid 2>/dev/null || true
        done
        
        # Attendre un peu puis forcer si nécessaire
        sleep 3
        next_pids=$(pgrep -f "next.*dev\|next.*start" 2>/dev/null || true)
        if [ -n "$next_pids" ]; then
            log_warning "Arrêt forcé des processus Next.js restants..."
            for pid in $next_pids; do
                kill -KILL $pid 2>/dev/null || true
            done
        fi
        
        log_success "Tous les serveurs Next.js arrêtés"
    else
        log_info "Aucun serveur Next.js trouvé"
    fi
}

# Fonction pour afficher l'état des ports
show_port_status() {
    log_info "État des ports :"
    
    # Vérifier le port 3000 (prod)
    if lsof -ti:3000 >/dev/null 2>&1; then
        log_warning "Port 3000 (prod) : OCCUPÉ"
    else
        log_success "Port 3000 (prod) : LIBRE"
    fi
    
    # Vérifier le port 3001 (dev)
    if lsof -ti:3001 >/dev/null 2>&1; then
        log_warning "Port 3001 (dev) : OCCUPÉ"
    else
        log_success "Port 3001 (dev) : LIBRE"
    fi
}

# Fonction principale
main() {
    log_info "🛑 Arrêt de tous les serveurs"
    log_info "============================"
    
    # Arrêter les serveurs sur les ports spécifiques
    stop_process_on_port 3000 "serveur prod"
    stop_process_on_port 3001 "serveur dev"
    
    # Arrêter tous les serveurs Next.js
    stop_all_next_servers
    
    # Attendre un peu pour s'assurer que tout est arrêté
    sleep 2
    
    # Afficher l'état final
    show_port_status
    
    log_success "Tous les serveurs ont été arrêtés"
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
