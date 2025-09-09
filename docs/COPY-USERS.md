# Copie d'Utilisateurs Dev → Prod

## Vue d'ensemble

Ce document décrit le processus de copie d'utilisateurs spécifiques de l'environnement de développement vers l'environnement de production.

## Script de copie d'utilisateurs

### Fichier principal
- **Script** : `scripts/copy-users-to-prod.sh`
- **Commande npm** : `npm run copy-users`

### Utilisateurs par défaut
Le script copie automatiquement les utilisateurs suivants :
- `molo777@gmail.com` - Molo Admin (rôle: admin)
- `cedric.roddier@gmail.com` - Cedric Roddier (rôle: user)

### Fonctionnalités

1. **Vérification** des utilisateurs dans la base de développement
2. **Création automatique** d'utilisateurs par défaut si aucun n'existe
3. **Sauvegarde automatique** de la table User de production
4. **Export** des utilisateurs de développement
5. **Application** des utilisateurs à la production
6. **Vérification** de la copie
7. **Nettoyage** des fichiers temporaires

## Utilisation

### Copie des utilisateurs par défaut
```bash
npm run copy-users
```

### Processus détaillé

#### 1. Vérification en développement
```bash
# Vérification de l'existence des utilisateurs
SELECT COUNT(*) FROM User WHERE email IN ('molo777@gmail.com', 'cedric.roddier@gmail.com');
```

#### 2. Création d'utilisateurs par défaut (si nécessaire)
```sql
INSERT INTO `User` (`id`, `email`, `name`, `displayName`, `role`, `createdAt`, `updatedAt`) VALUES
('molo777-user-id', 'molo777@gmail.com', 'Molo', 'Molo Admin', 'admin', NOW(), NOW()),
('cedric-user-id', 'cedric.roddier@gmail.com', 'Cedric', 'Cedric Roddier', 'user', NOW(), NOW());
```

#### 3. Sauvegarde de production
```bash
# Sauvegarde de la table User de production
mysqldump --single-transaction --no-create-info --inserts \
    rodcoloc_prod User > backups/prod_users_backup_TIMESTAMP.sql
```

#### 4. Export des utilisateurs
```bash
# Export avec gestion des doublons
INSERT INTO `User` (...) VALUES (...) 
ON DUPLICATE KEY UPDATE 
    `name`=VALUES(`name`), 
    `displayName`=VALUES(`displayName`), 
    `role`=VALUES(`role`), 
    `updatedAt`=VALUES(`updatedAt`);
```

#### 5. Application à la production
```bash
# Application des utilisateurs à la base de production
mysql rodcoloc_prod < backups/dev_users_TIMESTAMP.sql
```

## Sécurité

### Sauvegardes automatiques
- **Avant chaque copie** : Sauvegarde de la table User de production
- **Conservation** : Sauvegardes dans `backups/`
- **Nommage** : `prod_users_backup_YYYYMMDD_HHMMSS.sql`

### Gestion des doublons
- **INSERT ... ON DUPLICATE KEY UPDATE** : Met à jour les utilisateurs existants
- **Pas de perte de données** : Les utilisateurs existants sont préservés
- **Mise à jour** : Les informations sont synchronisées

## Structure des utilisateurs

### Champs copiés
- `id` - Identifiant unique
- `email` - Adresse email (clé unique)
- `name` - Nom de l'utilisateur
- `displayName` - Nom d'affichage
- `role` - Rôle utilisateur (admin/user)
- `createdAt` - Date de création
- `updatedAt` - Date de mise à jour

### Utilisateurs par défaut

#### Molo Admin
- **Email** : `molo777@gmail.com`
- **Nom** : Molo
- **Nom d'affichage** : Molo Admin
- **Rôle** : admin
- **ID** : molo777-user-id

#### Cedric Roddier
- **Email** : `cedric.roddier@gmail.com`
- **Nom** : Cedric
- **Nom d'affichage** : Cedric Roddier
- **Rôle** : user
- **ID** : cedric-user-id

## Utilisation avec NextAuth

### Configuration
Les utilisateurs copiés sont compatibles avec NextAuth et peuvent se connecter immédiatement.

### Authentification
- **Email/Password** : Si un mot de passe est défini
- **OAuth** : Si un providerId est configuré
- **Rôles** : Gestion des permissions via le champ `role`

## Maintenance

### Vérification
```bash
# Vérification des utilisateurs en production
mysql -h 192.168.1.200 -P 3306 -u molo -p'Bulgroz@1977' rodcoloc_prod \
    -e "SELECT email, name, displayName, role FROM User;"
```

### Nettoyage
- **Fichiers temporaires** : Supprimés automatiquement
- **Sauvegardes** : Conservées pour sécurité
- **Logs** : Affichés en temps réel

## Dépannage

### Erreurs courantes

#### 1. Utilisateurs non trouvés en développement
- **Solution** : Le script crée automatiquement les utilisateurs par défaut
- **Vérification** : Les utilisateurs sont créés avec des valeurs par défaut

#### 2. Erreur de contrainte d'unicité
- **Solution** : Utilisation de `ON DUPLICATE KEY UPDATE`
- **Résultat** : Mise à jour des utilisateurs existants

#### 3. Erreur de connexion MySQL
- **Vérification** : Paramètres de connexion dans `.env.local`
- **Test** : Connexion manuelle à la base de données

### Logs
- **Logs du script** : Affichés en temps réel
- **Sauvegardes** : Conservées dans `backups/`
- **Fichiers temporaires** : Supprimés automatiquement

## Intégration

### Avec le déploiement
Le script peut être intégré dans le processus de déploiement pour synchroniser automatiquement les utilisateurs.

### Avec la synchronisation de structure
- **Ordre** : Structure MySQL → Utilisateurs
- **Dépendance** : La table User doit exister en production
- **Cohérence** : Structure et données synchronisées

## Conclusion

Le script de copie d'utilisateurs garantit la synchronisation des comptes utilisateurs entre les environnements de développement et de production, avec une gestion sécurisée des doublons et des sauvegardes automatiques.
