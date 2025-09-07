#!/bin/bash

# Script pour démarrer le serveur de production avec logs améliorés
# Usage: ./scripts/prod-with-logs.sh

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
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

# Fonction pour ajouter un timestamp aux logs
add_timestamp() {
    while IFS= read -r line; do
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"
    done
}

# Exporter la fonction pour qu'elle soit accessible dans nohup
export -f add_timestamp

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

# Fonction pour arrêter le serveur de production
stop_prod_server() {
    log_info "Arrêt du serveur de production existant..."
    
    if check_port 3000; then
        log_info "Arrêt du serveur de production (port 3000)..."
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
    
    # Supprimer le fichier PID s'il existe
    if [ -f "$LOG_DIR/prod.pid" ]; then
        rm -f "$LOG_DIR/prod.pid"
    fi
}

# Fonction pour démarrer le serveur de production avec logs
start_prod_with_logs() {
    log_header "Démarrage du serveur de production avec logs améliorés"
    
    # Arrêter le serveur existant
    stop_prod_server
    
    if [ ! -d "$PROD_DIR" ]; then
        log_error "Le dossier de production n'existe pas: $PROD_DIR"
        exit 1
    fi
    
    # Vérifier si le port est libre
    if check_port 3000; then
        log_error "Le port 3000 est déjà utilisé. Arrêtez le processus existant d'abord."
        exit 1
    fi
    
    log_info "Installation des dépendances prod..."
    cd "$PROD_DIR"
    npm install --silent
    
    log_info "Build de l'application de production..."
    npm run build
    
    # Créer un fichier de log avec rotation
    LOG_FILE="$LOG_DIR/prod.log"
    BACKUP_LOG="$LOG_DIR/prod_$(date +%Y%m%d_%H%M%S).log"
    
    # Sauvegarder l'ancien log s'il existe
    if [ -f "$LOG_FILE" ] && [ -s "$LOG_FILE" ]; then
        log_info "Sauvegarde de l'ancien log vers: $BACKUP_LOG"
        mv "$LOG_FILE" "$BACKUP_LOG"
    fi
    
    log_info "Démarrage du serveur de production sur le port 3000..."
    log_info "Logs en temps réel disponibles dans: $LOG_FILE"
    
    # Démarrer le serveur avec logs timestampés
    cd "$PROD_DIR"
    
    # Créer un script temporaire pour les logs timestampés
    cat > /tmp/start_prod_with_timestamps.sh << 'EOF'
#!/bin/bash
npm run start 2>&1 | while IFS= read -r line; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $line"
done
EOF
    chmod +x /tmp/start_prod_with_timestamps.sh
    
    nohup /tmp/start_prod_with_timestamps.sh > "$LOG_FILE" 2>&1 &
    PROD_PID=$!
    echo $PROD_PID > "$LOG_DIR/prod.pid"
    
    # Attendre que le serveur démarre
    log_info "Attente du démarrage du serveur..."
    sleep 8
    
    if check_port 3000; then
        log_success "Serveur de production démarré avec succès (PID: $PROD_PID)"
        log_info "Logs disponibles dans: $LOG_FILE"
        log_info "URL: http://localhost:3000"
        log_info "Pour voir les logs en temps réel: tail -f $LOG_FILE"
        echo ""
        log_info "Dernières lignes du log:"
        echo "----------------------------------------"
        tail -n 10 "$LOG_FILE" 2>/dev/null || echo "Log en cours de création..."
        echo "----------------------------------------"
    else
        log_error "Échec du démarrage du serveur de production"
        log_error "Vérifiez les logs: $LOG_FILE"
        exit 1
    fi
}

# Fonction pour afficher les logs en temps réel
show_logs() {
    if [ -f "$LOG_DIR/prod.log" ]; then
        log_info "Affichage des logs de production en temps réel..."
        log_info "Appuyez sur Ctrl+C pour arrêter"
        echo ""
        tail -f "$LOG_DIR/prod.log"
    else
        log_warning "Aucun fichier de log de production trouvé"
    fi
}

# Fonction d'aide
show_help() {
    echo -e "${CYAN}🚀 Production Server with Enhanced Logs${NC}"
    echo ""
    echo "Usage: $0 [commande]"
    echo ""
    echo "Commandes disponibles:"
    echo "  start   - Démarrer le serveur de production avec logs améliorés"
    echo "  stop    - Arrêter le serveur de production"
    echo "  logs    - Afficher les logs en temps réel"
    echo "  status  - Vérifier le statut du serveur"
    echo "  help    - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 start         # Démarrer avec logs"
    echo "  $0 logs          # Voir les logs en temps réel"
    echo "  $0 stop          # Arrêter le serveur"
    echo ""
}

# Fonction pour vérifier le statut
check_status() {
    log_header "Statut du serveur de production"
    echo ""
    
    if check_port 3000; then
        log_success "Serveur de production: ACTIF (port 3000)"
        
        # Afficher le PID si disponible
        if [ -f "$LOG_DIR/prod.pid" ]; then
            PID=$(cat "$LOG_DIR/prod.pid")
            log_info "PID: $PID"
        fi
        
        # Afficher les dernières lignes du log
        if [ -f "$LOG_DIR/prod.log" ]; then
            echo ""
            log_info "Dernières lignes du log:"
            echo "----------------------------------------"
            tail -n 5 "$LOG_DIR/prod.log"
            echo "----------------------------------------"
        fi
    else
        log_warning "Serveur de production: INACTIF (port 3000)"
    fi
}

# Fonction principale
main() {
    local command=${1:-"start"}
    
    case "$command" in
        "start")
            start_prod_with_logs
            ;;
        "stop")
            stop_prod_server
            log_success "Serveur de production arrêté"
            ;;
        "logs")
            show_logs
            ;;
        "status")
            check_status
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

