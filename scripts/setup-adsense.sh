#!/bin/bash

# Script pour configurer AdSense rapidement

echo "🚀 Configuration AdSense pour RodColoc"
echo "======================================"

# Vérifier si on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Ce script doit être exécuté depuis la racine du projet"
    exit 1
fi

# Vérifier si .env.local existe déjà
if [ -f "dev/.env.local" ]; then
    echo "⚠️  Le fichier dev/.env.local existe déjà"
    read -p "Voulez-vous le remplacer? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration annulée"
        exit 0
    fi
fi

echo ""
echo "📝 Configuration des variables d'environnement"
echo "---------------------------------------------"

# Demander l'ID client AdSense
read -p "Entrez votre ID client AdSense (ca-pub-XXXXXXXXXXXX): " ADSENSE_CLIENT

# Valider le format
if [[ ! $ADSENSE_CLIENT =~ ^ca-pub-[0-9]+$ ]]; then
    echo "❌ Format invalide. L'ID doit commencer par 'ca-pub-' suivi de chiffres"
    exit 1
fi

# Demander le slot (optionnel)
read -p "Entrez votre slot AdSense (optionnel, format: XXXXXXXXXX): " ADSENSE_SLOT

# Créer le fichier .env.local
echo "📄 Création du fichier dev/.env.local..."

cat > dev/.env.local << EOF
# Configuration AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=$ADSENSE_CLIENT
NEXT_PUBLIC_ADSENSE_SLOT=$ADSENSE_SLOT

# Configuration de base de données (à adapter selon votre setup)
DATABASE_URL="mysql://username:password@localhost:3306/rodcoloc_dev"

# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Configuration OAuth (à configurer selon vos besoins)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GITHUB_CLIENT_ID=your-github-client-id
# GITHUB_CLIENT_SECRET=your-github-client-secret

# Configuration de l'environnement
NODE_ENV=development
EOF

echo "✅ Fichier dev/.env.local créé"

# Initialiser les données AdSense
echo ""
echo "🎯 Initialisation des données publicitaires..."
cd dev
if npm run ads:init; then
    echo "✅ Données AdSense initialisées"
else
    echo "⚠️  Erreur lors de l'initialisation des données AdSense"
    echo "   Vous pouvez réessayer avec: npm run ads:init"
fi

# Vérifier la configuration
echo ""
echo "🔍 Vérification de la configuration..."
if npm run ads:check; then
    echo "✅ Configuration AdSense vérifiée"
else
    echo "⚠️  Erreur lors de la vérification"
fi

cd ..

echo ""
echo "🎉 Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Redémarrez votre serveur de développement: npm run dev"
echo "2. Vérifiez que les publicités s'affichent correctement"
echo "3. Consultez ADSENSE_SETUP.md pour plus d'informations"
echo ""
echo "💡 Note: En mode développement, vous verrez des placeholders"
echo "   Les vraies publicités ne s'afficheront qu'en production"

