# 🔒 Résolution des problèmes SSL avec NextAuth

## ❌ Erreur : "self-signed certificate"

Cette erreur se produit généralement lors de la connexion à des services externes qui utilisent des certificats SSL non valides.

## 🔧 Solutions

### 1. Désactiver temporairement le provider Email

Si le problème vient du serveur SMTP local, vous pouvez temporairement le désactiver :

```bash
# Dans votre fichier .env.local
EMAIL_SERVER_HOST=disabled
```

### 2. Configuration SSL pour le serveur SMTP

Si vous voulez garder le provider Email, ajoutez ces variables d'environnement :

```bash
# Ignorer les certificats SSL auto-signés en développement
NODE_TLS_REJECT_UNAUTHORIZED=0

# Configuration SMTP avec options SSL
EMAIL_SERVER_HOST=localhost
EMAIL_SERVER_PORT=25
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=noreply@depannage-informatique974.fr
```

### 3. Vérifier la configuration Postfix

Assurez-vous que votre serveur SMTP local fonctionne correctement :

```bash
# Vérifier le statut de Postfix
sudo systemctl status postfix

# Voir les logs
sudo tail -f /var/log/mail.log

# Tester l'envoi d'email
echo "Test" | mail -s "Test SSL" test@example.com
```

### 4. Configuration NextAuth pour ignorer les erreurs SSL

Le code a été modifié pour inclure des options SSL robustes :

- `rejectUnauthorized: false` en développement
- `ignoreTLS: true` en développement
- Support des ports 25 (non-SSL) et 465 (SSL)

### 5. Variables d'environnement recommandées

```bash
# Environnement de développement
NODE_ENV=development
NODE_TLS_REJECT_UNAUTHORIZED=0

# Environnement de production
NODE_ENV=production
# NODE_TLS_REJECT_UNAUTHORIZED non défini (par défaut true)
```

## 🚀 Redémarrage après modification

Après avoir modifié les variables d'environnement :

```bash
# Redémarrer le serveur de développement
npm run dev

# Ou redémarrer le serveur de production
npm run prod
```

## 📝 Logs et débogage

Pour activer le débogage NextAuth, ajoutez dans `.env.local` :

```bash
NEXTAUTH_DEBUG=true
```

Cela affichera des informations détaillées sur les tentatives de connexion et les erreurs SSL.
