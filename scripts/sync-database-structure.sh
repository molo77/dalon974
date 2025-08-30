#!/bin/bash

# Script de synchronisation de la structure de base de données
# Synchronise uniquement la structure (tables, colonnes, index) sans les données

set -e

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
NC='\033[0m'

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
    
    if ! command -v npx &> /dev/null; then
        log_error "npx n'est pas disponible"
        exit 1
    fi
    
    if [[ ! -f "$DEV_DIR/prisma/schema.prisma" ]]; then
        log_error "Schema Prisma introuvable dans dev"
        exit 1
    fi
    
    if [[ ! -f "$PROD_DIR/prisma/schema.prisma" ]]; then
        log_error "Schema Prisma introuvable dans prod"
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Génération du client Prisma en dev
generate_dev_client() {
    log_info "Génération du client Prisma en dev..."
    
    cd "$DEV_DIR"
    
    # Génération du client Prisma
    npx prisma generate
    
    log_success "Client Prisma généré en dev"
}

# Création d'une migration en dev
create_migration() {
    log_info "Création d'une migration en dev..."
    
    cd "$DEV_DIR"
    
    # Création d'une migration (si il y a des changements)
    if npx prisma migrate dev --name "sync_structure_$(date +%Y%m%d_%H%M%S)" --create-only; then
        log_success "Migration créée en dev"
    else
        log_warning "Aucune migration nécessaire en dev"
    fi
}

# Synchronisation de la structure vers la production
sync_to_production() {
    log_info "Synchronisation de la structure vers la production..."
    
    cd "$PROD_DIR"
    
    # Génération du client Prisma en prod
    npx prisma generate
    
    # Application des migrations (structure uniquement)
    if npx prisma migrate deploy; then
        log_success "Structure synchronisée vers la production"
    else
        log_error "Échec de la synchronisation de la structure"
        exit 1
    fi
}

# Vérification de la synchronisation
verify_sync() {
    log_info "Vérification de la synchronisation..."
    
    cd "$PROD_DIR"
    
    # Vérification de l'état de la base de données
    if npx prisma migrate status; then
        log_success "État de la base de données vérifié"
    else
        log_warning "Impossible de vérifier l'état de la base de données"
    fi
}

# Fonction principale
main() {
    echo "🗄️  Synchronisation de la structure de base de données"
    echo "=================================================="
    
    check_prerequisites
    generate_dev_client
    create_migration
    sync_to_production
    verify_sync
    
    echo ""
    log_success "Synchronisation de la structure terminée !"
    echo ""
    echo "📋 Résumé :"
    echo "  • Client Prisma généré en dev"
    echo "  • Migration créée (si nécessaire)"
    echo "  • Structure synchronisée vers la production"
    echo "  • État de la base de données vérifié"
    echo ""
    echo "⚠️  Note : Seule la structure a été synchronisée, les données sont préservées"
}

# Exécution du script
main "$@"
