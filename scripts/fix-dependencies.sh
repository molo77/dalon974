#!/bin/bash
set -euo pipefail

# Script de correction des dépendances RodColoc
# Résout les conflits de dépendances React 19

readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DEV_DIR="$PROJECT_ROOT/dev"
readonly PROD_DIR="$PROJECT_ROOT/prod"

# Couleurs
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

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

# Fonction principale
main() {
    log_info "🔧 Correction des dépendances RodColoc"
    
    # Vérifier les répertoires
    if [[ ! -d "$DEV_DIR" ]]; then
        log_error "Répertoire de développement non trouvé: $DEV_DIR"
        exit 1
    fi
    
    # Corriger les dépendances de développement
    log_info "📦 Correction des dépendances de développement..."
    cd "$DEV_DIR"
    
    # Nettoyer le cache npm
    log_info "Nettoyage du cache npm..."
    npm cache clean --force 2>/dev/null || true
    
    # Supprimer node_modules et package-lock.json
    log_info "Suppression des anciens fichiers..."
    rm -rf node_modules package-lock.json yarn.lock
    
    # Installer avec --legacy-peer-deps
    log_info "Installation avec --legacy-peer-deps..."
    if npm install --legacy-peer-deps; then
        log_success "Dépendances de développement installées"
    else
        log_error "Échec de l'installation des dépendances de développement"
        exit 1
    fi
    
    # Corriger les dépendances de production si le répertoire existe
    if [[ -d "$PROD_DIR" ]]; then
        log_info "📦 Correction des dépendances de production..."
        cd "$PROD_DIR"
        
        # Nettoyer
        rm -rf node_modules package-lock.json yarn.lock
        
        # Installer
        if npm install --production --legacy-peer-deps; then
            log_success "Dépendances de production installées"
        else
            log_warning "Échec de l'installation des dépendances de production"
        fi
    fi
    
    log_success "🎉 Correction des dépendances terminée !"
    log_info "Vous pouvez maintenant relancer le déploiement avec: npm run deploy"
}

# Afficher l'aide
show_help() {
    cat << EOF
🔧 Script de correction des dépendances RodColoc

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -h, --help      Affiche cette aide

DESCRIPTION:
    Ce script résout les conflits de dépendances React 19 en:
    - Nettoyant le cache npm
    - Supprimant les anciens node_modules
    - Réinstallant avec --legacy-peer-deps

EXAMPLES:
    $0              # Correction standard
    $0 --help       # Affiche l'aide

EOF
}

# Traitement des arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Exécution
main "$@"

