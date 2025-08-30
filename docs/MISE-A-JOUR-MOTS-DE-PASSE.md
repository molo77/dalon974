# 🔐 Mise à jour des mots de passe utilisateurs

## Vue d'ensemble

Ce document décrit le processus de mise à jour des mots de passe pour les utilisateurs spécifiés dans les environnements de développement et de production.

## Script de mise à jour

### Fichier
- **Script** : `scripts/update-user-passwords.js`
- **Commande** : `npm run update-passwords`

### Fonctionnalités
- Hashage sécurisé des mots de passe avec bcrypt (salt rounds: 12)
- Mise à jour automatique en développement et production
- Création d'utilisateurs s'ils n'existent pas
- Gestion des erreurs et logs colorés
- Support de l'encodage URL dans les chaînes de connexion

## Utilisation

### Commande simple
```bash
npm run update-passwords
```

### Exécution directe
```bash
node scripts/update-user-passwords.js
```

## Configuration

### Utilisateurs cibles
```javascript
const USERS_TO_UPDATE = [
  'molo777@gmail.com',
  'cedric.roddier@gmail.com'
];
```

### Mot de passe
```javascript
const NEW_PASSWORD = 'Bulgroz!1977';
```

## Processus de mise à jour

### 1. Hashage sécurisé
```javascript
const hashedPassword = await hash(NEW_PASSWORD, 12);
```
- Utilisation de bcrypt avec 12 rounds de salt
- Sécurité renforcée contre les attaques par force brute

### 2. Mise à jour en base
```sql
UPDATE User SET password = ?, updatedAt = NOW() WHERE email = ?
```

### 3. Création si inexistant
```sql
INSERT INTO User (id, email, password, name, role, createdAt, updatedAt) 
VALUES (?, ?, ?, ?, ?, NOW(), NOW())
```

## Gestion des environnements

### Configuration automatique
Le script détecte automatiquement les fichiers de configuration :
- **Développement** : `dev/.env.local`
- **Production** : `prod/.env.local`

### Parsing de DATABASE_URL
```javascript
// Support de l'encodage URL
const password = decodeURIComponent(match[2]);
```

## Sécurité

### Hashage des mots de passe
- **Algorithme** : bcrypt
- **Salt rounds** : 12 (recommandé)
- **Résistance** : Force brute, rainbow tables

### Gestion des erreurs
- Connexion sécurisée à la base de données
- Validation des paramètres
- Logs détaillés sans exposition de données sensibles

### Bonnes pratiques
- Mots de passe forts (majuscules, minuscules, chiffres, caractères spéciaux)
- Mise à jour régulière
- Audit des accès

## Logs et monitoring

### Format des logs
```
🔐 Mise à jour des mots de passe utilisateurs
Mot de passe: Bulgroz!1977
Utilisateurs: molo777@gmail.com, cedric.roddier@gmail.com

=== Mise à jour des mots de passe en DEV ===
Connexion à la base de données dev...
Hashage du mot de passe...
Mise à jour de molo777@gmail.com...
✅ molo777@gmail.com créé
Mise à jour de cedric.roddier@gmail.com...
✅ cedric.roddier@gmail.com créé
✅ Mise à jour dev terminée

=== Mise à jour des mots de passe en PROD ===
Connexion à la base de données prod...
Hashage du mot de passe...
Mise à jour de molo777@gmail.com...
✅ molo777@gmail.com mis à jour
Mise à jour de cedric.roddier@gmail.com...
✅ cedric.roddier@gmail.com mis à jour
✅ Mise à jour prod terminée

🎉 Mise à jour terminée avec succès !
```

### Codes couleur
- **Bleu** : Informations générales
- **Jaune** : Actions en cours
- **Vert** : Succès
- **Rouge** : Erreurs

## Intégration avec NextAuth

### Authentification
Le système utilise NextAuth avec le provider Credentials pour l'authentification par email/mot de passe.

### Vérification des mots de passe
```javascript
const ok = await compare(password, user.password);
```

### Rate limiting
- Protection contre les attaques par force brute
- Limitation par IP et email
- Délais d'attente progressifs

## Dépannage

### Erreurs courantes

#### 1. Erreur de connexion à la base de données
```
❌ Erreur dev: Access denied for user 'molo'@'molosrv.home'
```
**Solution** : Vérifier les permissions MySQL et la configuration DATABASE_URL

#### 2. Format DATABASE_URL invalide
```
❌ Format DATABASE_URL invalide: mysql://...
```
**Solution** : Vérifier le format de l'URL de connexion

#### 3. Utilisateur non trouvé
```
❌ Erreur pour user@example.com: ...
```
**Solution** : L'utilisateur sera créé automatiquement

### Vérification post-mise à jour

#### Test de connexion
```bash
# Vérifier que les serveurs fonctionnent
curl -f http://localhost:3001/api/health
curl -f http://localhost:3000/api/health
```

#### Test d'authentification
1. Aller sur la page de connexion
2. Utiliser les identifiants mis à jour
3. Vérifier l'accès aux fonctionnalités

## Maintenance

### Mise à jour régulière
- Changer les mots de passe périodiquement
- Surveiller les tentatives de connexion échouées
- Maintenir les logs de sécurité

### Sauvegarde
- Toujours sauvegarder avant mise à jour
- Conserver les anciens mots de passe temporairement
- Tester en environnement de développement

## Scripts associés

### Déploiement
- `npm run deploy-fast` : Déploiement rapide
- `npm run deploy-ultra-fast` : Déploiement ultra-rapide

### Gestion des utilisateurs
- `npm run copy-users` : Copie d'utilisateurs vers la production

### Synchronisation
- `npm run sync-db-structure` : Synchronisation de la structure MySQL

## Conclusion

Le script de mise à jour des mots de passe offre une solution sécurisée et automatisée pour gérer les accès utilisateurs dans les environnements de développement et de production. Il respecte les bonnes pratiques de sécurité et s'intègre parfaitement avec le système d'authentification NextAuth.
