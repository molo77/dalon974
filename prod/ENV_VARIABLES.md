# Variables d'environnement

## Variables requises

### Environnement
- `NODE_ENV`: Environnement Node.js (development/production)
- `NEXT_PUBLIC_APP_ENV`: Environnement de l'application (development/production) - utilisé pour l'affichage de la bannière

### Base de données
- `DATABASE_URL`: Chaîne de connexion MySQL

### NextAuth
- `NEXTAUTH_URL`: URL publique de l'application
- `NEXTAUTH_SECRET`: Secret cryptographique pour NextAuth

### Compte démo
- `DEMO_EMAIL`: Email du compte de démonstration
- `DEMO_PASSWORD`: Mot de passe du compte de démonstration

### OAuth Providers
- `GOOGLE_CLIENT_ID`: ID client Google OAuth
- `GOOGLE_CLIENT_SECRET`: Secret client Google OAuth
- `FACEBOOK_CLIENT_ID`: ID application Facebook
- `FACEBOOK_CLIENT_SECRET`: Secret application Facebook
- `AZURE_AD_CLIENT_ID`: ID application Azure AD
- `AZURE_AD_CLIENT_SECRET`: Secret application Azure AD
- `AZURE_AD_TENANT_ID`: ID tenant Azure AD

### Interface utilisateur
- `NEXT_PUBLIC_HOMEPAGE_IMAGE`: Image de fond de la page d'accueil

### Google AdSense (optionnel)
- `NEXT_PUBLIC_ADSENSE_CLIENT`: ID éditeur AdSense
- `NEXT_PUBLIC_ADSENSE_SLOT`: Slot d'annonce AdSense

### Scraper Leboncoin
- `LBC_DEBUG`: Mode debug (true/false)
- `LBC_SEARCH_URL`: URL de recherche Leboncoin
- `LBC_BROWSER_HEADLESS`: Mode headless du navigateur (true/false)
- `LBC_MAX`: Nombre maximum d'annonces collectées
- `LBC_FETCH_DETAILS`: Récupérer les détails des annonces (true/false)
- `LBC_DETAIL_LIMIT`: Limite des détails (all/*/0/-1)
- `LBC_DETAIL_SLEEP`: Délai entre visites de détails (ms)
- `LBC_PAGES`: Nombre de pages à paginer
- `LBC_VERBOSE_LIST`: Log détaillé des annonces (true/false)
- `LBC_EXPORT_JSON`: Export JSON local (true/false)
- `LBC_NO_DB`: Ne pas écrire en base (true/false)
- `LBC_UPDATE_COOLDOWN_HOURS`: Cooldown avant nouvelle mise à jour (heures)
- `LBC_EXTRA_SLEEP`: Délai supplémentaire après chaque page (ms)
- `LBC_COOKIES`: Cookies manuels
- `LBC_USE_PROTONVPN`: Utiliser ProtonVPN (true/false)
- `LBC_DATADOME`: Token Datadome spécifique
- `DATADOME_TOKEN`: Token Datadome de fallback

## Configuration par environnement

### Développement
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
```

### Production
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
```

## Fichiers de configuration

- `dev/.env.local`: Variables d'environnement pour le développement
- `prod/.env.local`: Variables d'environnement pour la production

**Note**: Les fichiers `.env.local` ne sont pas versionnés dans Git pour des raisons de sécurité.
