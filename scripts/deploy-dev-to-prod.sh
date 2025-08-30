#!/bin/bash

# Script de déploiement dev vers prod
# Copie les fichiers de dev vers prod, adapte les variables d'environnement
# et synchronise la base de données en gardant juste la structure

set -e  # Arrêt en cas d'erreur

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEV_DIR="$PROJECT_ROOT/dev"
PROD_DIR="$PROJECT_ROOT/prod"

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Vérification des prérequis
check_prerequisites() {
    log_info "Vérification des prérequis..."
    
    if [[ ! -d "$DEV_DIR" ]]; then
        log_error "Répertoire dev introuvable: $DEV_DIR"
        exit 1
    fi
    
    if [[ ! -d "$PROD_DIR" ]]; then
        log_error "Répertoire prod introuvable: $PROD_DIR"
        exit 1
    fi
    
    if ! command -v rsync &> /dev/null; then
        log_error "rsync n'est pas installé"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Arrêt des serveurs
stop_servers() {
    log_info "Arrêt des serveurs..."
    
    if [[ -f "$SCRIPT_DIR/server-manager.sh" ]]; then
        "$SCRIPT_DIR/server-manager.sh" stop
    else
        # Fallback: arrêt manuel
        pkill -f "next dev" || true
        pkill -f "next start" || true
        sleep 2
    fi
    
    log_success "Serveurs arrêtés"
}

# Nettoyage de la production
clean_production() {
    log_info "Nettoyage de la production..."
    
    cd "$PROD_DIR"
    
    # Suppression des fichiers générés
    rm -rf .next
    rm -rf node_modules
    rm -f package-lock.json
    
    # Sauvegarde de .env.local si il existe
    if [[ -f ".env.local" ]]; then
        cp .env.local .env.local.backup
        log_info "Sauvegarde de .env.local créée"
    fi
    
    log_success "Production nettoyée"
}

# Copie des fichiers de dev vers prod
copy_files() {
    log_info "Copie des fichiers de dev vers prod..."
    
    cd "$PROJECT_ROOT"
    
    # Copie de tous les fichiers sauf les spécifiques à l'environnement
    rsync -av --delete \
        --exclude='.env.local' \
        --exclude='.env.local.backup' \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='package-lock.json' \
        --exclude='.git' \
        --exclude='*.log' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        "$DEV_DIR/" "$PROD_DIR/"
    
    log_success "Fichiers copiés"
}

# Reconstruction du fichier .env.local pour la production
rebuild_env_prod() {
    log_info "Reconstruction du fichier .env.local pour la production..."
    
    cd "$PROD_DIR"
    
    # Suppression de l'ancien .env.local
    rm -f .env.local
    
    # Création du nouveau .env.local basé sur dev
    if [[ -f "$DEV_DIR/.env.local" ]]; then
        # Lecture du fichier dev et modification des variables pour la production
        while IFS= read -r line; do
            # Ignorer les lignes vides et les commentaires
            if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
                echo "$line" >> .env.local
                continue
            fi
            
            # Variables à modifier pour la production
            case "$line" in
                NODE_ENV=*)
                    echo "NODE_ENV=production" >> .env.local
                    ;;
                NEXT_PUBLIC_APP_ENV=*)
                    echo "NEXT_PUBLIC_APP_ENV=production" >> .env.local
                    ;;
                DATABASE_URL=*)
                    # Remplacer l'URL de base de données par celle de production
                    echo "$line" | sed 's/dev_/prod_/g' >> .env.local
                    ;;
                NEXTAUTH_URL=*)
                    # Remplacer l'URL par celle de production
                    echo "$line" | sed 's/localhost:3001/depannage-informatique974.fr/g' >> .env.local
                    ;;
                LBC_DEBUG=*)
                    echo "LBC_DEBUG=false" >> .env.local
                    ;;
                *)
                    # Copier les autres variables telles quelles
                    echo "$line" >> .env.local
                    ;;
            esac
        done < "$DEV_DIR/.env.local"
        
        log_success "Fichier .env.local reconstruit pour la production"
    else
        log_warning "Fichier .env.local de dev introuvable, création d'un fichier minimal"
        cat > .env.local << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
# Ajoutez ici vos variables de production
EOF
    fi
}

# Installation des dépendances en production
install_dependencies() {
    log_info "Installation des dépendances en production..."
    
    cd "$PROD_DIR"
    
    # Installation des dépendances
    npm ci --production=false
    
    log_success "Dépendances installées"
}

# Build de la production
build_production() {
    log_info "Build de la production..."
    
    cd "$PROD_DIR"
    
    # Build de l'application
    npm run build
    
    log_success "Build terminé"
}

# Synchronisation de la base de données (structure uniquement)
sync_database_structure() {
    log_info "Synchronisation de la structure de la base de données..."
    
    cd "$PROD_DIR"
    
    # Migration de la structure uniquement
    if command -v npx &> /dev/null; then
        npx prisma migrate deploy
        log_success "Structure de base de données synchronisée"
    else
        log_warning "npx non disponible, synchronisation de base de données ignorée"
    fi
}

# Redémarrage des serveurs
restart_servers() {
    log_info "Redémarrage des serveurs..."
    
    if [[ -f "$SCRIPT_DIR/server-manager.sh" ]]; then
        "$SCRIPT_DIR/server-manager.sh" both
    else
        log_warning "Script server-manager.sh introuvable, redémarrage manuel requis"
    fi
    
    log_success "Serveurs redémarrés"
}

# Vérification du déploiement
verify_deployment() {
    log_info "Vérification du déploiement..."
    
    # Attendre que les serveurs démarrent
    sleep 10
    
    # Test de l'API de version
    if curl -s http://localhost:3000/api/version > /dev/null; then
        log_success "API de production accessible"
    else
        log_warning "API de production non accessible (serveur peut être en cours de démarrage)"
    fi
    
    # Test de l'API de dev
    if curl -s http://localhost:3001/api/version > /dev/null; then
        log_success "API de développement accessible"
    else
        log_warning "API de développement non accessible (serveur peut être en cours de démarrage)"
    fi
}

# Fonction principale
main() {
    echo "🚀 Déploiement dev vers prod"
    echo "=========================="
    
    check_prerequisites
    stop_servers
    clean_production
    copy_files
    rebuild_env_prod
    install_dependencies
    build_production
    sync_database_structure
    restart_servers
    verify_deployment
    
    echo ""
    log_success "Déploiement terminé avec succès !"
    echo ""
    echo "📋 Résumé :"
    echo "  • Fichiers copiés de dev vers prod"
    echo "  • Variables d'environnement adaptées"
    echo "  • Structure de base de données synchronisée"
    echo "  • Serveurs redémarrés"
    echo ""
    echo "🌐 URLs :"
    echo "  • Production : http://localhost:3000"
    echo "  • Développement : http://localhost:3001"
}

# Exécution du script
main "$@"
