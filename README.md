This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# RodColoc - Plateforme de colocation à La Réunion

## Configuration Ezoic (Recommandé)

Pour maximiser vos revenus publicitaires, nous recommandons d'utiliser Ezoic au lieu d'AdSense. Consultez le fichier [EZOIC_SETUP.md](./EZOIC_SETUP.md) pour la configuration complète.

### Configuration rapide Ezoic

1. Créez un fichier `.env.local` dans le dossier `dev/` :
```bash
NEXT_PUBLIC_EZOIC_SITE_ID=123456789
```

2. Exécutez le script de configuration :
```bash
npm run ezoic:setup
```

3. Redémarrez le serveur de développement.

## Configuration AdSense (Alternative)

Si vous préférez utiliser AdSense, consultez le fichier [ADSENSE_SETUP.md](./ADSENSE_SETUP.md) pour la configuration complète.

### Configuration rapide AdSense

1. Créez un fichier `.env.local` dans le dossier `dev/` :
```bash
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT=XXXXXXXXXX
```

2. Initialisez les données publicitaires :
```bash
npm run ads:init
```

3. Redémarrez le serveur de développement.

## Configuration reCAPTCHA

Pour sécuriser la page de connexion avec reCAPTCHA v3, consultez le fichier [RECAPTCHA_SETUP.md](./RECAPTCHA_SETUP.md) pour la configuration complète.

### Configuration rapide

1. Créez un site reCAPTCHA v3 sur [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Ajoutez les clés dans votre fichier `.env.local` :
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...votre_clé_site
RECAPTCHA_SECRET_KEY=6Lc...votre_clé_secrète
```
3. Redémarrez le serveur de développement.

## Déploiement

Pour déployer votre application de développement vers la production, consultez le fichier [DEPLOYMENT.md](./DEPLOYMENT.md) pour le guide complet.

### Déploiement rapide

```bash
# Déploiement standard
npm run deploy

# Vérifier le statut
npm run deploy:status

# Rollback si nécessaire
npm run deploy:rollback
```

## Scripts disponibles

### 🚀 Déploiement
- `npm run deploy` - Déploiement dev vers prod
- `npm run deploy:rollback` - Rollback en cas de problème
- `npm run deploy:status` - Statut de l'application
- `npm run deploy:logs` - Logs de production

### 🛠️ Développement
- `npm run dev` - Serveur de développement
- `npm run commit` - Commit intelligent avec gestion des versions

### 📢 Publicité
- `npm run ezoic:setup` - Configuration automatisée Ezoic (recommandé)
- `npm run ads:init` - Initialiser les données publicitaires
- `npm run ads:check` - Vérifier la configuration publicitaire
- `npm run ads:setup` - Configuration automatisée AdSense (alternative)

## Authentification

Le système supporte plusieurs méthodes de connexion :
- **Email/Mot de passe** - Inscription et connexion classique
- **Google** - Connexion avec compte Google

Consultez [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) pour la configuration complète.

## Structure du projet

- `dev/` - Environnement de développement
- `prod/` - Environnement de production
- `scripts/` - Scripts utilitaires
- `ADSENSE_SETUP.md` - Documentation complète AdSense
