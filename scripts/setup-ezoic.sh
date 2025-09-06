#!/bin/bash

# Script pour configurer Ezoic rapidement

echo "🚀 Configuration Ezoic pour RodColoc"
echo "===================================="

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

# Demander le Site ID Ezoic
read -p "Entrez votre Site ID Ezoic (ex: 123456789): " EZOIC_SITE_ID

# Valider le format (doit être un nombre)
if [[ ! $EZOIC_SITE_ID =~ ^[0-9]+$ ]]; then
    echo "❌ Format invalide. Le Site ID doit être un nombre"
    exit 1
fi

# Créer le fichier .env.local
echo "📄 Création du fichier dev/.env.local..."

cat > dev/.env.local << EOF
# Configuration Ezoic
NEXT_PUBLIC_EZOIC_SITE_ID=$EZOIC_SITE_ID

# Configuration de base de données (à adapter selon votre setup)
DATABASE_URL="mysql://username:password@localhost:3306/rodcoloc_dev"

# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Configuration OAuth (à configurer selon vos besoins)
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# FACEBOOK_CLIENT_ID=your-facebook-client-id
# FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
# AZURE_AD_CLIENT_ID=your-azure-client-id
# AZURE_AD_CLIENT_SECRET=your-azure-client-secret

# Configuration reCAPTCHA (optionnel)
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...votre_clé_site
# RECAPTCHA_SECRET_KEY=6Lc...votre_clé_secrète

# Configuration de l'environnement
NODE_ENV=development
EOF

echo "✅ Fichier dev/.env.local créé"

# Initialiser les données Ezoic
echo ""
echo "🎯 Initialisation des données publicitaires..."
cd dev

if [ -f "scripts/init-ads.js" ]; then
    node scripts/init-ads.js
    echo "✅ Données publicitaires initialisées"
else
    echo "⚠️  Script d'initialisation non trouvé, création manuelle..."
    
    # Créer les données de base pour Ezoic
    cat > scripts/init-ezoic.js << 'EOF'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const ezoicUnits = [
  {
    id: 'ezoic-pub-ad-placeholder-101',
    placementKey: 'home.initial.belowHero',
    slot: 'ezoic-pub-ad-placeholder-101',
    format: 'auto',
    fullWidthResponsive: true,
    height: 90
  },
  {
    id: 'ezoic-pub-ad-placeholder-102',
    placementKey: 'home.hero',
    slot: 'ezoic-pub-ad-placeholder-102',
    format: 'auto',
    fullWidthResponsive: true,
    height: 250
  },
  {
    id: 'ezoic-pub-ad-placeholder-103',
    placementKey: 'listing.inline.1',
    slot: 'ezoic-pub-ad-placeholder-103',
    format: 'auto',
    fullWidthResponsive: true,
    height: 250
  },
  {
    id: 'ezoic-pub-ad-placeholder-104',
    placementKey: 'home.list.rightSidebar',
    slot: 'ezoic-pub-ad-placeholder-104',
    format: 'auto',
    fullWidthResponsive: true,
    height: 600
  },
  {
    id: 'ezoic-pub-ad-placeholder-105',
    placementKey: 'home.footer',
    slot: 'ezoic-pub-ad-placeholder-105',
    format: 'auto',
    fullWidthResponsive: true,
    height: 90
  },
  {
    id: 'ezoic-pub-ad-placeholder-106',
    placementKey: 'idees-pratiques.hero',
    slot: 'ezoic-pub-ad-placeholder-106',
    format: 'auto',
    fullWidthResponsive: true,
    height: 90
  },
  {
    id: 'ezoic-pub-ad-placeholder-107',
    placementKey: 'idees-pratiques.content',
    slot: 'ezoic-pub-ad-placeholder-107',
    format: 'auto',
    fullWidthResponsive: true,
    height: 250
  }
];

async function initEzoic() {
  try {
    console.log('🎯 Initialisation des zones Ezoic...');
    
    for (const unit of ezoicUnits) {
      await prisma.adUnit.upsert({
        where: { id: unit.id },
        update: unit,
        create: unit
      });
      console.log(`✅ Zone créée: ${unit.placementKey}`);
    }
    
    console.log('🎉 Initialisation Ezoic terminée !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initEzoic();
EOF

    node scripts/init-ezoic.js
    echo "✅ Données Ezoic initialisées"
fi

cd ..

echo ""
echo "🎉 Configuration Ezoic terminée !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Redémarrez votre serveur de développement : npm run dev"
echo "2. Vérifiez que les publicités s'affichent correctement"
echo "3. Consultez votre tableau de bord Ezoic pour les statistiques"
echo ""
echo "📚 Documentation complète : ./EZOIC_SETUP.md"
echo ""
echo "💡 Conseil : Gardez AdSense actif pendant la transition pour comparer les revenus"

