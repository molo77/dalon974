# Synchronisation Structure MySQL Dev → Prod

## Vue d'ensemble

Ce document décrit le processus de synchronisation de la structure MySQL de l'environnement de développement vers l'environnement de production.

## Configuration des bases de données

### Environnement de développement
- **Base de données** : `dalon974_dev`
- **URL de connexion** : `mysql://molo:Bulgroz%401977@192.168.1.200:3306/dalon974_dev`
- **Fichier de configuration** : `dev/.env.local`

### Environnement de production
- **Base de données** : `dalon974_prod`
- **URL de connexion** : `mysql://molo:Bulgroz%401977@192.168.1.200:3306/dalon974_prod`
- **Fichier de configuration** : `prod/.env.local`

## Script de synchronisation

### Fichier principal
- **Script** : `scripts/sync-database-structure.sh`
- **Commande npm** : `npm run sync-db-structure`

### Fonctionnalités

1. **Sauvegarde automatique** de la base de production avant modification
2. **Export de la structure** de la base de développement (sans les données)
3. **Application de la structure** à la base de production
4. **Vérification** de la synchronisation
5. **Nettoyage** des fichiers temporaires

### Processus détaillé

#### 1. Sauvegarde de production
```bash
# Création d'une sauvegarde complète de la base de production
mysqldump --single-transaction --routines --triggers --events \
    dalon974_prod > backups/prod_db_backup_TIMESTAMP.sql
```

#### 2. Export de la structure de développement
```bash
# Export de la structure uniquement (pas les données)
mysqldump --no-data --single-transaction --routines --triggers --events \
    dalon974_dev > backups/dev_structure_TIMESTAMP.sql
```

#### 3. Application à la production
```bash
# Application de la structure à la base de production
mysql dalon974_prod < backups/dev_structure_TIMESTAMP.sql
```

#### 4. Vérification
```bash
# Comparaison des tables entre dev et prod
SHOW TABLES FROM dalon974_dev;
SHOW TABLES FROM dalon974_prod;
```

## Intégration dans le déploiement

Le script de synchronisation MySQL est automatiquement intégré dans le processus de déploiement :

```bash
# Déploiement complet avec synchronisation MySQL
./scripts/deploy-dev-to-prod.sh
```

### Étapes du déploiement
1. Sauvegarde de l'environnement de production
2. Nettoyage de l'environnement de production
3. Copie des fichiers de dev vers prod
4. Installation des dépendances
5. Build de l'application
6. Démarrage de l'application
7. **Synchronisation de la structure MySQL** ← Nouveau
8. Nettoyage des anciennes sauvegardes

## Utilisation

### Synchronisation manuelle
```bash
# Synchronisation uniquement de la structure MySQL
npm run sync-db-structure
```

### Déploiement complet
```bash
# Déploiement avec synchronisation MySQL automatique
./scripts/deploy-dev-to-prod.sh
```

### Vérification de l'état
```bash
# Vérification de la santé des serveurs
npm run health-check:dev
npm run health-check:prod
```

## Sécurité

### Sauvegardes automatiques
- **Avant chaque synchronisation** : Sauvegarde complète de la base de production
- **Conservation** : Les sauvegardes sont conservées dans `backups/`
- **Nommage** : `prod_db_backup_YYYYMMDD_HHMMSS.sql`

### Gestion des erreurs
- **Arrêt en cas d'erreur** : Le script s'arrête si une étape échoue
- **Logs détaillés** : Toutes les opérations sont loggées
- **Vérification** : Contrôle de la synchronisation après application

## Tables synchronisées

La synchronisation inclut toutes les tables de l'application :

- `Account` - Comptes utilisateurs (NextAuth)
- `AdUnit` - Unités publicitaires
- `Annonce` - Annonces de colocation
- `AnnonceImage` - Images des annonces
- `ColocAutosaveQueue` - File d'attente de sauvegarde automatique
- `ColocImage` - Images des profils de colocation
- `ColocProfile` - Profils de colocation
- `Message` - Messages entre utilisateurs
- `_prisma_migrations` - Migrations Prisma
- `ScraperRun` - Exécutions du scraper
- `ScraperSetting` - Paramètres du scraper
- `Session` - Sessions utilisateurs (NextAuth)
- `User` - Utilisateurs
- `VerificationToken` - Tokens de vérification (NextAuth)

## Prérequis

### Outils requis
- `mysql` - Client MySQL
- `mysqldump` - Utilitaire de sauvegarde MySQL
- `bash` - Shell bash

### Permissions
- Accès en lecture à la base de développement
- Accès en lecture/écriture à la base de production
- Permissions de création de fichiers dans `backups/`

## Dépannage

### Erreurs courantes

#### 1. Client MySQL non installé
```bash
# Installation sur Ubuntu/Debian
sudo apt-get install mysql-client
```

#### 2. Erreur de connexion
- Vérifier les paramètres de connexion dans `.env.local`
- Vérifier que le serveur MySQL est accessible
- Vérifier les permissions utilisateur

#### 3. Erreur de permissions
```bash
# Vérifier les permissions sur le répertoire backups
chmod 755 backups/
```

### Logs
- **Logs du script** : Affichés en temps réel
- **Sauvegardes** : Conservées dans `backups/`
- **Fichiers temporaires** : Supprimés automatiquement

## Maintenance

### Nettoyage des sauvegardes
Les sauvegardes sont automatiquement nettoyées lors du déploiement :
- Conservation des 5 dernières sauvegardes
- Suppression des sauvegardes plus anciennes

### Surveillance
- Vérifier régulièrement l'espace disque dans `backups/`
- Surveiller les logs de synchronisation
- Tester périodiquement la synchronisation manuelle

## Conclusion

La synchronisation automatique de la structure MySQL garantit que les environnements de développement et de production restent cohérents, tout en préservant la sécurité des données de production grâce aux sauvegardes automatiques.
