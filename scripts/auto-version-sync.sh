#!/bin/bash

# Script pour synchroniser automatiquement les versions entre commits Git et package.json
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

# Fonction pour extraire la version du dernier commit
extract_version_from_last_commit() {
    local last_commit_msg=$(git log -1 --pretty=format:"%s")
    
    # Chercher le pattern [vX.Y.Z] dans le message de commit
    if [[ $last_commit_msg =~ \[v([0-9]+\.[0-9]+\.[0-9]+)\] ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo ""
    fi
}

# Fonction pour extraire la version d'un package.json
extract_version_from_package_json() {
    local package_file="$1"
    
    if [[ -f "$package_file" ]]; then
        local version=$(grep '"version"' "$package_file" | sed 's/.*"version": *"\([^"]*\)".*/\1/')
        echo "$version"
    else
        echo ""
    fi
}

# Fonction pour mettre à jour la version dans un package.json
update_version_in_package_json() {
    local package_file="$1"
    local new_version="$2"
    
    if [[ -f "$package_file" ]]; then
        # Sauvegarder l'ancienne version
        local old_version=$(extract_version_from_package_json "$package_file")
        
        # Mettre à jour la version
        sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$new_version\"/" "$package_file"
        
        log_info "Mise à jour de $package_file : $old_version → $new_version"
        return 0
    else
        log_warning "Fichier $package_file non trouvé"
        return 1
    fi
}

# Fonction pour vérifier si des fichiers ont été modifiés
check_modified_files() {
    local modified_files=$(git status --porcelain | grep -E "package\.json$" | awk '{print $2}')
    echo "$modified_files"
}

# Fonction pour créer un commit automatique
create_auto_commit() {
    local version="$1"
    local modified_files="$2"
    
    if [[ -n "$modified_files" ]]; then
        log_info "Création d'un commit automatique pour la synchronisation des versions..."
        
        git add $modified_files
        
        git commit -m "[v$version] Synchronisation automatique des versions package.json

- Mise à jour automatique des versions dans les fichiers package.json
- Synchronisation avec le numéro de version du dernier commit
- Fichiers modifiés: $modified_files

Cette synchronisation a été effectuée automatiquement par le script auto-version-sync.sh"
        
        log_success "Commit automatique créé pour la version $version"
    fi
}

# Fonction pour afficher le statut des versions
show_version_status() {
    log_header "Statut des versions"
    
    local commit_version=$(extract_version_from_last_commit)
    local root_version=$(extract_version_from_package_json "package.json")
    local dev_version=$(extract_version_from_package_json "dev/package.json")
    local prod_version=$(extract_version_from_package_json "prod/package.json")
    
    echo "📋 Versions actuelles :"
    echo "  • Dernier commit Git : $commit_version"
    echo "  • package.json racine : $root_version"
    echo "  • dev/package.json : $dev_version"
    echo "  • prod/package.json : $prod_version"
    echo ""
    
    # Vérifier la cohérence
    local all_versions=("$commit_version" "$root_version" "$dev_version" "$prod_version")
    local first_version=""
    local versions_match=true
    
    for version in "${all_versions[@]}"; do
        if [[ -n "$version" ]]; then
            if [[ -z "$first_version" ]]; then
                first_version="$version"
            elif [[ "$version" != "$first_version" ]]; then
                versions_match=false
                break
            fi
        fi
    done
    
    if [[ "$versions_match" == true && -n "$first_version" ]]; then
        log_success "Toutes les versions sont synchronisées : $first_version"
    else
        log_warning "Les versions ne sont pas synchronisées"
    fi
}

# Fonction pour synchroniser automatiquement
auto_sync_versions() {
    log_header "Synchronisation automatique des versions"
    
    local commit_version=$(extract_version_from_last_commit)
    
    if [[ -z "$commit_version" ]]; then
        log_warning "Aucune version trouvée dans le dernier commit"
        return 1
    fi
    
    log_info "Version détectée dans le dernier commit : $commit_version"
    
    local files_to_update=()
    local modified_files=()
    
    # Vérifier et mettre à jour package.json racine
    local root_version=$(extract_version_from_package_json "package.json")
    if [[ "$root_version" != "$commit_version" ]]; then
        update_version_in_package_json "package.json" "$commit_version"
        files_to_update+=("package.json")
        modified_files+=("package.json")
    fi
    
    # Vérifier et mettre à jour dev/package.json
    local dev_version=$(extract_version_from_package_json "dev/package.json")
    if [[ "$dev_version" != "$commit_version" ]]; then
        update_version_in_package_json "dev/package.json" "$commit_version"
        files_to_update+=("dev/package.json")
        modified_files+=("dev/package.json")
    fi
    
    # Vérifier et mettre à jour prod/package.json
    local prod_version=$(extract_version_from_package_json "prod/package.json")
    if [[ "$prod_version" != "$commit_version" ]]; then
        update_version_in_package_json "prod/package.json" "$commit_version"
        files_to_update+=("prod/package.json")
        modified_files+=("prod/package.json")
    fi
    
    if [[ ${#files_to_update[@]} -gt 0 ]]; then
        log_success "Mise à jour de ${#files_to_update[@]} fichier(s) : ${files_to_update[*]}"
        
        # Créer un commit automatique si des fichiers ont été modifiés
        create_auto_commit "$commit_version" "${modified_files[*]}"
    else
        log_success "Toutes les versions sont déjà synchronisées"
    fi
}

# Fonction pour ajouter un hook Git
setup_git_hook() {
    log_header "Configuration du hook Git pour synchronisation automatique"
    
    local hook_dir=".git/hooks"
    local hook_file="$hook_dir/post-commit"
    
    # Créer le répertoire hooks s'il n'existe pas
    mkdir -p "$hook_dir"
    
    # Créer le hook post-commit
    cat > "$hook_file" << 'EOF'
#!/bin/bash

# Hook Git pour synchronisation automatique des versions
# Exécuté après chaque commit

# Chemin vers le script de synchronisation
SCRIPT_PATH="$(git rev-parse --show-toplevel)/scripts/auto-version-sync.sh"

# Exécuter la synchronisation si le script existe
if [[ -f "$SCRIPT_PATH" && -x "$SCRIPT_PATH" ]]; then
    echo "🔄 Synchronisation automatique des versions..."
    "$SCRIPT_PATH" auto-sync
fi
EOF
    
    # Rendre le hook exécutable
    chmod +x "$hook_file"
    
    log_success "Hook Git post-commit configuré"
    log_info "La synchronisation des versions sera automatique après chaque commit"
}

# Fonction principale
main() {
    case "${1:-show}" in
        "show")
            show_version_status
            ;;
        "auto-sync")
            auto_sync_versions
            ;;
        "setup-hook")
            setup_git_hook
            ;;
        "help"|"-h"|"--help")
            echo "Usage: $0 [COMMANDE]"
            echo ""
            echo "Commandes disponibles :"
            echo "  show        - Afficher le statut des versions (défaut)"
            echo "  auto-sync   - Synchroniser automatiquement les versions"
            echo "  setup-hook  - Configurer le hook Git pour synchronisation automatique"
            echo "  help        - Afficher cette aide"
            echo ""
            echo "Exemples :"
            echo "  $0                    # Afficher le statut"
            echo "  $0 auto-sync          # Synchroniser les versions"
            echo "  $0 setup-hook         # Configurer le hook automatique"
            ;;
        *)
            log_error "Commande inconnue: $1"
            echo "Utilisez '$0 help' pour voir les commandes disponibles"
            exit 1
            ;;
    esac
}

# Exécution du script
main "$@"
