# Scripts - Documentation

Ce dossier contient tous les scripts utilitaires du projet, organisés par catégorie selon la nouvelle architecture.

## Structure

```
src/scripts/
├── build/           # Scripts de construction et compilation
├── database/        # Scripts de gestion de base de données
├── deploy/          # Scripts de déploiement
├── maintenance/     # Scripts de maintenance
├── scraper/         # Scripts de scraping
├── test/            # Scripts de test
└── utils/           # Scripts utilitaires
```

## Catégories

### Build (`build/`)
- **build-reunion-geo.mjs** : Construction des données géographiques de La Réunion

### Database (`database/`)
- **add-config-column.js** : Ajout de colonnes de configuration
- **apply-schema-fix.js** : Application de corrections de schéma
- **apply-schema-to-dev.js** : Application du schéma en développement
- **create-dev-database.js** : Création de la base de données de développement
- **export-database.js** : Export de la base de données
- **import-database.js** : Import de la base de données
- **migrate-to-dev.js** : Migration vers l'environnement de développement
- **switch-database.js** : Changement de base de données
- **verify-import.js** : Vérification d'import

### Deploy (`deploy/`)
- **deploy-dev-to-prod.sh** : Déploiement de dev vers prod
- **deploy-to-linux-server.js/.sh** : Déploiement sur serveur Linux
- **fix-ssh-keys.js** : Correction des clés SSH
- **setup-ssh-keys.js** : Configuration des clés SSH
- **setup-linux-server*.js/.sh** : Configuration de serveur Linux

### Maintenance (`maintenance/`)
- **cleanup-unused-images.js** : Nettoyage des images inutilisées
- **schedule-cleanup.js** : Planification du nettoyage

### Scraper (`scraper/`)
- **external/** : Scripts de scraping externe
- **leboncoin/** : Scripts de scraping LeBonCoin
- **protonvpn/** : Scripts de scraping avec ProtonVPN

### Test (`test/`)
- Scripts de test pour toutes les fonctionnalités de l'application

### Utils (`utils/`)
- **add-test-data.js** : Ajout de données de test
- **diagnostic-*.js** : Scripts de diagnostic
- **fix-scraper-config.js** : Correction de configuration scraper
- **send-email*.sh** : Scripts d'envoi d'email

## Utilisation

Les scripts peuvent être exécutés directement ou via les commandes npm définies dans `package.json`.

### Exemples

```bash
# Exécution directe
node src/scripts/database/create-dev-database.js

# Via npm (si défini dans package.json)
npm run db:create-dev
```

## Migration

Cette structure remplace l'ancienne organisation dans `scripts/` et suit les principes de la nouvelle architecture du projet.
