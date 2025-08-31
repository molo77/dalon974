#!/bin/bash

# Script pour mise à jour majeure de l'environnement avec commit automatique
# Incrémente la version majeure et fait un commit

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
CURRENT_VERSION=""
NEW_VERSION=""

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

# Fonction pour incrémenter la version majeure
increment_major_version() {
    local major=$(echo $CURRENT_VERSION | cut -d. -f1)
    local minor=$(echo $CURRENT_VERSION | cut -d. -f2)
    local patch=$(echo $CURRENT_VERSION | cut -d. -f3)
    
    # Incrémenter la version majeure
    major=$((major + 1))
    minor=0
    patch=0
    
    NEW_VERSION="${major}.${minor}.${patch}"
    log_info "Nouvelle version majeure: $NEW_VERSION"
}

# Fonction pour mettre à jour la version dans package.json
update_version() {
    log_info "📝 Mise à jour de la version dans $DEV_DIR/package.json..."
    
    # Mettre à jour la version dans dev/package.json
    sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" "$DEV_DIR/package.json"
    
    log_success "Version mise à jour vers $NEW_VERSION"
}

# Fonction pour arrêter tous les serveurs
stop_all_servers() {
    log_info "🛑 Arrêt de tous les serveurs..."
    
    # Arrêter tous les processus Next.js
    pkill -f "next.*dev" 2>/dev/null || true
    pkill -f "next.*start" 2>/dev/null || true
    pkill -f "node.*next" 2>/dev/null || true
    
    # Attendre un peu
    sleep 1
    
    # Forcer l'arrêt si nécessaire
    pkill -9 -f "next.*dev" 2>/dev/null || true
    pkill -9 -f "next.*start" 2>/dev/null || true
    pkill -9 -f "node.*next" 2>/dev/null || true
    
    log_success "Tous les serveurs arrêtés"
}

# Fonction pour nettoyer les builds
clean_all_builds() {
    log_info "🧹 Nettoyage complet des builds..."
    
    # Supprimer les dossiers .next
    if [ -d "$DEV_DIR/.next" ]; then
        rm -rf "$DEV_DIR/.next"
        log_success "Build dev supprimé"
    fi
    
    if [ -d "prod/.next" ]; then
        rm -rf "prod/.next"
        log_success "Build prod supprimé"
    fi
    
    # Supprimer les package-lock.json
    if [ -f "$DEV_DIR/package-lock.json" ]; then
        rm -f "$DEV_DIR/package-lock.json"
        log_success "package-lock.json dev supprimé"
    fi
    
    if [ -f "prod/package-lock.json" ]; then
        rm -f "prod/package-lock.json"
        log_success "package-lock.json prod supprimé"
    fi
    
    # Supprimer les node_modules pour un rebuild complet
    if [ -d "$DEV_DIR/node_modules" ]; then
        rm -rf "$DEV_DIR/node_modules"
        log_success "node_modules dev supprimé"
    fi
    
    if [ -d "prod/node_modules" ]; then
        rm -rf "prod/node_modules"
        log_success "node_modules prod supprimé"
    fi
}

# Fonction pour installer les dépendances
install_dependencies() {
    log_info "📦 Installation des dépendances..."
    
    # Installer les dépendances de dev
    cd "$DEV_DIR"
    npm install
    cd ..
    
    # Installer les dépendances de prod
    cd "prod"
    npm install
    cd ..
    
    log_success "Dépendances installées"
}

# Fonction pour générer Prisma
generate_prisma() {
    log_info "🗄️  Génération des clients Prisma..."
    
    # Générer Prisma pour dev
    if [ -f "$DEV_DIR/prisma/schema.prisma" ]; then
        cd "$DEV_DIR"
        npx prisma generate
        cd ..
        log_success "Prisma dev généré"
    fi
    
    # Générer Prisma pour prod
    if [ -f "prod/prisma/schema.prisma" ]; then
        cd "prod"
        npx prisma generate
        cd ..
        log_success "Prisma prod généré"
    fi
}

# Fonction pour faire un commit Git
commit_changes() {
    log_info "📝 Création du commit Git..."
    
    # Ajouter tous les changements
    git add .
    
    # Créer le commit
    git commit -m "🚀 [v$NEW_VERSION] Mise à jour majeure de l'environnement

- Version incrémentée de $CURRENT_VERSION vers $NEW_VERSION
- Nettoyage complet des builds et dépendances
- Régénération des clients Prisma
- Mise à jour de l'environnement de développement et production

Changements majeurs:
- Rebuild complet des applications
- Mise à jour des dépendances
- Optimisation de l'environnement"
    
    log_success "Commit créé: [v$NEW_VERSION] Mise à jour majeure"
}

# Fonction pour afficher le résumé
show_summary() {
    echo ""
    log_success "🎉 Mise à jour majeure terminée !"
    echo ""
    echo "📊 Résumé des actions :"
    echo "  ✅ Version incrémentée: $CURRENT_VERSION → $NEW_VERSION"
    echo "  ✅ Serveurs arrêtés"
    echo "  ✅ Builds nettoyés"
    echo "  ✅ Dépendances réinstallées"
    echo "  ✅ Clients Prisma régénérés"
    echo "  ✅ Commit Git créé"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "  - Vérifier que tout fonctionne: ./scripts/server-manager.sh status"
    echo "  - Démarrer les serveurs: ./scripts/server-manager.sh both"
    echo "  - Déployer en production: ./scripts/deploy-dev-to-prod.sh"
    echo ""
}

# Fonction principale
main() {
    log_info "🚀 Début de la mise à jour majeure de l'environnement..."
    echo ""
    
    # Vérifier que nous sommes dans le bon répertoire
    if [ ! -d "$DEV_DIR" ] || [ ! -d "prod" ]; then
        log_error "Répertoires dev/ et prod/ non trouvés. Exécutez ce script depuis la racine du projet."
        exit 1
    fi
    
    # Vérifier le statut Git
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "⚠️  Des changements non commités sont présents."
        read -p "Voulez-vous continuer ? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Mise à jour annulée."
            exit 0
        fi
    fi
    
    # Étapes de la mise à jour
    get_current_version
    increment_major_version
    stop_all_servers
    clean_all_builds
    update_version
    install_dependencies
    generate_prisma
    commit_changes
    show_summary
}

# Gestion des erreurs
trap 'log_error "Erreur survenue. Arrêt du script."; exit 1' ERR

# Exécution
main "$@"
