#!/bin/bash

# Script pour incrémenter automatiquement la version de dev/package.json
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

# Fonction pour extraire la version actuelle de dev
get_current_dev_version() {
    if [[ -f "dev/package.json" ]]; then
        local version=$(grep '"version"' dev/package.json | sed 's/.*"version": *"\([^"]*\)".*/\1/')
        echo "$version"
    else
        echo ""
    fi
}

# Fonction pour incrémenter la version
increment_version() {
    local current_version="$1"
    local increment_type="${2:-patch}"
    
    # Séparer les composants de version
    local major=$(echo "$current_version" | cut -d. -f1)
    local minor=$(echo "$current_version" | cut -d. -f2)
    local patch=$(echo "$current_version" | cut -d. -f3)
    
    case "$increment_type" in
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "patch"|*)
            patch=$((patch + 1))
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# Fonction pour mettre à jour la version dans dev/package.json
update_dev_version() {
    local new_version="$1"
    
    if [[ -f "dev/package.json" ]]; then
        local old_version=$(get_current_dev_version)
        
        # Mettre à jour la version
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" dev/package.json
        
        log_success "Version de dev mise à jour : $old_version → $new_version"
        return 0
    else
        log_error "Fichier dev/package.json introuvable"
        return 1
    fi
}

# Fonction pour créer un commit avec la nouvelle version
create_version_commit() {
    local new_version="$1"
    local commit_message="$2"
    
    # Ajouter le fichier modifié
    git add dev/package.json
    
    # Créer le commit
    git commit -m "[v$new_version] $commit_message"
    
    log_success "Commit créé avec la version $new_version"
}

# Fonction pour afficher l'aide
show_help() {
    echo "Usage: $0 [COMMANDE] [MESSAGE]"
    echo ""
    echo "Commandes disponibles :"
    echo "  patch [message]  - Incrémenter la version patch (défaut)"
    echo "  minor [message]  - Incrémenter la version minor"
    echo "  major [message]  - Incrémenter la version major"
    echo "  show            - Afficher la version actuelle de dev"
    echo "  help            - Afficher cette aide"
    echo ""
    echo "Exemples :"
    echo "  $0 patch \"Correction de bug\""
    echo "  $0 minor \"Nouvelle fonctionnalité\""
    echo "  $0 major \"Changement majeur\""
    echo "  $0 show"
    echo ""
    echo "Note : Seule la version de dev/package.json est modifiée."
    echo "La version de production sera synchronisée lors du déploiement."
}

# Fonction principale
main() {
    case "${1:-help}" in
        "patch"|"minor"|"major")
            local increment_type="$1"
            local commit_message="${2:-Incrément automatique de version $increment_type}"
            
            log_header "Incrémentation de la version de dev"
            
            # Obtenir la version actuelle
            local current_version=$(get_current_dev_version)
            if [[ -z "$current_version" ]]; then
                log_error "Impossible de récupérer la version actuelle de dev"
                exit 1
            fi
            
            log_info "Version actuelle de dev : $current_version"
            
            # Calculer la nouvelle version
            local new_version=$(increment_version "$current_version" "$increment_type")
            log_info "Nouvelle version : $new_version"
            
            # Mettre à jour la version
            update_dev_version "$new_version"
            
            # Créer le commit
            create_version_commit "$new_version" "$commit_message"
            
            # Afficher le statut final
            echo ""
            log_success "Version de dev incrémentée avec succès !"
            log_info "La version de production sera synchronisée lors du prochain déploiement"
            ;;
        "show")
            local current_version=$(get_current_dev_version)
            if [[ -n "$current_version" ]]; then
                log_info "Version actuelle de dev : $current_version"
            else
                log_error "Impossible de récupérer la version de dev"
                exit 1
            fi
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Commande inconnue: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Exécution du script
main "$@"
