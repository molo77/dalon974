# Configuration reCAPTCHA v3

Ce guide explique comment configurer Google reCAPTCHA v3 pour sécuriser la page de connexion.

## 1. Créer un site reCAPTCHA

1. Allez sur [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Cliquez sur "+" pour créer un nouveau site
3. Remplissez les informations :
   - **Label** : Dalon974
   - **Type de reCAPTCHA** : reCAPTCHA v3
   - **Domaines** : 
     - `localhost` (pour le développement)
     - Votre domaine de production (ex: `dalon974.com`)
   - **Acceptez les conditions d'utilisation**
4. Cliquez sur "Soumettre"

## 2. Récupérer les clés

Après création, vous obtiendrez :
- **Clé du site** (Site Key) : `6Lc...` (publique)
- **Clé secrète** (Secret Key) : `6Lc...` (privée)

## 3. Configuration des variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# reCAPTCHA v3
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...votre_clé_site
RECAPTCHA_SECRET_KEY=6Lc...votre_clé_secrète
```

## 4. Redémarrage du serveur

Après avoir ajouté les variables d'environnement :

```bash
# En développement
npm run dev

# En production
npm run build
npm start
```

## 5. Test de fonctionnement

1. Allez sur la page de connexion
2. Remplissez le formulaire
3. Cliquez sur "Se connecter"
4. Le reCAPTCHA s'exécute automatiquement en arrière-plan
5. Si la validation échoue, la connexion sera refusée

## 6. Monitoring

Vous pouvez surveiller les scores reCAPTCHA dans la [console d'administration](https://www.google.com/recaptcha/admin) :
- Score 1.0 = Très probablement un humain
- Score 0.0 = Très probablement un bot
- Seuil configuré : 0.5

## 7. Désactivation temporaire

Pour désactiver temporairement reCAPTCHA (développement uniquement) :
- Supprimez ou commentez les variables d'environnement
- Le système fonctionnera sans validation reCAPTCHA

## 8. Sécurité

- **Ne jamais** exposer la clé secrète côté client
- **Toujours** valider côté serveur
- **Surveiller** les scores dans la console d'administration
- **Ajuster** le seuil selon vos besoins (0.3-0.7 recommandé)

## 9. Dépannage

### Erreur "reCAPTCHA non configuré"
- Vérifiez que `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` est définie
- Redémarrez le serveur après modification

### Connexion toujours refusée
- Vérifiez que `RECAPTCHA_SECRET_KEY` est correcte
- Consultez les logs serveur pour les erreurs reCAPTCHA
- Vérifiez que le domaine est autorisé dans la console reCAPTCHA

### Score trop bas
- Ajustez le seuil dans `auth.ts` (ligne 57)
- Vérifiez que l'utilisateur n'utilise pas de VPN/proxy
- Consultez les recommandations Google pour améliorer les scores

