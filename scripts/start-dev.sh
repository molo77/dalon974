#!/bin/bash

# Script pour démarrer le serveur de développement en arrêtant d'abord les serveurs en cours

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
    
    # Méthode 1: Chercher les processus utilisant le port
    local pids=$(lsof -ti:$port 2>/dev/null || true)
    
    # Méthode 2: Chercher les processus Next.js avec le bon port
    local next_pids=$(pgrep -f "next.*$port" 2>/dev/null || true)
    
    # Méthode 3: Tester la connexion HTTP (avec timeout court)
    local http_test=false
    if timeout 2 curl -s http://localhost:$port/api/health >/dev/null 2>&1; then
        http_test=true
    fi
    
    if [ -n "$pids" ] || [ -n "$next_pids" ] || [ "$http_test" = true ]; then
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

# Fonction pour vérifier s'il y a eu des modifications depuis le dernier démarrage
check_for_changes() {
    log_info "🔍 Vérification des modifications depuis le dernier démarrage..."
    
    # Obtenir le répertoire racine du projet
    local project_root=$(dirname "$(dirname "$(readlink -f "$0")")")
    local last_start_file="$project_root/.last-dev-start"
    local current_time=$(date +%s)
    
    # Si c'est le premier démarrage, créer le fichier de référence
    if [ ! -f "$last_start_file" ]; then
        echo "$current_time" > "$last_start_file"
        log_info "Premier démarrage détecté, création du fichier de référence"
        return 0
    fi
    
    # Lire le timestamp du dernier démarrage
    local last_start_time=$(cat "$last_start_file" 2>/dev/null || echo "0")
    
    # Vérifier s'il y a des modifications dans git depuis le dernier démarrage
    if [ -d "$project_root/.git" ]; then
        cd "$project_root"
        
        # Obtenir le dernier commit avant le dernier démarrage
        local last_commit_before_start=$(git log --before="$last_start_time" -1 --format="%H" 2>/dev/null || echo "")
        
        if [ -n "$last_commit_before_start" ]; then
            # Vérifier s'il y a des modifications non commitées ou de nouveaux commits
            local has_changes=false
            
            # Vérifier les modifications non commitées
            if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                has_changes=true
                log_info "Modifications non commitées détectées"
            fi
            
            # Vérifier s'il y a de nouveaux commits depuis le dernier démarrage
            if [ "$(git rev-list --count HEAD ^$last_commit_before_start 2>/dev/null || echo "0")" -gt 0 ]; then
                has_changes=true
                log_info "Nouveaux commits détectés"
            fi
            
            if [ "$has_changes" = true ]; then
                log_info "✅ Modifications détectées depuis le dernier démarrage"
                echo "$current_time" > "$last_start_file"
                return 0
            else
                log_info "ℹ️  Aucune modification détectée depuis le dernier démarrage"
                return 1
            fi
        else
            # Si on ne peut pas déterminer le dernier commit, vérifier les modifications non commitées
            if ! git diff-index --quiet HEAD -- 2>/dev/null; then
                log_info "✅ Modifications non commitées détectées"
                echo "$current_time" > "$last_start_file"
                return 0
            else
                log_info "ℹ️  Aucune modification détectée"
                return 1
            fi
        fi
    else
        # Si ce n'est pas un repo git, utiliser une méthode basée sur les timestamps
        log_info "Repository git non trouvé, utilisation de la méthode par timestamp"
        
        # Vérifier si des fichiers ont été modifiés depuis le dernier démarrage
        local files_changed=$(find "$project_root" -type f -newer "$last_start_file" -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.next/*" 2>/dev/null | wc -l)
        
        if [ "$files_changed" -gt 0 ]; then
            log_info "✅ $files_changed fichier(s) modifié(s) depuis le dernier démarrage"
            echo "$current_time" > "$last_start_file"
            return 0
        else
            log_info "ℹ️  Aucun fichier modifié depuis le dernier démarrage"
            return 1
        fi
    fi
}

# Fonction pour incrémenter automatiquement la version de développement
auto_increment_dev_version() {
    log_info "📦 Vérification de l'incrémentation automatique de la version de développement..."
    
    # Vérifier s'il y a eu des modifications
    if check_for_changes; then
        log_info "🔄 Modifications détectées, incrémentation de la version..."
        
        # Obtenir le répertoire racine du projet
        local project_root=$(dirname "$(dirname "$(readlink -f "$0")")")
        
        # Vérifier si le script de gestion de version existe
        if [ -f "$project_root/scripts/version-manager.js" ]; then
            # Incrémenter la version patch automatiquement
            if node "$project_root/scripts/version-manager.js" patch >/dev/null 2>&1; then
                log_success "Version de développement incrémentée automatiquement"
            else
                log_warning "Impossible d'incrémenter la version automatiquement"
            fi
        else
            log_warning "Script de gestion de version non trouvé"
        fi
    else
        log_info "ℹ️  Aucune modification détectée, pas d'incrémentation de version"
    fi
}

# Fonction pour pré-build de développement
pre_build_dev() {
    log_info "🔨 Pré-build de développement..."
    
    # Aller dans le répertoire dev
    cd dev
    
    # Vérifier que le répertoire existe
    if [ ! -f "package.json" ]; then
        log_error "Répertoire dev non trouvé ou package.json manquant"
        exit 1
    fi
    
    # Vérifier si le build existe et s'il est à jour
    if [ ! -d ".next" ]; then
        log_warning "Build de développement non trouvé. Construction en cours..."
        npm run build
        log_success "Build de développement terminé"
    else
        # Vérifier si des fichiers ont été modifiés depuis le dernier build
        local build_time=$(stat -c %Y .next 2>/dev/null || echo "0")
        local latest_file_time=$(find . -type f -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -exec stat -c %Y {} \; 2>/dev/null | sort -nr | head -1)
        
        if [ "$latest_file_time" -gt "$build_time" ]; then
            log_warning "Fichiers modifiés détectés. Reconstruction en cours..."
            npm run build
            log_success "Build de développement mis à jour"
        else
            log_info "Build de développement à jour"
        fi
    fi
    
    # Retourner au répertoire racine
    cd ..
}

# Fonction principale
main() {
    log_info "🚀 Démarrage du serveur de développement"
    log_info "========================================"
    
    # Vérifier si le serveur dev est déjà en cours
    if check_server_running 3001 "serveur de développement"; then
        log_info "🔄 Redémarrage du serveur de développement..."
        # Incrémenter la version lors du redémarrage seulement s'il y a des modifications
        auto_increment_dev_version
    else
        log_info "🆕 Démarrage d'un nouveau serveur de développement..."
        # Pour un nouveau démarrage, créer le fichier de référence sans incrémenter
        local project_root=$(dirname "$(dirname "$(readlink -f "$0")")")
        local last_start_file="$project_root/.last-dev-start"
        echo "$(date +%s)" > "$last_start_file"
        log_info "Fichier de référence créé pour le nouveau démarrage"
    fi
    
    # Arrêter tous les processus Next.js (méthode simple et efficace)
    log_warning "Arrêt des processus Next.js..."
    pkill -f "next.*dev" 2>/dev/null || true
    sleep 2
    pkill -9 -f "next.*dev" 2>/dev/null || true
    
    # Attendre un peu pour s'assurer que tout est arrêté
    sleep 2
    
    log_info "Démarrage du serveur de développement..."
    
    # Pré-build de développement
    pre_build_dev
    
    # Aller dans le répertoire dev et démarrer
    cd dev
    
    # Démarrer le serveur de développement
    log_success "Démarrage de Next.js en mode développement..."
    npm run dev
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
