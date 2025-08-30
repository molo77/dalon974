#!/bin/bash

# Script pour démarrer le serveur de production en arrêtant d'abord les serveurs en cours

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

# Fonction pour vérifier si un serveur est en cours sur un port
check_server_running() {
    local port=$1
    local server_type=$2
    
    log_info "Vérification du $server_type sur le port $port..."
    
    # Chercher les processus utilisant le port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        log_warning "$server_type déjà en cours sur le port $port"
        return 0  # Serveur en cours
    else
        log_info "Aucun $server_type trouvé sur le port $port"
        return 1  # Serveur non en cours
    fi
}

# Fonction pour arrêter les processus sur un port
stop_process_on_port() {
    local port=$1
    local process_name=$2
    
    log_info "Arrêt de $process_name sur le port $port..."
    
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

# Fonction pour pré-build de production
pre_build_prod() {
    log_info "🔨 Pré-build de production..."
    
    # Aller dans le répertoire prod
    cd prod
    
    # Vérifier que le répertoire existe
    if [ ! -f "package.json" ]; then
        log_error "Répertoire prod non trouvé ou package.json manquant"
        exit 1
    fi
    
    # Toujours reconstruire en production pour s'assurer que tout est à jour
    log_warning "Reconstruction de l'application de production..."
    npm run build
    log_success "Build de production terminé"
    
    # Retourner au répertoire racine
    cd ..
}

# Fonction principale
main() {
    log_info "🚀 Démarrage du serveur de production"
    log_info "====================================="
    
    # Vérifier si le serveur prod est déjà en cours
    if check_server_running 3000 "serveur de production"; then
        log_info "🔄 Redémarrage du serveur de production..."
    else
        log_info "🆕 Démarrage d'un nouveau serveur de production..."
    fi
    
    # Arrêter tous les processus Next.js (méthode simple et efficace)
    log_warning "Arrêt des processus Next.js..."
    pkill -f "next.*start" 2>/dev/null || true
    sleep 2
    pkill -9 -f "next.*start" 2>/dev/null || true
    
    # Attendre un peu pour s'assurer que tout est arrêté
    sleep 2
    
    # Supprimer le dossier .next pour forcer un rebuild complet
    log_info "🧹 Nettoyage du build précédent..."
    if [ -d "prod/.next" ]; then
        rm -rf prod/.next
        log_success "Dossier .next supprimé"
    else
        log_info "Aucun dossier .next trouvé"
    fi
    
    log_info "Démarrage du serveur de production..."
    
    # Pré-build de production
    pre_build_prod
    
    # Aller dans le répertoire prod et démarrer
    cd prod
    
    # Démarrer le serveur de production
    log_success "Démarrage de Next.js en mode production..."
    npm run start
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
