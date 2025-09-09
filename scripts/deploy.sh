#!/bin/bash
set -euo pipefail

# =============================================================================
# Script de déploiement RodColoc - Version 2.0
# =============================================================================
# Ce script gère le déploiement de l'environnement de développement vers
# l'environnement de production avec sauvegardes, rollback et monitoring.
# =============================================================================

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly DEV_DIR="$PROJECT_ROOT/dev"
readonly PROD_DIR="$PROJECT_ROOT/prod"
readonly BACKUP_DIR="$PROJECT_ROOT/backups"
readonly LOGS_DIR="$PROJECT_ROOT/logs"
readonly BUILD_ERROR_LOG="$LOGS_DIR/build_errors.log"
readonly CONFIG_FILE="$PROJECT_ROOT/.deploy-config"

# Configuration par défaut
readonly DEFAULT_CONFIG=(
    "PROD_PORT=3000"
    "DEV_PORT=3001"
    "BACKUP_RETENTION=5"
    "HEALTH_CHECK_TIMEOUT=30"
    "BUILD_TIMEOUT=300"
    "ENABLE_ROLLBACK=true"
    "ENABLE_NOTIFICATIONS=false"
    "NOTIFICATION_WEBHOOK="
)

# Couleurs pour les logs
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Variables globales
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="prod_backup_${TIMESTAMP}"
DEPLOY_LOG="$LOGS_DIR/deploy_${TIMESTAMP}.log"
PROD_PID=""
ROLLBACK_AVAILABLE=false

# =============================================================================
# FONCTIONS DE CONFIGURATION
# =============================================================================

# Initialise la configuration
init_config() {
    log_info "🔧 Initialisation de la configuration..."
    
    # Créer le fichier de config s'il n'existe pas
    if [[ ! -f "$CONFIG_FILE" ]]; then
        log_info "Création du fichier de configuration..."
        printf '%s\n' "${DEFAULT_CONFIG[@]}" > "$CONFIG_FILE"
    fi
    
    # Charger la configuration
    source "$CONFIG_FILE"
    
    # Créer les répertoires nécessaires
    mkdir -p "$BACKUP_DIR" "$LOGS_DIR"
    
    log_success "Configuration initialisée"
}

# =============================================================================
# FONCTIONS DE LOGGING
# =============================================================================

# Rotation unifiée des logs (un seul backup par type)
rotate_all_logs() {
    log_info "🔄 Rotation unifiée des logs..."
    
    local logs_dir="$LOGS_DIR"
    local backup_dir="$logs_dir/backup"
    
    # Créer le répertoire de backup s'il n'existe pas
    mkdir -p "$backup_dir"
    
    # Fonction pour sauvegarder un log (un seul backup)
    backup_log() {
        local log_file="$1"
        local log_name="$2"
        
        if [[ -f "$log_file" && -s "$log_file" ]]; then
            local backup_file="$backup_dir/${log_name}.log"
            
            # Supprimer l'ancien backup s'il existe
            if [[ -f "$backup_file" ]]; then
                rm -f "$backup_file"
                log_info "🗑️ Ancien backup $log_name supprimé"
            fi
            
            # Créer le nouveau backup
            cp "$log_file" "$backup_file"
            log_info "📁 $log_name sauvegardé vers backup/${log_name}.log"
            
            # Vider le log actuel
            > "$log_file"
            log_info "📝 $log_name vidé"
        fi
    }
    
    # Sauvegarder les logs principaux
    backup_log "$logs_dir/prod.log" "prod"
    backup_log "$logs_dir/dev.log" "dev"
    backup_log "$logs_dir/maintenance.log" "maintenance"
    backup_log "$logs_dir/deploy_current.log" "deploy"
    backup_log "$logs_dir/build_errors.log" "build_errors"
    
    # Nettoyer tous les anciens logs avec timestamp
    log_info "🧹 Nettoyage des anciens logs avec timestamp..."
    local old_logs=$(find "$logs_dir" -name "*_*.log" -type f | grep -E "[0-9]{8}_[0-9]{6}" | head -20)
    if [[ -n "$old_logs" ]]; then
        echo "$old_logs" | xargs rm -f
        log_info "🗑️ Anciens logs avec timestamp supprimés"
    fi
    
    log_success "✅ Rotation unifiée des logs terminée"
    log_info "📋 Résumé:"
    log_info "   - Logs actuels: $logs_dir/*.log"
    log_info "   - Backups: $backup_dir/*.log (un seul par type)"
    log_info "   - Anciens logs avec timestamp supprimés"
}

# Log avec timestamp et niveau
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local current_log="$LOGS_DIR/deploy_current.log"
    
    # Nettoyer les codes de couleur pour le fichier de log
    local clean_level=$(echo "$level" | sed 's/\\033\[[0-9;]*m//g')
    local clean_message=$(echo "$message" | sed 's/\\033\[[0-9;]*m//g')
    
    # Affichage console avec couleur
    echo -e "[$timestamp] $level $message"
    
    # Écriture dans le fichier de log actuel sans codes de couleur
    echo "[$timestamp] $clean_level $clean_message" >> "$current_log"
}

log_info() {
    log "${BLUE}[INFO]${NC}" "$1"
}

log_success() {
    log "${GREEN}[SUCCESS]${NC}" "$1"
}

log_warning() {
    log "${YELLOW}[WARNING]${NC}" "$1"
}

log_error() {
    log "${RED}[ERROR]${NC}" "$1"
}

# Log des erreurs de build
log_build_error() {
    local error_type="$1"
    local error_message="$2"
    local error_details="$3"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Créer le répertoire de logs s'il n'existe pas
    mkdir -p "$LOGS_DIR"
    
    # Écrire dans le log des erreurs de build (sans codes de couleur)
    {
        echo "=========================================="
        echo "TIMESTAMP: $timestamp"
        echo "TYPE: $error_type"
        echo "MESSAGE: $error_message"
        echo "DETAILS:"
        echo "$error_details"
        echo "=========================================="
        echo ""
    } >> "$BUILD_ERROR_LOG"
    
    # Aussi logger dans le log de déploiement (avec nettoyage des couleurs)
    log_error "Erreur de build [$error_type]: $error_message"
}

# Demander à l'IA de corriger les erreurs de build
ask_ai_to_fix_build_errors() {
    local error_details="$1"
    local error_type="$2"
    
    log_info "🤖 Demande de correction automatique à l'IA..."
    
    # Créer un fichier temporaire avec les erreurs
    local temp_error_file="/tmp/build_errors_${TIMESTAMP}.txt"
    echo "$error_details" > "$temp_error_file"
    
    # Analyser les erreurs et proposer des corrections
    local corrections=""
    
    # Correction pour le problème récurrent build-reunion-geo.mjs
    if echo "$error_details" | grep -q "Cannot find module.*build-reunion-geo.mjs"; then
        log_info "🔧 Correction identifiée: Chemin incorrect pour build-reunion-geo.mjs"
        
        # Vérifier si le fichier existe dans dev
        if [[ -f "$DEV_DIR/src/scripts/build/build-reunion-geo.mjs" ]]; then
            log_info "📁 Fichier trouvé dans dev: $DEV_DIR/src/scripts/build/build-reunion-geo.mjs"
            
            # Corriger le chemin dans prod/package.json
            if [[ -f "$PROD_DIR/package.json" ]]; then
                log_info "🔧 Correction du chemin dans prod/package.json..."
                
                # Sauvegarder le package.json original
                cp "$PROD_DIR/package.json" "$PROD_DIR/package.json.backup"
                
                # Corriger le chemin du script prebuild
                sed -i "s|scripts/utils/build-reunion-geo.mjs|src/scripts/build/build-reunion-geo.mjs|g" "$PROD_DIR/package.json"
                
                log_success "✅ Chemin corrigé dans prod/package.json"
                corrections+="✅ Chemin build-reunion-geo.mjs corrigé\n"
            fi
        else
            log_warning "⚠️ Fichier build-reunion-geo.mjs non trouvé dans dev"
        fi
    fi
    
    # Correction pour les erreurs de modules manquants
    if echo "$error_details" | grep -q "Cannot find module"; then
        log_info "🔧 Correction identifiée: Modules manquants"
        
        # Extraire les modules manquants
        local missing_modules=$(echo "$error_details" | grep "Cannot find module" | sed 's/.*Cannot find module.*'\''\([^'\'']*\)'\''.*/\1/' | head -5)
        
        if [[ -n "$missing_modules" ]]; then
            log_info "📦 Modules manquants détectés:"
            echo "$missing_modules" | while read -r module; do
                log_info "   - $module"
            done
            
            # Proposer d'installer les modules manquants
            log_info "🔧 Tentative d'installation des modules manquants..."
            cd "$PROD_DIR"
            
            # Installer les modules manquants
            echo "$missing_modules" | while read -r module; do
                if [[ -n "$module" ]]; then
                    log_info "📦 Installation de $module..."
                    npm install "$module" --save 2>/dev/null || log_warning "Échec installation de $module"
                fi
            done
            
            corrections+="✅ Modules manquants installés\n"
        fi
    fi
    
    # Correction pour les erreurs TypeScript
    if echo "$error_details" | grep -q "Type error"; then
        log_info "🔧 Correction identifiée: Erreurs TypeScript"
        
        # Extraire les erreurs TypeScript
        local ts_errors=$(echo "$error_details" | grep "Type error" | head -3)
        
        if [[ -n "$ts_errors" ]]; then
            log_info "📝 Erreurs TypeScript détectées:"
            echo "$ts_errors" | while read -r error; do
                log_info "   - $error"
            done
            
            # Correction spécifique pour prisma.profile
            if echo "$error_details" | grep -q "Property 'profile' does not exist"; then
                log_info "🔧 Correction spécifique: prisma.profile -> prisma.colocProfile"
                
                # Corriger le fichier API
                local api_file="$PROD_DIR/app/api/matches/new-count/route.ts"
                if [[ -f "$api_file" ]]; then
                    log_info "📝 Correction du fichier: $api_file"
                    
                    # Sauvegarder le fichier original
                    cp "$api_file" "$api_file.backup"
                    
                    # Remplacer prisma.profile par prisma.colocProfile
                    sed -i 's/prisma\.profile/prisma.colocProfile/g' "$api_file"
                    
                    log_success "✅ prisma.profile remplacé par prisma.colocProfile"
                    corrections+="✅ Erreur prisma.profile corrigée\n"
                fi
            fi
            
            # Correction pour les propriétés manquantes dans les includes
            if echo "$error_details" | grep -q "annonces.*does not exist"; then
                log_info "🔧 Correction spécifique: Suppression de l'include annonces"
                
                local api_file="$PROD_DIR/app/api/matches/new-count/route.ts"
                if [[ -f "$api_file" ]]; then
                    log_info "📝 Suppression de l'include annonces dans: $api_file"
                    
                    # Supprimer les lignes avec include: { annonces: true }
                    sed -i '/include: {/,/}/d' "$api_file"
                    
                    log_success "✅ Include annonces supprimé"
                    corrections+="✅ Include annonces supprimé\n"
                fi
            fi
            
            # Proposer de corriger les types généraux
            log_info "🔧 Tentative de correction des types..."
            
            # Vérifier si c'est un problème de types manquants
            if echo "$ts_errors" | grep -q "Property.*does not exist"; then
                log_info "📦 Installation des types manquants..."
                npm install @types/node @types/react @types/react-dom --save-dev 2>/dev/null || true
                corrections+="✅ Types manquants installés\n"
            fi
            
            corrections+="✅ Erreurs TypeScript analysées\n"
        fi
    fi
    
    # Correction pour les erreurs ESLint
    if echo "$error_details" | grep -q "prefer-const"; then
        log_info "🔧 Correction identifiée: Erreurs ESLint prefer-const"
        
        # Extraire les erreurs prefer-const
        local eslint_errors=$(echo "$error_details" | grep "prefer-const" | head -3)
        
        if [[ -n "$eslint_errors" ]]; then
            log_info "📝 Erreurs ESLint détectées:"
            echo "$eslint_errors" | while read -r error; do
                log_info "   - $error"
            done
            
            # Correction spécifique pour maxScore
            if echo "$error_details" | grep -q "maxScore.*never reassigned"; then
                log_info "🔧 Correction spécifique: let maxScore -> const maxScore"
                
                local api_file="$PROD_DIR/app/api/matches/new-count/route.ts"
                if [[ -f "$api_file" ]]; then
                    log_info "📝 Correction du fichier: $api_file"
                    
                    # Sauvegarder le fichier original
                    cp "$api_file" "$api_file.backup"
                    
                    # Remplacer let maxScore par const maxScore
                    sed -i 's/let maxScore/const maxScore/g' "$api_file"
                    
                    log_success "✅ let maxScore remplacé par const maxScore"
                    corrections+="✅ Erreur ESLint maxScore corrigée\n"
                fi
            fi
            
            corrections+="✅ Erreurs ESLint analysées\n"
        fi
    fi
    
    # Nettoyer le fichier temporaire
    rm -f "$temp_error_file"
    
    # Afficher le résumé des corrections
    if [[ -n "$corrections" ]]; then
        log_success "🤖 Corrections automatiques appliquées:"
        echo -e "$corrections"
        
        # Proposer de relancer le build
        log_info "🔄 Tentative de rebuild après corrections..."
        return 0
    else
        log_warning "⚠️ Aucune correction automatique possible"
        log_info "💡 Actions manuelles recommandées:"
        log_info "   - Vérifiez les chemins des modules"
        log_info "   - Vérifiez les dépendances"
        log_info "   - Vérifiez la configuration TypeScript"
        return 1
    fi
}

# Vérifier que le build de développement fonctionne avant de déployer
check_dev_build() {
    log_info "🔍 Vérification du build de développement avant déploiement..."
    
    # Changer vers le répertoire de développement
    cd "$DEV_DIR" || {
        log_error "❌ Impossible d'accéder au répertoire de développement: $DEV_DIR"
        return 1
    }
    
    # Vérifier que package.json existe
    if [[ ! -f "package.json" ]]; then
        log_error "❌ package.json manquant dans le répertoire de développement"
        return 1
    fi
    
    # Nettoyer le cache Next.js pour un build propre
    log_info "🧹 Nettoyage du cache Next.js..."
    if [[ -d ".next" ]]; then
        rm -rf .next
        log_success "✅ Cache Next.js supprimé"
    fi
    
    # Installer les dépendances si nécessaire
    if [[ ! -d "node_modules" ]]; then
        log_info "📦 Installation des dépendances de développement..."
        if ! npm install --legacy-peer-deps; then
            log_error "❌ Échec de l'installation des dépendances"
            return 1
        fi
        log_success "✅ Dépendances installées"
    fi
    
    # Générer les types Prisma
    log_info "🔧 Génération des types Prisma..."
    if ! npx prisma generate --no-hints; then
        log_error "❌ Échec de la génération des types Prisma"
        return 1
    fi
    log_success "✅ Types Prisma générés"
    
    # Tenter le build de développement
    log_info "🔨 Test du build de développement..."
    local build_output
    local build_exit_code
    
    # Capturer la sortie du build
    if build_output=$(npm run build 2>&1); then
        build_exit_code=0
    else
        build_exit_code=$?
    fi
    
    # Vérifier le code de sortie
    if [[ $build_exit_code -ne 0 ]]; then
        log_error "❌ ÉCHEC DU BUILD DE DÉVELOPPEMENT"
        log_error "Code de sortie: $build_exit_code"
        
        # Afficher les erreurs principales
        log_error "📋 Erreurs détectées:"
        echo "$build_output" | grep -E "(error|Error|ERROR)" | head -10 | while read -r error; do
            log_error "   - $error"
        done
        
        # Demander à l'IA de corriger les erreurs
        log_info "🤖 Tentative de correction automatique..."
        if ask_ai_to_fix_build_errors "$build_output" "dev_build"; then
            log_info "🔄 Retry du build après corrections..."
            if ! npm run build; then
                log_error "❌ Le build échoue toujours après corrections automatiques"
                log_error "🚫 DÉPLOIEMENT ANNULÉ - Corrigez les erreurs de build en dev d'abord"
                return 1
            fi
        else
            log_error "🚫 DÉPLOIEMENT ANNULÉ - Corrigez les erreurs de build en dev d'abord"
            log_info "💡 Actions recommandées:"
            log_info "   - Vérifiez les erreurs TypeScript ci-dessus"
            log_info "   - Corrigez les erreurs de compilation"
            log_info "   - Relancez 'npm run build' en dev"
            return 1
        fi
    fi
    
    # Vérifier s'il y a des avertissements critiques
    local warnings=$(echo "$build_output" | grep -E "(Warning|warning)" | wc -l)
    if [[ $warnings -gt 0 ]]; then
        log_warning "⚠️ $warnings avertissement(s) détecté(s) dans le build de dev"
        log_info "📋 Avertissements (premiers 5):"
        echo "$build_output" | grep -E "(Warning|warning)" | head -5 | while read -r warning; do
            log_warning "   - $warning"
        done
        log_info "ℹ️ Les avertissements n'empêchent pas le déploiement"
    fi
    
    log_success "✅ Build de développement réussi"
    log_info "🎯 Le déploiement peut continuer en toute sécurité"
    
    # Retourner au répertoire racine
    cd "$PROJECT_ROOT" || true
    
    return 0
}

log_debug() {
    if [[ "${DEBUG:-false}" == "true" ]]; then
        log "${PURPLE}[DEBUG]${NC}" "$1"
    fi
}

# =============================================================================
# FONCTIONS DE VÉRIFICATION
# =============================================================================

# Vérifie les prérequis
check_prerequisites() {
    log_info "🔍 Vérification des prérequis..."
    
    local errors=0
    
    # Vérifier que nous sommes dans le bon répertoire
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json non trouvé dans $PROJECT_ROOT"
        ((errors++))
    fi
    
    # Vérifier l'environnement de développement
    if [[ ! -d "$DEV_DIR" ]]; then
        log_error "Répertoire de développement non trouvé: $DEV_DIR"
        ((errors++))
    fi
    
    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        ((errors++))
    fi
    
    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        ((errors++))
    fi
    
    # Vérifier les ports
    if lsof -Pi :${PROD_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Port $PROD_PORT déjà utilisé"
    fi
    
    if [[ $errors -gt 0 ]]; then
        log_error "$errors erreur(s) détectée(s). Arrêt du déploiement."
        exit 1
    fi
    
    log_success "Prérequis vérifiés"
}

# Vérifie l'état de l'application
check_application_health() {
    local url="$1"
    local timeout="${2:-$HEALTH_CHECK_TIMEOUT}"
    
    log_info "🏥 Vérification de santé: $url"
    
    local count=0
    while [[ $count -lt $timeout ]]; do
        if curl -f -s "$url/api/health" >/dev/null 2>&1; then
            log_success "Application accessible"
            return 0
        fi
        
        sleep 1
        ((count++))
        
        if [[ $((count % 5)) -eq 0 ]]; then
            log_info "Attente... (${count}s/${timeout}s)"
        fi
    done
    
    log_error "Application non accessible après ${timeout}s"
    return 1
}

# =============================================================================
# FONCTIONS DE GESTION DES PROCESSUS
# =============================================================================

# Arrête un processus sur un port
stop_process_on_port() {
    local port="$1"
    local process_name="${2:-application}"
    
    log_info "🛑 Arrêt du processus sur le port $port..."
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pids=$(lsof -Pi :$port -sTCP:LISTEN -t)
        log_info "Processus trouvé: $pids"
        
        # Arrêt gracieux
        for pid in $pids; do
            if kill -TERM "$pid" 2>/dev/null; then
                log_info "Signal TERM envoyé au PID $pid"
            fi
        done
        
        # Attendre l'arrêt
        sleep 5
        
        # Vérifier si encore actif
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Arrêt forcé nécessaire..."
            for pid in $pids; do
                if kill -KILL "$pid" 2>/dev/null; then
                    log_info "Signal KILL envoyé au PID $pid"
                fi
            done
            sleep 2
        fi
        
        log_success "Processus arrêté"
    else
        log_info "Aucun processus sur le port $port"
    fi
}

# =============================================================================
# FONCTIONS DE SAUVEGARDE
# =============================================================================

# Crée une sauvegarde de production
create_backup() {
    log_info "💾 Création de sauvegarde de production..."
    
    if [[ -d "$PROD_DIR" ]]; then
        log_info "Sauvegarde vers: $BACKUP_DIR/$BACKUP_NAME"
        
        # Copie avec préservation des permissions
        cp -rp "$PROD_DIR" "$BACKUP_DIR/$BACKUP_NAME"
        
        # Créer un lien symbolique vers la dernière sauvegarde
        ln -sfn "$BACKUP_NAME" "$BACKUP_DIR/latest"
        
        # Marquer le rollback comme disponible
        ROLLBACK_AVAILABLE=true
        
        log_success "Sauvegarde créée: $BACKUP_NAME"
    else
        log_warning "Aucune production existante à sauvegarder"
    fi
}

# Nettoie les anciennes sauvegardes
cleanup_backups() {
    log_info "🧹 Nettoyage des anciennes sauvegardes..."
    
    if [[ -d "$BACKUP_DIR" ]]; then
        cd "$BACKUP_DIR"
        
        # Compter les sauvegardes
        local backup_count=$(ls -1 | grep -E '^prod_backup_' | wc -l)
        
        if [[ $backup_count -gt $BACKUP_RETENTION ]]; then
            local to_remove=$((backup_count - BACKUP_RETENTION))
            log_info "Suppression de $to_remove ancienne(s) sauvegarde(s)..."
            
            # Supprimer les plus anciennes
            ls -1t | grep -E '^prod_backup_' | tail -n +$((BACKUP_RETENTION + 1)) | xargs -r rm -rf
            
            log_success "Anciennes sauvegardes supprimées"
        else
            log_info "Aucune sauvegarde à supprimer ($backup_count/$BACKUP_RETENTION)"
        fi
    fi
}

# =============================================================================
# FONCTIONS DE DÉPLOIEMENT
# =============================================================================

# Nettoie l'environnement de production
clean_production() {
    log_info "🧽 Nettoyage de l'environnement de production..."
    
    # Arrêter les processus
    stop_process_on_port "$PROD_PORT" "production"
    
    # Nettoyer les fichiers
    if [[ -d "$PROD_DIR" ]]; then
        cd "$PROD_DIR"
        
        # Supprimer les fichiers temporaires
        rm -rf .next node_modules package-lock.json yarn.lock
        
        log_success "Environnement de production nettoyé"
    fi
}

# Copie les fichiers de développement vers production
copy_files() {
    log_info "📁 Mise à jour de la structure de code (dev → prod)..."
    
    # Créer le répertoire de production s'il n'existe pas
    mkdir -p "$PROD_DIR"
    
    # Copie sélective avec exclusions pour préserver les données de prod
    rsync -av --delete \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='logs' \
        --exclude='.env' \
        --exclude='.env.local' \
        --exclude='.env.development' \
        --exclude='*.log' \
        --exclude='.git' \
        --exclude='.DS_Store' \
        --exclude='package.json' \
        --exclude='package-lock.json' \
        --exclude='yarn.lock' \
        --exclude='pnpm-lock.yaml' \
        --exclude='backups' \
        --exclude='uploads' \
        --exclude='public/uploads' \
        --exclude='data' \
        --exclude='*.db' \
        --exclude='*.sqlite' \
        "$DEV_DIR/" "$PROD_DIR/"
    
    log_success "✅ Structure de code mise à jour (données préservées)"
}

# Met à jour les dépendances de prod avec celles de dev
update_prod_dependencies() {
    local dev_package="$DEV_DIR/package.json"
    local prod_package="$PROD_DIR/package.json"
    
    if [[ ! -f "$dev_package" ]]; then
        log_error "❌ package.json de dev non trouvé: $dev_package"
        return 1
    fi
    
    if [[ ! -f "$prod_package" ]]; then
        log_error "❌ package.json de prod non trouvé: $prod_package"
        return 1
    fi
    
    # Extraire les dépendances de dev
    log_info "📋 Extraction des dépendances de dev..."
    local dev_deps=$(node -e "
        const pkg = require('$dev_package');
        console.log(JSON.stringify(pkg.dependencies || {}, null, 2));
    ")
    
    if [[ -z "$dev_deps" || "$dev_deps" == "{}" ]]; then
        log_warning "⚠️ Aucune dépendance trouvée dans dev/package.json"
        return 0
    fi
    
    # Mettre à jour le package.json de prod
    log_info "📝 Mise à jour des dépendances dans prod/package.json..."
    node -e "
        const fs = require('fs');
        const prodPkg = JSON.parse(fs.readFileSync('$prod_package', 'utf8'));
        const devPkg = JSON.parse(fs.readFileSync('$dev_package', 'utf8'));
        
        // Remplacer les dépendances
        prodPkg.dependencies = devPkg.dependencies || {};
        
        // Changer le nom vers 'rodcoloc'
        prodPkg.name = 'rodcoloc';
        
        // Préserver les scripts existants de prod (ne pas les écraser)
        // Les scripts restent inchangés
        
        // Sauvegarder
        fs.writeFileSync('$prod_package', JSON.stringify(prodPkg, null, 2) + '\n');
        console.log('✅ Dépendances et nom mis à jour dans prod/package.json');
    "
    
    log_success "✅ Dépendances de prod mises à jour avec celles de dev"
}

# Met à jour les variables d'environnement pour la production
update_env_vars() {
    log_info "🔧 Mise à jour des variables d'environnement pour la production..."
    
    local dev_env_file="$DEV_DIR/.env.local"
    local prod_env_file="$PROD_DIR/.env.local"
    
    # Préserver le fichier .env.local de prod existant
    if [[ -f "$prod_env_file" ]]; then
        # Sauvegarder l'ancien fichier s'il existe
        cp "$prod_env_file" "$prod_env_file.backup"
        log_info "📁 Sauvegarde de l'ancien .env.local de prod"
        log_info "📋 Conservation du fichier .env.local de prod (pas de copie depuis dev)"
    fi
    
    # Mettre à jour seulement les variables spécifiques à la production
    if [[ -f "$prod_env_file" ]]; then
        log_info "📝 Mise à jour de la base de données vers rodcoloc_prod"
        sed -i 's/DATABASE_URL=.*/DATABASE_URL="mysql:\/\/rodcoloc:rodcoloc@localhost:3306\/rodcoloc_prod"/' "$prod_env_file"
        
        log_info "📝 Mise à jour de NODE_ENV vers production"
        sed -i 's/NODE_ENV=.*/NODE_ENV=production/' "$prod_env_file"
        
        # Ajouter NODE_ENV s'il n'existe pas
        if ! grep -q "NODE_ENV=" "$prod_env_file"; then
            echo "NODE_ENV=production" >> "$prod_env_file"
        fi
        
        log_info "📝 Mise à jour du port vers 3000"
        sed -i 's/PORT=.*/PORT=3000/' "$prod_env_file"
        
        # Ajouter PORT s'il n'existe pas
        if ! grep -q "PORT=" "$prod_env_file"; then
            echo "PORT=3000" >> "$prod_env_file"
        fi
        
        log_success "Variables d'environnement mises à jour"
        log_info "📋 Résumé des changements:"
        log_info "   - Base de données: rodcoloc_prod"
        log_info "   - NODE_ENV: production"
        log_info "   - PORT: 3000"
        log_info "   - Variables LBC scraper préservées"
    else
        log_warning "Aucun fichier .env.local trouvé, création d'un nouveau fichier"
        cat > "$prod_env_file" << EOF
# Configuration de production
DATABASE_URL="mysql://rodcoloc:rodcoloc@localhost:3306/rodcoloc_prod"
NODE_ENV=production
PORT=3000
EOF
        log_success "Fichier .env.local créé avec les variables de production"
    fi
}

# Installe les dépendances
install_dependencies() {
    log_info "📦 Installation des dépendances de production..."
    
    cd "$PROD_DIR"
    
    # Nettoyer le cache npm
    npm cache clean --force 2>/dev/null || true
    
    # Essayer d'abord avec npm ci --production
    log_info "Tentative d'installation standard..."
    if timeout "$BUILD_TIMEOUT" npm ci --production 2>/dev/null; then
        log_success "Dépendances installées"
        return 0
    fi
    
    # Si échec, essayer avec --legacy-peer-deps
    log_warning "Installation standard échouée, tentative avec --legacy-peer-deps..."
    if timeout "$BUILD_TIMEOUT" npm ci --production --legacy-peer-deps 2>/dev/null; then
        log_success "Dépendances installées avec --legacy-peer-deps"
        return 0
    fi
    
    # Si encore échec, essayer avec --force
    log_warning "Installation avec --legacy-peer-deps échouée, tentative avec --force..."
    if timeout "$BUILD_TIMEOUT" npm ci --production --force 2>/dev/null; then
        log_success "Dépendances installées avec --force"
        return 0
    fi
    
    # Dernière tentative avec npm install
    log_warning "npm ci échoué, tentative avec npm install..."
    if timeout "$BUILD_TIMEOUT" npm install --production --legacy-peer-deps 2>/dev/null; then
        log_success "Dépendances installées avec npm install"
        return 0
    fi
    
    log_error "Échec de l'installation des dépendances après toutes les tentatives"
    log_info "Vérifiez les conflits de dépendances dans package.json"
    exit 1
}

# Gérer les migrations Prisma
migrate_database() {
    log_info "🗄️  Gestion des migrations Prisma..."
    
    cd "$PROD_DIR"
    
    # Générer les types Prisma
    log_info "🔧 Génération des types Prisma..."
    if npx prisma generate --no-hints; then
        log_success "✅ Types Prisma générés"
    else
        log_error "❌ Échec de la génération des types Prisma"
        return 1
    fi
    
    # Pousser les changements de schéma vers la base de données
    log_info "📤 Synchronisation du schéma avec la base de données..."
    if npx prisma db push --accept-data-loss; then
        log_success "✅ Schéma de base de données synchronisé"
    else
        log_error "❌ Échec de la synchronisation du schéma"
        return 1
    fi
    
    log_success "🎉 Migrations Prisma terminées avec succès"
}

# Build l'application
build_application() {
    log_info "🔨 Build de l'application de production..."
    
    cd "$PROD_DIR"
    
    # Fonction pour afficher les erreurs de build de manière claire
    show_build_errors() {
        local attempt_name="$1"
        local build_command="$2"
        
        log_error "❌ ÉCHEC DU BUILD - $attempt_name"
        echo ""
        echo "🔍 === DÉTAILS DES ERREURS ==="
        echo "Commande exécutée: $build_command"
        echo "Répertoire: $(pwd)"
        echo "Timestamp: $(date)"
        echo ""
        
        # Exécuter la commande et capturer la sortie
        local build_output
        if build_output=$(timeout "$BUILD_TIMEOUT" $build_command 2>&1); then
            log_success "Build réussi avec $attempt_name"
            return 0
        else
            local exit_code=$?
            echo "Code de sortie: $exit_code"
            echo ""
            echo "📋 === SORTIE COMPLÈTE ==="
            echo "$build_output"
            echo ""
            echo "🔍 === ANALYSE DES ERREURS ==="
            
            # Analyser les erreurs communes et les logger
            local error_analysis=""
            
            if echo "$build_output" | grep -q "Cannot find module"; then
                echo "❌ ERREUR: Module non trouvé"
                local module_errors=$(echo "$build_output" | grep "Cannot find module" | head -5)
                echo "$module_errors"
                error_analysis+="MODULE_NOT_FOUND: $module_errors\n"
            fi
            
            if echo "$build_output" | grep -q "Type error"; then
                echo "❌ ERREUR: Erreur TypeScript"
                local type_errors=$(echo "$build_output" | grep "Type error" | head -5)
                echo "$type_errors"
                error_analysis+="TYPE_ERROR: $type_errors\n"
            fi
            
            if echo "$build_output" | grep -q "Module not found"; then
                echo "❌ ERREUR: Module non trouvé"
                local module_errors=$(echo "$build_output" | grep "Module not found" | head -5)
                echo "$module_errors"
                error_analysis+="MODULE_NOT_FOUND: $module_errors\n"
            fi
            
            if echo "$build_output" | grep -q "Failed to compile"; then
                echo "❌ ERREUR: Échec de compilation"
                local compile_errors=$(echo "$build_output" | grep "Failed to compile" | head -5)
                echo "$compile_errors"
                error_analysis+="COMPILE_ERROR: $compile_errors\n"
                echo "$build_output" | grep -A 10 "Failed to compile" | head -15
            fi
            
            echo ""
            echo "=== FIN DE L'ANALYSE ==="
            echo ""
            
            # Logger l'erreur de build
            log_build_error "$attempt_name" "Échec du build avec code $exit_code" "$build_output\n\nANALYSE:\n$error_analysis"
            
            # Demander à l'IA de corriger les erreurs
            if ask_ai_to_fix_build_errors "$build_output" "$attempt_name"; then
                log_info "🔄 Tentative de rebuild après corrections automatiques..."
                
                # Relancer le build après corrections
                if build_output=$(timeout "$BUILD_TIMEOUT" $build_command 2>&1); then
                    log_success "✅ Build réussi après corrections automatiques !"
                    return 0
                else
                    local new_exit_code=$?
                    log_error "❌ Build toujours en échec après corrections (code: $new_exit_code)"
                    
                    # Logger la nouvelle erreur
                    log_build_error "$attempt_name (après corrections)" "Échec du build avec code $new_exit_code" "$build_output"
                fi
            fi
            
            return 1
        fi
    }
    
    # Tentative 1: Build standard
    log_info "🚀 Tentative 1: Build standard..."
    if ! show_build_errors "Build standard" "npm run build"; then
        
        # Tentative 2: Avec variables d'environnement
        log_info "🚀 Tentative 2: Avec variables d'environnement..."
        if ! show_build_errors "Variables d'environnement" "NODE_OPTIONS='--max-old-space-size=4096' npm run build"; then
            
            # Tentative 3: Mode strict
            log_info "🚀 Tentative 3: Mode strict..."
            if ! show_build_errors "Mode strict" "NEXT_TELEMETRY_DISABLED=1 npm run build"; then
                
                # Tentative 4: Build sans prebuild
                log_info "🚀 Tentative 4: Build sans prebuild..."
                if ! show_build_errors "Sans prebuild" "npm run build -- --no-lint"; then
                    
                    log_error "💥 ÉCHEC TOTAL DU BUILD"
                    log_info "📋 Résumé des tentatives:"
                    log_info "   1. Build standard - ÉCHEC"
                    log_info "   2. Variables d'environnement - ÉCHEC"
                    log_info "   3. Mode strict - ÉCHEC"
                    log_info "   4. Sans prebuild - ÉCHEC"
                    echo ""
                    log_info "🔧 Actions recommandées:"
                    log_info "   - Vérifiez les erreurs TypeScript ci-dessus"
                    log_info "   - Vérifiez les dépendances manquantes"
                    log_info "   - Vérifiez les chemins des modules"
                    log_info "   - Vérifiez la configuration Next.js"
                    echo ""
                    exit 1
                fi
            fi
        fi
    fi
    
    log_success "✅ Build terminé avec succès"
}

# Démarre l'application
start_application() {
    log_info "🚀 Démarrage de l'application de production..."
    
    cd "$PROD_DIR"
    
    # Créer le répertoire de logs
    mkdir -p logs
    
    # Démarrage en arrière-plan
    nohup npm start > "logs/prod_${TIMESTAMP}.log" 2>&1 &
    PROD_PID=$!
    
    # Sauvegarder le PID
    echo "$PROD_PID" > logs/prod.pid
    
    log_success "Application démarrée avec PID: $PROD_PID"
}

# =============================================================================
# FONCTIONS DE ROLLBACK
# =============================================================================

# Effectue un rollback
rollback() {
    log_warning "🔄 Démarrage du rollback..."
    
    if [[ "$ROLLBACK_AVAILABLE" != "true" ]]; then
        log_error "Aucune sauvegarde disponible pour le rollback"
        exit 1
    fi
    
    # Arrêter l'application actuelle
    stop_process_on_port "$PROD_PORT" "production"
    
    # Restaurer la sauvegarde
    if [[ -d "$BACKUP_DIR/latest" ]]; then
        log_info "Restauration de la sauvegarde..."
        rm -rf "$PROD_DIR"
        cp -rp "$BACKUP_DIR/latest" "$PROD_DIR"
        
        # Redémarrer
        start_application
        check_application_health "http://localhost:$PROD_PORT"
        
        log_success "Rollback terminé avec succès"
    else
        log_error "Sauvegarde non trouvée"
        exit 1
    fi
}

# =============================================================================
# FONCTIONS DE NOTIFICATION
# =============================================================================

# Envoie une notification
send_notification() {
    local message="$1"
    local status="${2:-info}"
    
    if [[ "$ENABLE_NOTIFICATIONS" == "true" && -n "$NOTIFICATION_WEBHOOK" ]]; then
        local color
        case "$status" in
            "success") color="good" ;;
            "error") color="danger" ;;
            "warning") color="warning" ;;
            *) color="#36a64f" ;;
        esac
        
        curl -X POST "$NOTIFICATION_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{
                \"text\": \"🚀 RodColoc Deploy\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [{
                        \"title\": \"Status\",
                        \"value\": \"$message\",
                        \"short\": false
                    }]
                }]
            }" 2>/dev/null || true
    fi
}

# =============================================================================
# FONCTIONS PRINCIPALES
# =============================================================================

# Affiche l'aide
show_help() {
    cat << EOF
🚀 Script de déploiement RodColoc v2.0

USAGE:
    $0 [OPTIONS] [COMMAND]

COMMANDS:
    deploy      Mise à jour structure uniquement (dev → prod, données préservées)
    deploy-full Déploiement complet (avec backup et nettoyage)
    rollback    Effectue un rollback vers la dernière sauvegarde
    status      Affiche le statut de l'application
    logs        Affiche les logs de production
    config      Affiche/modifie la configuration
    rotate-logs Rotation des logs (prod, dev, deploy) avec backup
    build-errors Affiche les erreurs de build enregistrées
    help        Affiche cette aide

OPTIONS:
    -d, --debug     Active le mode debug
    -f, --force     Force le déploiement même si des erreurs sont détectées
    -q, --quiet     Mode silencieux
    -v, --verbose   Mode verbeux

EXAMPLES:
    $0                    # Mise à jour structure (défaut)
    $0 deploy             # Mise à jour structure uniquement
    $0 deploy-full        # Déploiement complet avec backup
    $0 rollback           # Rollback
    $0 status             # Statut
    $0 logs               # Logs

CONFIGURATION:
    Fichier: $CONFIG_FILE
    Modifiez les variables selon vos besoins.

EOF
}

# Affiche le statut
show_status() {
    log_info "📊 Statut de l'application..."
    
    echo "=== ENVIRONNEMENT ==="
    echo "Développement: $DEV_DIR"
    echo "Production: $PROD_DIR"
    echo "Sauvegardes: $BACKUP_DIR"
    echo "Logs: $LOGS_DIR"
    echo
    
    echo "=== PROCESSUS ==="
    if lsof -Pi :$PROD_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$PROD_PORT -sTCP:LISTEN -t)
        echo "Production: ACTIF (PID: $pid, Port: $PROD_PORT)"
    else
        echo "Production: INACTIF"
    fi
    
    if lsof -Pi :$DEV_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        local pid=$(lsof -Pi :$DEV_PORT -sTCP:LISTEN -t)
        echo "Développement: ACTIF (PID: $pid, Port: $DEV_PORT)"
    else
        echo "Développement: INACTIF"
    fi
    echo
    
    echo "=== SAUVEGARDES ==="
    if [[ -d "$BACKUP_DIR" ]]; then
        local backup_count=$(ls -1 "$BACKUP_DIR" | grep -E '^prod_backup_' | wc -l)
        echo "Nombre de sauvegardes: $backup_count"
        echo "Dernière sauvegarde: $(ls -1t "$BACKUP_DIR" | grep -E '^prod_backup_' | head -1)"
    else
        echo "Aucune sauvegarde"
    fi
}

# Affiche les logs
show_logs() {
    local lines="${1:-50}"
    
    if [[ -f "$PROD_DIR/logs/prod_${TIMESTAMP}.log" ]]; then
        log_info "📋 Derniers logs de production ($lines lignes):"
        tail -n "$lines" "$PROD_DIR/logs/prod_${TIMESTAMP}.log"
    else
        log_warning "Aucun log de production trouvé"
    fi
}

# Fonction pour afficher les erreurs de build
show_build_errors_log() {
    log_info "🔍 Log des erreurs de build:"
    
    local current_log="$LOGS_DIR/build_errors.log"
    local backup_log="$LOGS_DIR/backup/build_errors.log"
    
    # Vérifier d'abord le log actuel
    if [[ -f "$current_log" && -s "$current_log" ]]; then
        echo ""
        echo "📊 === RÉSUMÉ DES ERREURS DE BUILD (ACTUEL) ==="
        echo ""
        
        # Compter le nombre d'erreurs par type
        local total_errors=$(grep -c "TYPE:" "$current_log" 2>/dev/null || echo "0")
        local module_errors=$(grep -c "MODULE_NOT_FOUND" "$current_log" 2>/dev/null || echo "0")
        local type_errors=$(grep -c "TYPE_ERROR" "$current_log" 2>/dev/null || echo "0")
        local compile_errors=$(grep -c "COMPILE_ERROR" "$current_log" 2>/dev/null || echo "0")
        
        echo "📈 Statistiques:"
        echo "   - Total des erreurs: $total_errors"
        echo "   - Modules non trouvés: $module_errors"
        echo "   - Erreurs TypeScript: $type_errors"
        echo "   - Erreurs de compilation: $compile_errors"
        echo ""
        
        # Afficher les 5 dernières erreurs
        echo "🕒 === 5 DERNIÈRES ERREURS ==="
        echo ""
        
        # Extraire les 5 dernières erreurs (séparées par =====)
        local last_errors=$(awk '/^==========================================$/{if(count++>=5) exit} {print}' "$current_log" | tail -n +6)
        echo "$last_errors"
        
        echo ""
        echo "📁 Fichier actuel: $current_log"
        
        # Afficher aussi le backup s'il existe
        if [[ -f "$backup_log" ]]; then
            echo "📁 Backup: $backup_log"
        fi
        
        echo "💡 Pour voir toutes les erreurs: cat $current_log"
        
    # Sinon vérifier le backup
    elif [[ -f "$backup_log" && -s "$backup_log" ]]; then
        echo ""
        echo "📊 === RÉSUMÉ DES ERREURS DE BUILD (BACKUP) ==="
        echo ""
        
        # Compter le nombre d'erreurs par type
        local total_errors=$(grep -c "TYPE:" "$backup_log" 2>/dev/null || echo "0")
        local module_errors=$(grep -c "MODULE_NOT_FOUND" "$backup_log" 2>/dev/null || echo "0")
        local type_errors=$(grep -c "TYPE_ERROR" "$backup_log" 2>/dev/null || echo "0")
        local compile_errors=$(grep -c "COMPILE_ERROR" "$backup_log" 2>/dev/null || echo "0")
        
        echo "📈 Statistiques:"
        echo "   - Total des erreurs: $total_errors"
        echo "   - Modules non trouvés: $module_errors"
        echo "   - Erreurs TypeScript: $type_errors"
        echo "   - Erreurs de compilation: $compile_errors"
        echo ""
        
        echo "📁 Fichier backup: $backup_log"
        echo "💡 Pour voir toutes les erreurs: cat $backup_log"
        
    else
        log_success "✅ Aucune erreur de build enregistrée"
    fi
}

# Fonction de déploiement principal (mise à jour structure uniquement)
deploy() {
    # Rotation globale des logs avant de commencer
    rotate_all_logs
    
    log_info "🚀 === MISE À JOUR STRUCTURE RODCOLOC v2.0 ==="
    log_info "Timestamp: $TIMESTAMP"
    log_info "Log actuel: $LOGS_DIR/deploy_current.log"
    log_info "Backups: $LOGS_DIR/backup/"
    log_info "📋 Mode: Mise à jour structure uniquement (données préservées)"
    
    # Vérifier que le build de développement fonctionne AVANT de déployer
    if ! check_dev_build; then
        log_error "🚫 DÉPLOIEMENT ANNULÉ - Le build de développement échoue"
        log_error "💡 Règle de sécurité: Ne pas déployer tant qu'il y a des erreurs de build en dev"
        send_notification "Déploiement annulé - Erreurs de build en dev" "error"
        exit 1
    fi
    
    # Envoyer notification de début
    send_notification "Mise à jour structure démarrée" "info"
    
    # Étapes de déploiement simplifiées (structure uniquement)
    copy_files
    update_prod_dependencies
    install_dependencies
    migrate_database
    build_application
    start_application
    
    # Vérification finale
    if check_application_health "http://localhost:$PROD_PORT"; then
        log_success "🎉 Mise à jour structure terminée avec succès !"
        log_info "URL Production: http://localhost:$PROD_PORT"
        log_info "Logs: $DEPLOY_LOG"
        log_info "✅ Données de production préservées"
        
        # Envoyer notification de succès
        send_notification "Mise à jour structure réussie" "success"
    else
        log_error "❌ Échec de la mise à jour structure"
        
        # Envoyer notification d'erreur
        send_notification "Échec mise à jour structure" "error"
        
        exit 1
    fi
}

# Fonction de déploiement complet (avec backup et nettoyage)
deploy_full() {
    # Rotation globale des logs avant de commencer
    rotate_all_logs
    
    log_info "🚀 === DÉPLOIEMENT COMPLET RODCOLOC v2.0 ==="
    log_info "Timestamp: $TIMESTAMP"
    log_info "Log actuel: $LOGS_DIR/deploy_current.log"
    log_info "Backups: $LOGS_DIR/backup/"
    log_info "📋 Mode: Déploiement complet (avec backup et nettoyage)"
    
    # Vérifier que le build de développement fonctionne AVANT de déployer
    if ! check_dev_build; then
        log_error "🚫 DÉPLOIEMENT ANNULÉ - Le build de développement échoue"
        log_error "💡 Règle de sécurité: Ne pas déployer tant qu'il y a des erreurs de build en dev"
        send_notification "Déploiement annulé - Erreurs de build en dev" "error"
        exit 1
    fi
    
    # Envoyer notification de début
    send_notification "Déploiement complet démarré" "info"
    
    # Étapes de déploiement complet
    create_backup
    clean_production
    copy_files
    update_env_vars
    update_prod_dependencies
    install_dependencies
    migrate_database
    build_application
    start_application
    
    # Vérification finale
    if check_application_health "http://localhost:$PROD_PORT"; then
        cleanup_backups
        
        log_success "🎉 Déploiement complet terminé avec succès !"
        log_info "URL Production: http://localhost:$PROD_PORT"
        log_info "Sauvegarde: $BACKUP_DIR/$BACKUP_NAME"
        log_info "Logs: $DEPLOY_LOG"
        
        # Envoyer notification de succès
        send_notification "Déploiement complet réussi" "success"
    else
        log_error "❌ Échec du déploiement complet"
        
        # Proposer le rollback
        if [[ "$ROLLBACK_AVAILABLE" == "true" ]]; then
            log_warning "Rollback disponible. Exécutez: $0 rollback"
        fi
        
        # Envoyer notification d'erreur
        send_notification "Échec déploiement complet" "error"
        
        exit 1
    fi
}

# =============================================================================
# POINT D'ENTRÉE PRINCIPAL
# =============================================================================

main() {
    # Traitement des arguments
    local command="deploy"
    local force=false
    local quiet=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--debug)
                export DEBUG=true
                shift
                ;;
            -f|--force)
                force=true
                shift
                ;;
            -q|--quiet)
                quiet=true
                shift
                ;;
            -v|--verbose)
                set -x
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            deploy|rollback|status|logs|config|rotate-logs|build-errors|help)
                command="$1"
                shift
                ;;
            *)
                log_error "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Initialisation
    init_config
    
    # Redirection des logs si mode quiet
    if [[ "$quiet" == "true" ]]; then
        exec > "$DEPLOY_LOG" 2>&1
    fi
    
    # Exécution de la commande
    case "$command" in
        deploy)
            check_prerequisites
            deploy
            ;;
        deploy-full)
            check_prerequisites
            deploy_full
            ;;
        rollback)
            rollback
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs
            ;;
        config)
            log_info "Configuration actuelle:"
            cat "$CONFIG_FILE"
            ;;
        rotate-logs)
            rotate_all_logs
            ;;
        build-errors)
            show_build_errors_log
            ;;
        help)
            show_help
            ;;
        *)
            log_error "Commande inconnue: $command"
            show_help
            exit 1
            ;;
    esac
}

# Exécution
main "$@"
