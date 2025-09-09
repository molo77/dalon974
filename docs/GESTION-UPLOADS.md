# 📁 Gestion des uploads

## Vue d'ensemble

Ce document décrit la gestion des fichiers uploadés dans les environnements de développement et de production, et explique pourquoi les uploads ne sont plus copiés automatiquement lors des déploiements.

## 🚫 Exclusion des uploads des déploiements

### Pourquoi exclure les uploads ?

1. **Taille** : Les uploads peuvent être volumineux (170M dans notre cas)
2. **Spécificité** : Les fichiers de dev et prod peuvent être différents
3. **Performance** : Éviter les transferts inutiles lors des déploiements
4. **Contrôle** : Gestion manuelle des uploads selon les besoins

### Scripts modifiés

Tous les scripts de déploiement ont été mis à jour pour exclure `public/uploads` :

- `scripts/deploy-dev-to-prod.sh`
- `scripts/deploy-dev-to-prod-fast.sh`
- `scripts/deploy-dev-to-prod-ultra-fast.sh`

### Exclusion ajoutée

```bash
rsync -av --exclude='node_modules' --exclude='.next' --exclude='logs' \
    --exclude='public/uploads' \
    "$DEV_DIR/" "$PROD_DIR/"
```

## 🛠️ Script de gestion des uploads

### Fichier
- **Script** : `scripts/manage-uploads.sh`
- **Commande** : `./scripts/manage-uploads.sh [COMMANDE]`

### Commandes disponibles

#### 1. Statistiques
```bash
npm run uploads:stats
# ou
./scripts/manage-uploads.sh stats
```

**Résultat** :
```
[INFO] === Statistiques des uploads ===
[INFO] Dev uploads: 62 fichiers, 170M
[INFO] Prod uploads: 62 fichiers, 170M
```

#### 2. Synchronisation
```bash
# Dev vers prod
npm run uploads:sync dev-to-prod
# ou
./scripts/manage-uploads.sh sync dev-to-prod

# Prod vers dev
npm run uploads:sync prod-to-dev
# ou
./scripts/manage-uploads.sh sync prod-to-dev

# Fusion (conservation des deux côtés)
npm run uploads:sync merge
# ou
./scripts/manage-uploads.sh sync merge
```

#### 3. Nettoyage
```bash
# Nettoyer les uploads de dev (plus de 30 jours par défaut)
npm run uploads:clean dev
# ou
./scripts/manage-uploads.sh clean dev

# Nettoyer les uploads de prod (plus de 7 jours)
npm run uploads:clean prod 7
# ou
./scripts/manage-uploads.sh clean prod 7

# Nettoyer tous les uploads
npm run uploads:clean all
# ou
./scripts/manage-uploads.sh clean all
```

#### 4. Sauvegarde
```bash
# Sauvegarder les uploads de dev
npm run uploads:backup dev
# ou
./scripts/manage-uploads.sh backup dev

# Sauvegarder les uploads de prod
npm run uploads:backup prod
# ou
./scripts/manage-uploads.sh backup prod

# Sauvegarder tous les uploads
npm run uploads:backup all
# ou
./scripts/manage-uploads.sh backup all
```

#### 5. Restauration
```bash
# Restaurer les uploads de dev
npm run uploads:restore /path/to/backup.tar.gz dev
# ou
./scripts/manage-uploads.sh restore /path/to/backup.tar.gz dev

# Restaurer les uploads de prod
npm run uploads:restore /path/to/backup.tar.gz prod
# ou
./scripts/manage-uploads.sh restore /path/to/backup.tar.gz prod
```

## 📊 Utilisation pratique

### Workflow recommandé

#### 1. Développement quotidien
```bash
# Vérifier les statistiques
npm run uploads:stats

# Développer avec les uploads de dev
# Les uploads restent en dev uniquement
```

#### 2. Déploiement vers production
```bash
# Déployer le code (sans les uploads)
npm run deploy-fast

# Si nécessaire, synchroniser les uploads
npm run uploads:sync dev-to-prod
```

#### 3. Maintenance
```bash
# Nettoyer les anciens uploads
npm run uploads:clean dev 7
npm run uploads:clean prod 30

# Sauvegarder avant maintenance
npm run uploads:backup all
```

### Scénarios d'utilisation

#### Scénario 1 : Développement avec uploads de test
1. Les développeurs utilisent des fichiers de test en dev
2. Les uploads restent en dev
3. Production garde ses propres uploads
4. Déploiement rapide sans transfert de fichiers

#### Scénario 2 : Synchronisation sélective
1. Développer avec des uploads spécifiques
2. Déployer le code
3. Synchroniser seulement les uploads nécessaires
4. Contrôle total sur ce qui va en production

#### Scénario 3 : Fusion d'environnements
1. Dev et prod ont des uploads différents
2. Utiliser `sync merge` pour conserver les deux
3. Éviter la perte de données

## 🔧 Configuration

### Dossiers gérés
- **Développement** : `/data/rodcoloc/dev/public/uploads`
- **Production** : `/data/rodcoloc/prod/public/uploads`
- **Sauvegardes** : `/data/rodcoloc/backups/uploads`

### Permissions
Le script vérifie et crée automatiquement les dossiers nécessaires avec les bonnes permissions.

## 📈 Avantages

### Performance
- **Déploiements plus rapides** : Pas de transfert de fichiers volumineux
- **Bande passante économisée** : Synchronisation à la demande
- **Espace disque optimisé** : Nettoyage automatique

### Contrôle
- **Gestion granulaire** : Choisir ce qui va en production
- **Sauvegarde sélective** : Backups des uploads séparés
- **Restauration ciblée** : Restaurer seulement ce qui est nécessaire

### Flexibilité
- **Environnements indépendants** : Dev et prod peuvent avoir des uploads différents
- **Synchronisation à la demande** : Contrôle total sur le timing
- **Fusion intelligente** : Conserver les données des deux côtés

## 🚨 Bonnes pratiques

### Sécurité
- **Sauvegardes régulières** : Avant toute opération importante
- **Vérification des permissions** : S'assurer que les dossiers sont accessibles
- **Test de restauration** : Vérifier que les sauvegardes fonctionnent

### Maintenance
- **Nettoyage régulier** : Supprimer les anciens fichiers
- **Monitoring de l'espace** : Surveiller la taille des uploads
- **Documentation** : Noter les opérations importantes

### Performance
- **Synchronisation sélective** : Éviter les transferts inutiles
- **Compression des sauvegardes** : Économiser l'espace
- **Nettoyage automatique** : Supprimer les anciennes sauvegardes

## 🔍 Dépannage

### Problèmes courants

#### 1. Dossier uploads manquant
```
[ERROR] Dossier uploads de développement non trouvé
```
**Solution** : Le script crée automatiquement le dossier manquant

#### 2. Permissions insuffisantes
```
[ERROR] Permission denied
```
**Solution** : Vérifier les permissions sur les dossiers uploads

#### 3. Espace disque insuffisant
```
[ERROR] No space left on device
```
**Solution** : Nettoyer les anciens uploads et sauvegardes

### Vérification
```bash
# Vérifier l'espace disque
df -h

# Vérifier les permissions
ls -la dev/public/uploads/
ls -la prod/public/uploads/

# Vérifier les sauvegardes
ls -la backups/uploads/
```

## 📝 Intégration avec l'écosystème

### Scripts de déploiement
- Compatible avec tous les scripts de déploiement
- Exclusion automatique des uploads
- Synchronisation manuelle si nécessaire

### Workflow CI/CD
- Déploiement rapide du code
- Gestion séparée des uploads
- Contrôle granulaire des données

### Monitoring
- Statistiques automatiques
- Surveillance de l'espace disque
- Alertes en cas de problème

## 🎯 Conclusion

La gestion séparée des uploads offre un contrôle total sur les données tout en optimisant les performances des déploiements. Le script `manage-uploads.sh` fournit tous les outils nécessaires pour une gestion efficace et sécurisée des fichiers uploadés.
