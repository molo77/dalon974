#!/bin/bash

# Script pour visualiser les logs avec des couleurs et des filtres
# Usage: ./scripts/view-logs.sh [dev|prod|maintenance] [--tail N] [--grep pattern]

LOG_DIR="/data/dalon974/logs"
LOG_TYPE="dev"
TAIL_LINES=50
GREP_PATTERN=""

# Fonction d'aide
show_help() {
    echo "📋 Utilisation: $0 [TYPE] [OPTIONS]"
    echo ""
    echo "Types de logs:"
    echo "  dev         - Logs de développement (défaut)"
    echo "  prod        - Logs de production"
    echo "  maintenance - Logs de maintenance"
    echo ""
    echo "Options:"
    echo "  --tail N    - Afficher les N dernières lignes (défaut: 50)"
    echo "  --grep PAT  - Filtrer par pattern"
    echo "  --help      - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 dev --tail 100"
    echo "  $0 dev --grep 'error'"
    echo "  $0 prod --tail 20 --grep 'compiled'"
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod|maintenance)
            LOG_TYPE="$1"
            shift
            ;;
        --tail)
            TAIL_LINES="$2"
            shift 2
            ;;
        --grep)
            GREP_PATTERN="$2"
            shift 2
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            echo "❌ Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Déterminer le fichier de log
LOG_FILE="$LOG_DIR/${LOG_TYPE}.log"

# Vérifier que le fichier existe
if [ ! -f "$LOG_FILE" ]; then
    echo "❌ Fichier de log non trouvé: $LOG_FILE"
    exit 1
fi

echo "📝 Affichage des logs: $LOG_FILE"
echo "📊 Dernières $TAIL_LINES lignes"
if [ -n "$GREP_PATTERN" ]; then
    echo "🔍 Filtre: $GREP_PATTERN"
fi
echo ""

# Fonction pour colorer les logs
colorize_logs() {
    while IFS= read -r line; do
        # Timestamp en bleu
        if [[ $line =~ ^\[([0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})\] ]]; then
            timestamp="${BASH_REMATCH[1]}"
            rest="${line#*] }"
            
            # Couleurs selon le type de message
            if [[ $rest =~ ^✓ ]]; then
                # Succès en vert
                echo -e "\033[32m[$timestamp]\033[0m \033[32m$rest\033[0m"
            elif [[ $rest =~ ^❌|^Error|^error ]]; then
                # Erreurs en rouge
                echo -e "\033[32m[$timestamp]\033[0m \033[31m$rest\033[0m"
            elif [[ $rest =~ ^⚠️|^Warning|^warning ]]; then
                # Avertissements en jaune
                echo -e "\033[32m[$timestamp]\033[0m \033[33m$rest\033[0m"
            elif [[ $rest =~ ^🚀|^Starting|^starting ]]; then
                # Démarrage en cyan
                echo -e "\033[32m[$timestamp]\033[0m \033[36m$rest\033[0m"
            else
                # Autres messages en blanc
                echo -e "\033[32m[$timestamp]\033[0m \033[37m$rest\033[0m"
            fi
        else
            echo "$line"
        fi
    done
}

# Afficher les logs
if [ -n "$GREP_PATTERN" ]; then
    tail -n "$TAIL_LINES" "$LOG_FILE" | grep --color=always "$GREP_PATTERN" | colorize_logs
else
    tail -n "$TAIL_LINES" "$LOG_FILE" | colorize_logs
fi
