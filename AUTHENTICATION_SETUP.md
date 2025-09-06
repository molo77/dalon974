# Configuration de l'authentification

## Fournisseurs OAuth supportés

Le système d'authentification supporte plusieurs fournisseurs OAuth :

- **Google** - Connexion avec compte Google ✅ **Activé**
- **Microsoft** - Connexion avec compte Microsoft/Azure AD ❌ **Désactivé**
- **Facebook** - Connexion avec compte Facebook ❌ **Désactivé**
- **Email** - Inscription/connexion par email avec mot de passe ✅ **Activé**

> **Note** : Microsoft et Facebook sont actuellement désactivés dans l'interface utilisateur mais restent configurés dans le backend.

## Configuration des variables d'environnement

Créez un fichier `.env.local` dans le dossier `dev/` et/ou `prod/` avec les variables suivantes :

```bash
# Configuration NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Configuration OAuth Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Configuration OAuth Microsoft (Azure AD)
AZURE_AD_CLIENT_ID=your-microsoft-client-id
AZURE_AD_CLIENT_SECRET=your-microsoft-client-secret

# Configuration OAuth Facebook
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret

# Configuration Email (optionnel)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@example.com
EMAIL_SERVER_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com

# Configuration de base de données
DATABASE_URL="mysql://username:password@localhost:3306/database_name"

# Configuration des administrateurs (optionnel)
ADMIN_EMAILS=admin1@example.com,admin2@example.com
```

## Configuration des fournisseurs OAuth

### 1. Google OAuth

1. Rendez-vous sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API Google+ et l'API Google OAuth2
4. Créez des identifiants OAuth 2.0
5. Ajoutez les URLs de redirection :
   - `http://localhost:3000/api/auth/callback/google` (développement)
   - `https://votre-domaine.com/api/auth/callback/google` (production)

### 2. Microsoft OAuth (Azure AD)

1. Rendez-vous sur [Azure Portal](https://portal.azure.com/)
2. Allez dans "Azure Active Directory" > "App registrations"
3. Cliquez sur "New registration"
4. Configurez l'application :
   - Nom : Votre application
   - Types de comptes : Comptes dans n'importe quel répertoire organisationnel
   - URI de redirection : `http://localhost:3000/api/auth/callback/azure-ad`
5. Récupérez l'ID client et créez un secret client
6. Ajoutez les permissions nécessaires

### 3. Facebook OAuth

1. Rendez-vous sur [Facebook Developers](https://developers.facebook.com/)
2. Créez une nouvelle application
3. Ajoutez le produit "Facebook Login"
4. Configurez les URLs de redirection :
   - `http://localhost:3000/api/auth/callback/facebook` (développement)
   - `https://votre-domaine.com/api/auth/callback/facebook` (production)
5. Récupérez l'ID de l'application et la clé secrète

## Comportement des fournisseurs

### Activation conditionnelle
Les fournisseurs OAuth ne sont activés que si les variables d'environnement correspondantes sont définies :

- **Google** : Activé si `GOOGLE_CLIENT_ID` et `GOOGLE_CLIENT_SECRET` sont définis
- **Microsoft** : Activé si `AZURE_AD_CLIENT_ID` et `AZURE_AD_CLIENT_SECRET` sont définis
- **Facebook** : Activé si `FACEBOOK_CLIENT_ID` et `FACEBOOK_CLIENT_SECRET` sont définis
- **Email** : Activé si `EMAIL_SERVER_HOST` est défini et différent de "disabled"

### Sécurité
- `allowDangerousEmailAccountLinking: false` - Empêche la liaison automatique des comptes
- Vérification de l'email pour Google (email_verified doit être true)
- Promotion automatique en admin via `ADMIN_EMAILS`

## Interface utilisateur

### Page de connexion (`/login`)
- Formulaire email/mot de passe
- Boutons OAuth pour les fournisseurs configurés
- Gestion des erreurs OAuth

### Page d'inscription (`/signup`)
- Formulaire d'inscription par email
- Boutons OAuth pour les fournisseurs configurés
- Envoi d'email de vérification

## Dépannage

### Les boutons OAuth ne s'affichent pas
1. Vérifiez que les variables d'environnement sont définies
2. Redémarrez le serveur de développement
3. Vérifiez les logs pour d'éventuelles erreurs

### Erreur "OAuthAccountNotLinked"
Cette erreur se produit quand un email est déjà lié à un autre fournisseur. L'utilisateur doit utiliser le même fournisseur ou lier les comptes manuellement.

### Erreur "AccessDenied"
L'utilisateur a refusé l'autorisation ou il y a un problème de configuration OAuth.

### Erreur "Configuration"
Problème de configuration des identifiants OAuth (ID client ou secret incorrect).

## Migration des utilisateurs existants

Si vous ajoutez de nouveaux fournisseurs OAuth à une application existante :

1. Les utilisateurs existants peuvent continuer à utiliser leur méthode de connexion
2. Les nouveaux utilisateurs peuvent choisir parmi tous les fournisseurs disponibles
3. La liaison des comptes est désactivée par sécurité

## Bonnes pratiques

1. **Sécurité** : Gardez vos clés secrètes confidentielles
2. **URLs de redirection** : Configurez correctement les URLs pour dev/prod
3. **Permissions** : Demandez seulement les permissions nécessaires
4. **Test** : Testez tous les fournisseurs en développement avant la production
5. **Monitoring** : Surveillez les logs d'authentification en production
