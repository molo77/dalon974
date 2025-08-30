#!/bin/bash
set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEV_DIR="/data/dalon974/dev"
PROD_DIR="/data/dalon974/prod"
BACKUP_DIR="/data/dalon974/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="prod_backup_${TIMESTAMP}"

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

# Vérification des processus
check_process() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Port $port utilisé, arrêt du processus..."
        pkill -f "next.*:$port" || true
        sleep 2
    fi
}

# Création de sauvegarde
create_backup() {
    log_info "Création de sauvegarde de production..."
    mkdir -p "$BACKUP_DIR"
    
    if [ -d "$PROD_DIR" ]; then
        rsync -av --exclude='node_modules' --exclude='.next' --exclude='logs' \
            --exclude='public/uploads' \
            "$PROD_DIR/" "$BACKUP_DIR/$BACKUP_NAME/"
        log_success "Sauvegarde créée: $BACKUP_DIR/$BACKUP_NAME"
    else
        log_warning "Aucune production existante à sauvegarder"
    fi
}

# Nettoyage de production
clean_prod() {
    log_info "Nettoyage de l'environnement de production..."
    cd "$PROD_DIR"
    
    # Arrêt des processus
    check_process 3000
    
    # Nettoyage des fichiers (garder .next pour copier le build de dev)
    rm -rf node_modules package-lock.json
    log_success "Environnement de production nettoyé (build .next conservé)"
}

# Copie des fichiers
copy_files() {
    log_info "Copie des fichiers de dev vers prod..."
    
    # Fichiers applicatifs (incluant le build .next)
    rsync -av --exclude='node_modules' --exclude='logs' \
        --exclude='public/uploads' \
        "$DEV_DIR/" "$PROD_DIR/"
    
    log_success "Fichiers copiés avec succès (incluant le build .next)"
}

# Reconstruction du fichier .env.local pour la production
rebuild_env_prod() {
    log_info "Reconstruction du fichier .env.local pour la production..."
    
    if [ ! -f "$DEV_DIR/.env.local" ]; then
        log_warning "Fichier .env.local manquant en dev, création d'un fichier par défaut"
        cat > "$PROD_DIR/.env.local" << 'EOF'
# Variables d'environnement pour la production
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# DATABASE_URL : chaîne de connexion MySQL pour la production
DATABASE_URL="mysql://molo:Bulgroz%401977@192.168.1.200:3306/dalon974_prod"

# NextAuth config
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="TZgJKrIdZ5KDmx48KQ84iOuSMQq2SN+EmGdG3bqeyO8="

# Compte démo (credentials login)
DEMO_EMAIL="molo77@gmail.com"
DEMO_PASSWORD="Bulgroz@1977"

# OAuth providers
GOOGLE_CLIENT_ID="48015729035-oedf65tb7q75orhti3nul4fnsfrp2aks.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# Image d'accueil
NEXT_PUBLIC_HOMEPAGE_IMAGE=/images/home-hero.png

# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=9563918255
NEXT_PUBLIC_ADSENSE_SLOT=1234567890

# Scraper Leboncoin
LBC_DEBUG=false
LBC_SEARCH_URL="https://www.leboncoin.fr/recherche?category=11&locations=r_26"
LBC_BROWSER_HEADLESS=true
LBC_MAX=100
LBC_FETCH_DETAILS=true
LBC_DETAIL_LIMIT=all
LBC_DETAIL_SLEEP=500
LBC_PAGES=4
LBC_VERBOSE_LIST=false
LBC_EXPORT_JSON=false
LBC_NO_DB=false
LBC_UPDATE_COOLDOWN_HOURS=0
LBC_EXTRA_SLEEP=0
LBC_USE_PROTONVPN=false
LBC_DATADOME=9VQvc8E96v_De6xYlgvI4waevp_3zDqgr6KBX0ev_5XTkyZDinqOKde7jIFFl_QvPmCmfPFHfZBWUokuD4juQq~Ui_57m0cNbQ0bNdmvDO1NNVR3ru4Bjy3ENkfvR7rc
DATADOME_TOKEN=9VQvc8E96v_De6xYlgvI4waevp_3zDqgr6KBX0ev_5XTkyZDinqOKde7jIFFl_QvPmCmfPFHfZBWUokuD4juQq~Ui_57m0cNbQ0bNdmvDO1NNVR3ru4Bjy3ENkfvR7rc
EOF
        log_success "Fichier .env.local de production créé avec configuration par défaut"
        return
    fi
    
    # Lire le fichier .env.local de dev et le transformer pour la production
    cd "$PROD_DIR"
    
    # Créer le nouveau fichier .env.local pour la production
    {        
        # Copier le contenu du fichier dev en modifiant les variables appropriées
        while IFS= read -r line; do
            # Ignorer les lignes de commentaires et les lignes vides
            if [[ "$line" =~ ^[[:space:]]*# ]] || [[ -z "$line" ]]; then
                echo "$line"
                continue
            fi
            
            # Modifier les variables spécifiques à la production
            if [[ "$line" =~ ^NODE_ENV= ]]; then
                echo "NODE_ENV=production"
            elif [[ "$line" =~ ^NEXT_PUBLIC_APP_ENV= ]]; then
                echo "NEXT_PUBLIC_APP_ENV=production"
            elif [[ "$line" =~ ^DATABASE_URL=.*dalon974_dev ]]; then
                echo 'DATABASE_URL="mysql://molo:Bulgroz%401977@192.168.1.200:3306/dalon974_prod"'
            elif [[ "$line" =~ ^NEXTAUTH_URL=.*3001 ]]; then
                echo 'NEXTAUTH_URL="http://localhost:3000"'
            elif [[ "$line" =~ ^LBC_DEBUG=.*true ]]; then
                echo "LBC_DEBUG=false"
            else
                echo "$line"
            fi
        done < "$DEV_DIR/.env.local"
    } > .env.local
    
    log_success "Fichier .env.local de production reconstruit à partir de dev"
}

# Installation des dépendances
install_dependencies() {
    log_info "Installation des dépendances de production..."
    cd "$PROD_DIR"
    npm install
    log_success "Dépendances installées"
}

# Build de l'application
build_application() {
    log_info "Build de l'application de production..."
    cd "$PROD_DIR"
    npm run build
    log_success "Build terminé"
}

# Démarrage de l'application
start_application() {
    log_info "Démarrage de l'application de production..."
    cd "$PROD_DIR"
    
    # Démarrage en arrière-plan
    nohup npm start > logs/prod.log 2>&1 &
    PROD_PID=$!
    
    log_success "Application démarrée avec PID: $PROD_PID"
}

# Vérification de santé
health_check() {
    log_info "Vérification de santé..."
    sleep 10
    
    if curl -f http://localhost:3000/api/health >/dev/null 2>&1; then
        log_success "Application de production accessible"
    else
        log_error "Application de production non accessible"
        exit 1
    fi
}

# Nettoyage des anciennes sauvegardes
cleanup_backups() {
    log_info "Nettoyage des anciennes sauvegardes..."
    
    # Garder seulement les 5 dernières sauvegardes
    cd "$BACKUP_DIR"
    ls -t | tail -n +6 | xargs -r rm -rf
    log_success "Anciennes sauvegardes supprimées"
}

# Arrêt des serveurs
stop_servers() {
    log_info "Arrêt des serveurs avant synchronisation..."
    
    # Utiliser le script server-manager.sh
    local script_dir=$(dirname "$(readlink -f "$0")")
    "$script_dir/server-manager.sh" stop
    
    log_success "Serveurs arrêtés"
}

# Redémarrage des serveurs
restart_servers() {
    log_info "Redémarrage des serveurs après synchronisation..."
    
    # Utiliser le script server-manager.sh
    local script_dir=$(dirname "$(readlink -f "$0")")
    "$script_dir/server-manager.sh" both
    
    log_success "Serveurs redémarrés"
}

# Fonction principale
main() {
    log_info "=== Déploiement Dev vers Prod ==="
    
    # Arrêt des serveurs avant synchronisation
    stop_servers
    
    create_backup
    clean_prod
    copy_files
    rebuild_env_prod
    install_dependencies
    
    # Note: Pas de build nécessaire car on copie le .next de dev
    log_info "Build copié depuis dev, pas de rebuild nécessaire"
    
    # Synchronisation de la structure de base de données
    log_info "Synchronisation de la structure MySQL..."
    if bash "$SCRIPT_DIR/sync-database-structure.sh"; then
        log_success "Structure MySQL synchronisée avec succès"
    else
        log_warning "Échec de la synchronisation MySQL (vérifiez les logs)"
    fi
    
    # Redémarrage des serveurs après synchronisation
    restart_servers
    
    # Vérification de santé après redémarrage
    health_check
    
    cleanup_backups
    
    log_success "Déploiement terminé avec succès !"
    log_info "URL Development: http://localhost:3001"
    log_info "URL Production: http://localhost:3000"
    log_info "Sauvegarde: $BACKUP_DIR/$BACKUP_NAME"
}

# Exécution
main "$@"
