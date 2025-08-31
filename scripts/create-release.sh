#!/bin/bash

# Script pour créer des releases Git avec tags et notes de version
# Crée un tag Git et une release GitHub/GitLab

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

# Configuration
DEV_DIR="dev"
RELEASE_VERSION=""
RELEASE_TYPE=""
RELEASE_NOTES=""

# Fonction pour extraire la version actuelle
get_current_version() {
    if [ -f "$DEV_DIR/package.json" ]; then
        CURRENT_VERSION=$(grep '"version"' "$DEV_DIR/package.json" | sed 's/.*"version": "\([^"]*\)".*/\1/')
        log_info "Version actuelle: $CURRENT_VERSION"
    else
        log_error "package.json non trouvé dans $DEV_DIR"
        exit 1
    fi
}

# Fonction pour demander le type de release
ask_release_type() {
    echo ""
    echo "📋 Types de release disponibles :"
    echo "  1) patch - Corrections de bugs (0.0.X)"
    echo "  2) minor - Nouvelles fonctionnalités (0.X.0)"
    echo "  3) major - Changements majeurs (X.0.0)"
    echo "  4) custom - Version personnalisée"
    echo ""
    
    read -p "Choisissez le type de release (1-4): " choice
    
    case $choice in
        1)
            RELEASE_TYPE="patch"
            ;;
        2)
            RELEASE_TYPE="minor"
            ;;
        3)
            RELEASE_TYPE="major"
            ;;
        4)
            read -p "Entrez la version personnalisée (ex: 1.2.3): " custom_version
            RELEASE_VERSION="$custom_version"
            ;;
        *)
            log_error "Choix invalide"
            exit 1
            ;;
    esac
}

# Fonction pour calculer la nouvelle version
calculate_new_version() {
    if [ -n "$RELEASE_VERSION" ]; then
        # Version personnalisée déjà définie
        return
    fi
    
    local major=$(echo $CURRENT_VERSION | cut -d. -f1)
    local minor=$(echo $CURRENT_VERSION | cut -d. -f2)
    local patch=$(echo $CURRENT_VERSION | cut -d. -f3)
    
    case $RELEASE_TYPE in
        "patch")
            patch=$((patch + 1))
            ;;
        "minor")
            minor=$((minor + 1))
            patch=0
            ;;
        "major")
            major=$((major + 1))
            minor=0
            patch=0
            ;;
    esac
    
    RELEASE_VERSION="${major}.${minor}.${patch}"
    log_info "Nouvelle version: $RELEASE_VERSION"
}

# Fonction pour demander les notes de release
ask_release_notes() {
    echo ""
    echo "📝 Notes de release pour v$RELEASE_VERSION"
    echo "Entrez les notes de release (Ctrl+D pour terminer):"
    echo "Exemple:"
    echo "- Correction du bug d'affichage"
    echo "- Ajout de nouvelles fonctionnalités"
    echo "- Amélioration des performances"
    echo ""
    
    # Lire les notes de release
    RELEASE_NOTES=$(cat)
    
    if [ -z "$RELEASE_NOTES" ]; then
        RELEASE_NOTES="Release v$RELEASE_VERSION

- Améliorations générales
- Corrections de bugs
- Optimisations de performance"
    fi
}

# Fonction pour vérifier l'état du repository
check_repository_status() {
    log_info "🔍 Vérification de l'état du repository..."
    
    # Vérifier s'il y a des changements non commités
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "⚠️  Des changements non commités sont présents."
        git status --short
        echo ""
        read -p "Voulez-vous les committer avant de créer la release ? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            git commit -m "🔧 Préparation de la release v$RELEASE_VERSION"
            log_success "Changements commités"
        else
            log_error "Impossible de créer une release avec des changements non commités"
            exit 1
        fi
    fi
    
    # Vérifier si on est sur la branche principale
    CURRENT_BRANCH=$(git branch --show-current)
    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        log_warning "⚠️  Vous n'êtes pas sur la branche principale (actuellement sur $CURRENT_BRANCH)"
        read -p "Voulez-vous continuer ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Release annulée."
            exit 0
        fi
    fi
}

# Fonction pour mettre à jour la version
update_version() {
    log_info "📝 Mise à jour de la version dans $DEV_DIR/package.json..."
    
    # Mettre à jour la version dans dev/package.json
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$RELEASE_VERSION\"/" "$DEV_DIR/package.json"
    
    log_success "Version mise à jour vers $RELEASE_VERSION"
}

# Fonction pour créer le commit de release
create_release_commit() {
    log_info "📝 Création du commit de release..."
    
    # Ajouter les changements
    git add .
    
    # Créer le commit
    git commit -m "🚀 Release v$RELEASE_VERSION

$RELEASE_NOTES"
    
    log_success "Commit de release créé"
}

# Fonction pour créer le tag Git
create_git_tag() {
    log_info "🏷️  Création du tag Git v$RELEASE_VERSION..."
    
    # Créer le tag annoté
    git tag -a "v$RELEASE_VERSION" -m "Release v$RELEASE_VERSION

$RELEASE_NOTES"
    
    log_success "Tag Git créé: v$RELEASE_VERSION"
}

# Fonction pour pousser les changements
push_changes() {
    log_info "📤 Poussée des changements vers le repository distant..."
    
    # Pousser le commit
    git push origin HEAD
    
    # Pousser le tag
    git push origin "v$RELEASE_VERSION"
    
    log_success "Changements et tag poussés"
}

# Fonction pour créer la release GitHub/GitLab
create_remote_release() {
    log_info "🌐 Création de la release sur le repository distant..."
    
    # Détecter le type de repository
    REMOTE_URL=$(git remote get-url origin)
    
    if [[ $REMOTE_URL == *"github.com"* ]]; then
        create_github_release
    elif [[ $REMOTE_URL == *"gitlab.com"* ]] || [[ $REMOTE_URL == *"gitlab"* ]]; then
        create_gitlab_release
    else
        log_warning "Repository distant non reconnu. Release locale créée."
    fi
}

# Fonction pour créer une release GitHub
create_github_release() {
    log_info "📋 Création de la release GitHub..."
    
    # Vérifier si gh CLI est installé
    if ! command -v gh &> /dev/null; then
        log_warning "GitHub CLI (gh) non installé. Release locale uniquement."
        return
    fi
    
    # Créer la release GitHub
    echo "$RELEASE_NOTES" | gh release create "v$RELEASE_VERSION" --title "Release v$RELEASE_VERSION" --notes-file -
    
    log_success "Release GitHub créée"
}

# Fonction pour créer une release GitLab
create_gitlab_release() {
    log_info "📋 Création de la release GitLab..."
    
    # Vérifier si glab CLI est installé
    if ! command -v glab &> /dev/null; then
        log_warning "GitLab CLI (glab) non installé. Release locale uniquement."
        return
    fi
    
    # Créer la release GitLab
    glab release create "v$RELEASE_VERSION" --title "Release v$RELEASE_VERSION" --notes "$RELEASE_NOTES"
    
    log_success "Release GitLab créée"
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    log_success "🎉 Release v$RELEASE_VERSION créée avec succès !"
    echo ""
    echo "📊 Résumé de la release :"
    echo "  ✅ Version: $CURRENT_VERSION → $RELEASE_VERSION"
    echo "  ✅ Type: $RELEASE_TYPE"
    echo "  ✅ Commit créé"
    echo "  ✅ Tag Git créé: v$RELEASE_VERSION"
    echo "  ✅ Changements poussés"
    echo "  ✅ Release distante créée"
    echo ""
    echo "📝 Notes de release :"
    echo "$RELEASE_NOTES" | sed 's/^/  /'
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "  - Vérifier la release sur GitHub/GitLab"
    echo "  - Tester la nouvelle version"
    echo "  - Déployer en production: ./scripts/deploy-dev-to-prod.sh"
    echo ""
}

# Fonction pour afficher l'aide
show_help() {
    echo "Script de création de releases Git"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options :"
    echo "  -h, --help     Afficher cette aide"
    echo "  -v, --version  Version spécifique (ex: 1.2.3)"
    echo "  -t, --type     Type de release (patch|minor|major)"
    echo "  -n, --notes    Notes de release"
    echo ""
    echo "Exemples :"
    echo "  $0                    # Mode interactif"
    echo "  $0 -t patch          # Release patch"
    echo "  $0 -v 2.0.0          # Version spécifique"
    echo "  $0 -t minor -n 'Nouvelles fonctionnalités'"
    echo ""
}

# Fonction pour parser les arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                RELEASE_VERSION="$2"
                shift 2
                ;;
            -t|--type)
                RELEASE_TYPE="$2"
                shift 2
                ;;
            -n|--notes)
                RELEASE_NOTES="$2"
                shift 2
                ;;
            *)
                log_error "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Fonction principale
main() {
    log_info "🚀 Création de release Git..."
    echo ""
    
    # Parser les arguments
    parse_arguments "$@"
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -d "$DEV_DIR" ] || [ ! -d ".git" ]; then
        log_error "Répertoires dev/ et .git/ non trouvés. Exécutez ce script depuis la racine du projet."
        exit 1
    fi
    
    # Étapes de création de release
    get_current_version
    check_repository_status
    
    # Mode interactif si pas d'arguments
    if [ -z "$RELEASE_TYPE" ] && [ -z "$RELEASE_VERSION" ]; then
        ask_release_type
    fi
    
    if [ -z "$RELEASE_VERSION" ]; then
        calculate_new_version
    fi
    
    if [ -z "$RELEASE_NOTES" ]; then
        ask_release_notes
    fi
    
    update_version
    create_release_commit
    create_git_tag
    push_changes
    create_remote_release
    show_summary
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
