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

# Fonction pour collecter tous les PIDs des processus à arrêter
collect_process_pids() {
    local pids=()
    
    # PIDs des processus Next.js
    local next_pids=$(pgrep -f "(next dev|next start)" 2>/dev/null || true)
    if [ -n "$next_pids" ]; then
        pids+=($next_pids)
    fi
    
    # PIDs des processus npm
    local npm_pids=$(pgrep -f "npm.*(dev|start)" 2>/dev/null || true)
    if [ -n "$npm_pids" ]; then
        pids+=($npm_pids)
    fi
    
    # PIDs des processus Node.js dans les répertoires dev/prod
    local node_pids=$(ps aux | grep -E "node.*(dev|prod)" | grep -v grep | awk '{print $2}' 2>/dev/null || true)
    if [ -n "$node_pids" ]; then
        pids+=($node_pids)
    fi
    
    # Retourner les PIDs uniques
    printf '%s\n' "${pids[@]}" | sort -u
}

# Fonction pour proposer d'arrêter les processus
propose_kill_processes() {
    log_header "Proposition d'arrêt des processus"
    
    local pids=$(collect_process_pids)
    
    if [ -z "$pids" ]; then
        log_success "Aucun processus à arrêter"
        return 0
    fi
    
    log_warning "Processus détectés qui peuvent être arrêtés :"
    for pid in $pids; do
        local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null || true)
        if [ -n "$process_info" ]; then
            echo "  PID $pid: $process_info"
        fi
    done
    
    echo ""
    echo -e "${YELLOW}Voulez-vous arrêter ces processus ?${NC}"
    echo "1) Arrêter tous les processus"
    echo "2) Arrêter seulement les processus Next.js"
    echo "3) Arrêter seulement les processus npm"
    echo "4) Ne rien faire"
    echo ""
    read -p "Votre choix (1-4) : " choice
    
    case $choice in
        1)
            log_info "Arrêt de tous les processus..."
            for pid in $pids; do
                if kill -0 $pid 2>/dev/null; then
                    log_info "Arrêt du processus PID $pid"
                    kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
                fi
            done
            log_success "Tous les processus ont été arrêtés"
            ;;
        2)
            log_info "Arrêt des processus Next.js..."
            local next_pids=$(pgrep -f "(next dev|next start)" 2>/dev/null || true)
            for pid in $next_pids; do
                if kill -0 $pid 2>/dev/null; then
                    log_info "Arrêt du processus Next.js PID $pid"
                    kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
                fi
            done
            log_success "Processus Next.js arrêtés"
            ;;
        3)
            log_info "Arrêt des processus npm..."
            local npm_pids=$(pgrep -f "npm.*(dev|start)" 2>/dev/null || true)
            for pid in $npm_pids; do
                if kill -0 $pid 2>/dev/null; then
                    log_info "Arrêt du processus npm PID $pid"
                    kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null
                fi
            done
            log_success "Processus npm arrêtés"
            ;;
        4)
            log_info "Aucun processus arrêté"
            ;;
        *)
            log_error "Choix invalide"
            ;;
    esac
    
    # Attendre un peu et vérifier si les processus sont bien arrêtés
    if [ "$choice" != "4" ]; then
        echo ""
        log_info "Vérification de l'arrêt des processus..."
        sleep 2
        
        local remaining_pids=$(collect_process_pids)
        if [ -z "$remaining_pids" ]; then
            log_success "Tous les processus ont été arrêtés avec succès"
        else
            log_warning "Certains processus sont encore en cours :"
            for pid in $remaining_pids; do
                local process_info=$(ps -p $pid -o pid,ppid,cmd --no-headers 2>/dev/null || true)
                if [ -n "$process_info" ]; then
                    echo "  PID $pid: $process_info"
                fi
            done
        fi
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
    echo ""
    
    # Proposer d'arrêter les processus
    propose_kill_processes
}

# Exécution du script
main "$@"
