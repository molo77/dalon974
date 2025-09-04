#!/bin/bash

# Script de commit rapide avec gestion de version intelligente
# Usage: ./scripts/quick-commit.sh [type] [message]
# Types: patch (défaut), minor, major

set -e  # Arrêter en cas d'erreur

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Vérifier si on est dans un repo Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Ce répertoire n'est pas un repository Git"
    exit 1
fi

# Récupérer les paramètres
VERSION_TYPE=${1:-patch}
CUSTOM_MESSAGE=${2:-""}

# Vérifier s'il y a des fichiers modifiés
if [ -z "$(git diff --cached --name-only)" ]; then
    log_error "Aucun fichier en staging. Utilisez 'git add' d'abord."
    exit 1
fi

# Récupérer la version actuelle
CURRENT_VERSION=$(node -p "require('./dev/package.json').version")
if [ -z "$CURRENT_VERSION" ]; then
    log_error "Impossible de récupérer la version actuelle"
    exit 1
fi

# Calculer la nouvelle version
NEW_VERSION=$(node -e "
const version = '$CURRENT_VERSION';
const type = '$VERSION_TYPE';
const parts = version.split('.').map(Number);

switch (type) {
    case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
    case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
    case 'patch':
    default:
        parts[2]++;
        break;
}

console.log(parts.join('.'));
")

log_info "Version actuelle: $CURRENT_VERSION"
log_info "Nouvelle version: $NEW_VERSION"

# Analyser les fichiers modifiés pour générer un message
FILES=$(git diff --cached --name-only)
FILE_COUNT=$(echo "$FILES" | wc -l)

# Générer un message de commit basé sur les fichiers
if [ -n "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="[v$NEW_VERSION] $CUSTOM_MESSAGE"
else
    # Analyser le type de changement
    if echo "$FILES" | grep -q "api/"; then
        SCOPE="(api)"
        TYPE="feat"
    elif echo "$FILES" | grep -q "components/"; then
        SCOPE="(ui)"
        TYPE="feat"
    elif echo "$FILES" | grep -q "lib/"; then
        SCOPE="(lib)"
        TYPE="feat"
    elif echo "$FILES" | grep -q "scripts/"; then
        SCOPE="(scripts)"
        TYPE="feat"
    elif echo "$FILES" | grep -q "prisma/"; then
        SCOPE="(db)"
        TYPE="feat"
        VERSION_TYPE="minor"  # Changements DB = version minor
    else
        SCOPE=""
        TYPE="fix"
    fi

    # Générer la description
    if [ "$FILE_COUNT" -eq 1 ]; then
        FILE_NAME=$(basename "$FILES")
        DESCRIPTION="Mise à jour de $FILE_NAME"
    else
        DESCRIPTION="Modifications multiples ($FILE_COUNT fichiers)"
    fi

    COMMIT_MESSAGE="[v$NEW_VERSION] $TYPE: $SCOPE$DESCRIPTION"
fi

log_info "Message de commit: $COMMIT_MESSAGE"

# Afficher les changements
log_info "Changements qui vont être commités:"
git diff --cached --stat

# Mettre à jour les versions
log_info "Mise à jour des versions..."

# Sauvegarder les versions actuelles pour restauration en cas d'erreur
cp dev/package.json dev/package.json.backup
cp package.json package.json.backup

# Mettre à jour les versions
node -e "
const fs = require('fs');
const newVersion = '$NEW_VERSION';

// Mettre à jour dev/package.json
const devPackage = JSON.parse(fs.readFileSync('dev/package.json', 'utf8'));
devPackage.version = newVersion;
fs.writeFileSync('dev/package.json', JSON.stringify(devPackage, null, 2) + '\n');

// Mettre à jour package.json
const prodPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
prodPackage.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(prodPackage, null, 2) + '\n');

console.log('Versions mises à jour');
"

# Ajouter les fichiers de version au staging
git add dev/package.json package.json

# Exécuter le commit
log_info "Exécution du commit..."
if git commit -m "$COMMIT_MESSAGE"; then
    log_success "Commit effectué avec succès ! Version $NEW_VERSION appliquée."
    
    # Nettoyer les fichiers de sauvegarde
    rm -f dev/package.json.backup package.json.backup
    
    # Afficher le résumé
    echo ""
    log_success "Résumé:"
    echo "  - Version: $CURRENT_VERSION → $NEW_VERSION"
    echo "  - Message: $COMMIT_MESSAGE"
    echo "  - Fichiers: $FILE_COUNT"
else
    log_error "Échec du commit. Restauration des versions..."
    
    # Restaurer les versions
    mv dev/package.json.backup dev/package.json
    mv package.json.backup package.json
    
    log_warning "Versions restaurées à $CURRENT_VERSION"
    exit 1
fi
