# Configuration Email pour Reset de Mot de Passe

Pour activer le système de reset de mot de passe par email, ajoutez ces variables dans votre fichier `.env.local` :

## Configuration SMTP

```bash
# Configuration du serveur SMTP
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=votre-email@gmail.com
EMAIL_SERVER_PASSWORD=votre-mot-de-passe-app

# Email d'expédition
EMAIL_FROM=noreply@votre-domaine.com
```

## Exemples de configuration

### Gmail
```bash
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=votre-email@gmail.com
EMAIL_SERVER_PASSWORD=votre-mot-de-passe-app-gmail
EMAIL_FROM=votre-email@gmail.com
```

### Outlook/Hotmail
```bash
EMAIL_SERVER_HOST=smtp-mail.outlook.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=votre-email@outlook.com
EMAIL_SERVER_PASSWORD=votre-mot-de-passe
EMAIL_FROM=votre-email@outlook.com
```

### OVH
```bash
EMAIL_SERVER_HOST=ssl0.ovh.net
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=votre-email@votre-domaine.com
EMAIL_SERVER_PASSWORD=votre-mot-de-passe
EMAIL_FROM=noreply@votre-domaine.com
```

## Notes importantes

1. **Gmail** : Utilisez un "mot de passe d'application" généré dans les paramètres de sécurité Google
2. **Sécurité** : Ne committez jamais ces variables dans Git
3. **Test** : Testez d'abord avec un email de test avant de déployer en production

## Activation

Une fois configuré, le système de reset de mot de passe sera automatiquement disponible :
- Page de demande : `/reset-password`
- Page de vérification : `/reset-password/verify`
- Lien dans la page de connexion : "Mot de passe oublié ?"
