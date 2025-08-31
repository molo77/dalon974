#!/bin/bash

# Script pour vérifier tous les processus de serveur actuellement en cours d'exécution
# Auteur: Assistant IA
# Date: $(date)

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions de log
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
    echo -e "${PURPLE}🔍 $1${NC}"
}

# Fonction pour vérifier les processus Next.js
check_nextjs_processes() {
    log_header "Vérification des processus Next.js"
    
    local next_processes=$(ps aux | grep -E "(next dev|next start)" | grep -v grep || true)
    
    if [ -z "$next_processes" ]; then
        log_info "Aucun processus Next.js trouvé"
    else
        log_info "Processus Next.js en cours d'exécution :"
        echo "$next_processes" | while read -r line; do
            echo "  $line"
        done
    fi
}

# Fonction pour vérifier les processus Node.js
check_nodejs_processes() {
    log_header "Vérification des processus Node.js"
    
    local node_processes=$(ps aux | grep -E "node.*(dev|prod)" | grep -v grep || true)
    
    if [ -z "$node_processes" ]; then
        log_info "Aucun processus Node.js spécifique trouvé"
    else
        log_info "Processus Node.js en cours d'exécution :"
        echo "$node_processes" | while read -r line; do
            echo "  $line"
        done
    fi
}

# Fonction pour vérifier les ports utilisés
check_ports() {
    log_header "Vérification des ports utilisés"
    
    local ports=("3000" "3001" "3002" "3003")
    
    for port in "${ports[@]}"; do
        local process=$(lsof -i :$port 2>/dev/null | grep LISTEN || true)
        
        if [ -z "$process" ]; then
            log_info "Port $port: Libre"
        else
            log_warning "Port $port: Utilisé par :"
            echo "$process" | while read -r line; do
                echo "  $line"
            done
        fi
    done
}

# Fonction pour vérifier les processus par PID
check_processes_by_pid() {
    log_header "Vérification des processus par PID"
    
    # Chercher les PIDs des processus Next.js
    local pids=$(pgrep -f "(next dev|next start)" 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        log_info "Aucun PID de processus Next.js trouvé"
    else
        log_info "PIDs des processus Next.js :"
        for pid in $pids; do
            local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null || true)
            if [ -n "$process_info" ]; then
                echo "  PID $pid: $process_info"
            fi
        done
    fi
}

# Fonction pour vérifier les processus dans les répertoires spécifiques
check_directory_processes() {
    log_header "Vérification des processus dans les répertoires dev/prod"
    
    local directories=("dev" "prod")
    
    for dir in "${directories[@]}"; do
        if [ -d "$dir" ]; then
            log_info "Répertoire $dir :"
            
            # Chercher les processus qui travaillent dans ce répertoire
            local dir_processes=$(ps aux | grep "$(pwd)/$dir" | grep -v grep || true)
            
            if [ -z "$dir_processes" ]; then
                log_info "  Aucun processus trouvé pour $dir"
            else
                echo "$dir_processes" | while read -r line; do
                    echo "  $line"
                done
            fi
        else
            log_warning "Répertoire $dir n'existe pas"
        fi
    done
}

# Fonction pour vérifier les processus npm
check_npm_processes() {
    log_header "Vérification des processus npm"
    
    local npm_processes=$(ps aux | grep -E "npm.*(dev|start)" | grep -v grep || true)
    
    if [ -z "$npm_processes" ]; then
        log_info "Aucun processus npm trouvé"
    else
        log_info "Processus npm en cours d'exécution :"
        echo "$npm_processes" | while read -r line; do
            echo "  $line"
        done
    fi
}

# Fonction pour vérifier l'utilisation mémoire et CPU
check_system_resources() {
    log_header "Vérification des ressources système"
    
    # Mémoire utilisée par les processus Node.js
    local node_memory=$(ps aux | grep -E "(node|next)" | grep -v grep | awk '{sum+=$6} END {print sum/1024 " MB"}' || echo "0 MB")
    log_info "Mémoire utilisée par les processus Node.js : $node_memory"
    
    # CPU utilisé par les processus Node.js
    local node_cpu=$(ps aux | grep -E "(node|next)" | grep -v grep | awk '{sum+=$3} END {print sum "%"}' || echo "0%")
    log_info "CPU utilisé par les processus Node.js : $node_cpu"
    
    # Mémoire totale du système
    local total_memory=$(free -m | awk 'NR==2{printf "%.1f GB", $2/1024}')
    local used_memory=$(free -m | awk 'NR==2{printf "%.1f GB", $3/1024}')
    local memory_percent=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    log_info "Mémoire système : $used_memory / $total_memory ($memory_percent%)"
}

# Fonction pour vérifier les logs des processus
check_process_logs() {
    log_header "Vérification des logs récents"
    
    # Chercher les fichiers de log récents
    local log_files=$(find . -name "*.log" -type f -mtime -1 2>/dev/null || true)
    
    if [ -z "$log_files" ]; then
        log_info "Aucun fichier de log récent trouvé"
    else
        log_info "Fichiers de log récents :"
        echo "$log_files" | while read -r file; do
            echo "  $file"
        done
    fi
}

# Fonction pour vérifier les processus zombies
check_zombie_processes() {
    log_header "Vérification des processus zombies"
    
    local zombies=$(ps aux | grep -E "Z" | grep -v grep || true)
    
    if [ -z "$zombies" ]; then
        log_success "Aucun processus zombie trouvé"
    else
        log_warning "Processus zombies détectés :"
        echo "$zombies" | while read -r line; do
            echo "  $line"
        done
    fi
}

# Fonction principale
main() {
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}  VÉRIFICATION DES PROCESSUS   ${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    
    # Vérifications
    check_nextjs_processes
    echo ""
    
    check_nodejs_processes
    echo ""
    
    check_npm_processes
    echo ""
    
    check_ports
    echo ""
    
    check_processes_by_pid
    echo ""
    
    check_directory_processes
    echo ""
    
    check_system_resources
    echo ""
    
    check_zombie_processes
    echo ""
    
    check_process_logs
    echo ""
    
    echo -e "${CYAN}================================${NC}"
    log_success "Vérification terminée"
    echo -e "${CYAN}================================${NC}"
}

# Exécution du script
main "$@"
