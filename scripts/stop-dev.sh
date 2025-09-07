#!/bin/bash

# Script pour arrêter le serveur de développement
# Usage: ./scripts/stop-dev.sh

# Couleurs pour la console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Arrêt du serveur de développement...${NC}"

# Fonction pour arrêter tous les processus Next.js
stop_all_next_processes() {
    echo -e "${YELLOW}🔍 Recherche de tous les processus Next.js...${NC}"
    
    # Trouver tous les processus Next.js
    NEXT_PIDS=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep | awk '{print $2}')
    
    if [ -z "$NEXT_PIDS" ]; then
        echo -e "${YELLOW}⚠️  Aucun processus Next.js trouvé${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}📋 Processus Next.js trouvés:${NC}"
    ps aux | grep -E "(next dev|next-server)" | grep -v grep
    
    # Arrêter les processus Next.js
    for PID in $NEXT_PIDS; do
        echo -e "${YELLOW}🔄 Arrêt du processus Next.js $PID...${NC}"
        kill -TERM $PID 2>/dev/null
        
        # Attendre un peu pour que le processus se termine proprement
        sleep 3
        
        # Vérifier si le processus est toujours en vie
        if kill -0 $PID 2>/dev/null; then
            echo -e "${RED}⚠️  Le processus $PID ne s'est pas arrêté, utilisation de SIGKILL...${NC}"
            kill -KILL $PID 2>/dev/null
        fi
    done
    
    echo -e "${GREEN}✅ Processus Next.js arrêtés${NC}"
}

# Fonction pour arrêter les processus Next.js sur le port 3001
stop_dev_server() {
    echo -e "${YELLOW}🔍 Recherche des processus Next.js sur le port 3001...${NC}"
    
    # Trouver les processus Next.js (sans sudo)
    NEXT_PIDS=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep | awk '{print $2}')
    
    if [ -z "$NEXT_PIDS" ]; then
        echo -e "${YELLOW}⚠️  Aucun processus Next.js trouvé${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}📋 Processus Next.js trouvés:${NC}"
    ps aux | grep -E "(next dev|next-server)" | grep -v grep
    
    # Arrêter les processus
    for PID in $NEXT_PIDS; do
        echo -e "${YELLOW}🔄 Arrêt du processus Next.js $PID...${NC}"
        kill -TERM $PID 2>/dev/null
        
        # Attendre un peu pour que le processus se termine proprement
        sleep 2
        
        # Vérifier si le processus est toujours en vie
        if kill -0 $PID 2>/dev/null; then
            echo -e "${RED}⚠️  Le processus $PID ne s'est pas arrêté, utilisation de SIGKILL...${NC}"
            kill -KILL $PID 2>/dev/null
        fi
    done
    
    # Vérifier qu'il n'y a plus de processus Next.js
    sleep 1
    REMAINING_NEXT=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep)
    
    if [ -z "$REMAINING_NEXT" ]; then
        echo -e "${GREEN}✅ Serveur de développement arrêté avec succès${NC}"
        return 0
    else
        echo -e "${RED}❌ Certains processus Next.js sont encore en cours d'exécution:${NC}"
        echo "$REMAINING_NEXT"
        return 1
    fi
}

# Fonction pour arrêter les processus nohup liés au développement
stop_nohup_processes() {
    echo -e "${YELLOW}🔍 Recherche des processus nohup liés au développement...${NC}"
    
    # Trouver les processus nohup qui exécutent des scripts de développement
    NOHUP_PIDS=$(ps aux | grep -E "(dev-with-timestamps|next dev)" | grep -v grep | awk '{print $2}')
    
    if [ -z "$NOHUP_PIDS" ]; then
        echo -e "${YELLOW}⚠️  Aucun processus nohup de développement trouvé${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}📋 Processus nohup trouvés:${NC}"
    ps aux | grep -E "(dev-with-timestamps|next dev)" | grep -v grep
    
    # Arrêter les processus nohup
    for PID in $NOHUP_PIDS; do
        echo -e "${YELLOW}🔄 Arrêt du processus nohup $PID...${NC}"
        kill -TERM $PID 2>/dev/null
        
        # Attendre un peu
        sleep 2
        
        # Vérifier si le processus est toujours en vie
        if kill -0 $PID 2>/dev/null; then
            echo -e "${RED}⚠️  Le processus nohup $PID ne s'est pas arrêté, utilisation de SIGKILL...${NC}"
            kill -KILL $PID 2>/dev/null
        fi
    done
    
    echo -e "${GREEN}✅ Processus nohup arrêtés${NC}"
}

# Fonction pour nettoyer les fichiers de verrouillage
cleanup_lock_files() {
    echo -e "${YELLOW}🧹 Nettoyage des fichiers de verrouillage...${NC}"
    
    # Supprimer les fichiers de verrouillage Next.js
    if [ -f "dev/.next.lock" ]; then
        rm -f "dev/.next.lock"
        echo -e "${GREEN}✅ Fichier .next.lock supprimé${NC}"
    fi
    
    if [ -f "dev/.next/cache/webpack/client-development.pack.gz" ]; then
        rm -rf "dev/.next/cache"
        echo -e "${GREEN}✅ Cache Next.js supprimé${NC}"
    fi
}

# Fonction principale
main() {
    echo -e "${BLUE}🚀 Arrêt du serveur de développement RodColoc${NC}"
    echo -e "${BLUE}==============================================${NC}"
    
    # Arrêter tous les processus Next.js en premier
    stop_all_next_processes
    
    # Arrêter les processus nohup
    stop_nohup_processes
    
    # Arrêter le serveur sur le port 3001
    stop_dev_server
    
    # Nettoyer les fichiers de verrouillage
    cleanup_lock_files
    
    echo -e "${BLUE}==============================================${NC}"
    echo -e "${GREEN}🎉 Arrêt du serveur de développement terminé${NC}"
    
    # Afficher le statut final
    echo -e "${YELLOW}📊 Statut final:${NC}"
    REMAINING_NEXT=$(ps aux | grep -E "(next dev|next-server)" | grep -v grep)
    if [ -z "$REMAINING_NEXT" ]; then
        echo -e "${GREEN}✅ Aucun processus Next.js en cours${NC}"
    else
        echo -e "${RED}❌ Processus Next.js encore en cours:${NC}"
        echo "$REMAINING_NEXT"
    fi
    
}

# Exécution du script
main "$@"
