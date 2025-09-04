#!/bin/bash

# Script de commit ultra-rapide - ajoute tout et commit avec version automatique
# Usage: ./scripts/commit-all.sh [message]

set -e

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si on est dans un repo Git
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log_error "Ce répertoire n'est pas un repository Git"
    exit 1
fi

# Récupérer le message personnalisé
CUSTOM_MESSAGE=${1:-""}

# Ajouter tous les fichiers modifiés
log_info "Ajout de tous les fichiers modifiés..."
git add .

# Vérifier s'il y a des changements
if [ -z "$(git diff --cached --name-only)" ]; then
    log_error "Aucun changement à commiter"
    exit 1
fi

# Récupérer la version actuelle
CURRENT_VERSION=$(node -p "require('./dev/package.json').version")

# Calculer la nouvelle version (patch par défaut)
NEW_VERSION=$(node -e "
const version = '$CURRENT_VERSION';
const parts = version.split('.').map(Number);
parts[2]++;
console.log(parts.join('.'));
")

log_info "Version: $CURRENT_VERSION → $NEW_VERSION"

# Générer le message de commit
if [ -n "$CUSTOM_MESSAGE" ]; then
    COMMIT_MESSAGE="[v$NEW_VERSION] $CUSTOM_MESSAGE"
else
    # Compter les fichiers modifiés
    FILE_COUNT=$(git diff --cached --name-only | wc -l)
    COMMIT_MESSAGE="[v$NEW_VERSION] feat: Mise à jour ($FILE_COUNT fichiers)"
fi

log_info "Message: $COMMIT_MESSAGE"

# Sauvegarder les versions actuelles
cp dev/package.json dev/package.json.backup
cp package.json package.json.backup

# Mettre à jour les versions
node -e "
const fs = require('fs');
const newVersion = '$NEW_VERSION';

const devPackage = JSON.parse(fs.readFileSync('dev/package.json', 'utf8'));
devPackage.version = newVersion;
fs.writeFileSync('dev/package.json', JSON.stringify(devPackage, null, 2) + '\n');

const prodPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
prodPackage.version = newVersion;
fs.writeFileSync('package.json', JSON.stringify(prodPackage, null, 2) + '\n');
"

# Ajouter les fichiers de version
git add dev/package.json package.json

# Commit
log_info "Commit en cours..."
if git commit -m "$COMMIT_MESSAGE"; then
    log_success "Commit réussi ! Version $NEW_VERSION"
    rm -f dev/package.json.backup package.json.backup
else
    log_error "Échec du commit. Restauration..."
    mv dev/package.json.backup dev/package.json
    mv package.json.backup package.json
    exit 1
fi
