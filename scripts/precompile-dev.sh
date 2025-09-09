#!/bin/bash

# Script de précompilation pour l'environnement de développement
# Ce script précompile toutes les pages et optimise l'environnement de développement

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Précompilation de l'environnement de développement RodColoc${NC}"
echo -e "${BLUE}============================================================${NC}"

# Aller dans le répertoire de développement
cd /data/rodcoloc/dev

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Erreur: package.json non trouvé dans /data/rodcoloc/dev${NC}"
    exit 1
fi

echo -e "${YELLOW}📁 Répertoire de travail: $(pwd)${NC}"
echo ""

# 1. Nettoyer le cache Next.js
echo -e "${YELLOW}🧹 Nettoyage du cache Next.js...${NC}"
if [ -d ".next" ]; then
    rm -rf .next
    echo -e "${GREEN}✅ Cache Next.js supprimé${NC}"
else
    echo -e "${YELLOW}⚠️  Aucun cache Next.js trouvé${NC}"
fi

# 2. Nettoyer les fichiers de verrouillage
echo -e "${YELLOW}🔓 Nettoyage des fichiers de verrouillage...${NC}"
if [ -f ".next.lock" ]; then
    rm -f .next.lock
    echo -e "${GREEN}✅ Fichier .next.lock supprimé${NC}"
fi

# 3. Vérifier et installer les dépendances
echo -e "${YELLOW}📦 Vérification des dépendances...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installation des dépendances...${NC}"
    npm install --legacy-peer-deps
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dépendances installées${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'installation des dépendances${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Dépendances déjà installées${NC}"
fi

# 4. Générer les types Prisma
echo -e "${YELLOW}🔧 Génération des types Prisma...${NC}"
npx prisma generate --no-hints
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Types Prisma générés${NC}"
else
    echo -e "${RED}❌ Erreur lors de la génération des types Prisma${NC}"
    exit 1
fi

# 5. Vérifier la configuration de la base de données
echo -e "${YELLOW}🗄️  Vérification de la base de données...${NC}"
npx prisma db push --accept-data-loss --no-hints
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Base de données synchronisée${NC}"
else
    echo -e "${YELLOW}⚠️  Avertissement: Problème de synchronisation de la base de données${NC}"
fi

# 6. Précompiler les pages
echo -e "${YELLOW}⚡ Précompilation des pages...${NC}"
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Pages précompilées avec succès${NC}"
else
    echo -e "${RED}❌ Erreur lors de la précompilation${NC}"
    exit 1
fi

# 7. Vérifier la taille du build
echo -e "${YELLOW}📊 Informations sur le build...${NC}"
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    echo -e "${GREEN}✅ Taille du build: $BUILD_SIZE${NC}"
    
    # Compter les pages générées
    PAGE_COUNT=$(find .next/server/pages -name "*.js" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Pages générées: $PAGE_COUNT${NC}"
else
    echo -e "${RED}❌ Dossier .next non trouvé${NC}"
fi

echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${GREEN}🎉 Précompilation terminée avec succès !${NC}"
echo -e "${GREEN}💡 Vous pouvez maintenant démarrer le serveur avec: npm run dev${NC}"
echo -e "${BLUE}============================================================${NC}"
