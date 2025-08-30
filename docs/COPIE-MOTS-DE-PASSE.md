# 🔐 Copie des mots de passe utilisateurs Dev → Prod

## Vue d'ensemble

Ce document décrit le processus de synchronisation des mots de passe des utilisateurs entre les environnements de développement et de production.

## 🛠️ Script de copie des mots de passe

### Fichier
- **Script** : `scripts/copy-user-passwords.sh`
- **Commande** : `npm run copy-passwords`

### Fonctionnalités
- Sauvegarde automatique des mots de passe de production
- Export des mots de passe de développement
- Application sécurisée à la production
- Vérification de la synchronisation
- Arrêt/redémarrage des serveurs
- Gestion d'erreurs robuste

## 🔄 Processus de synchronisation

### 1. Arrêt des serveurs
```bash
# Arrêt sécurisé des serveurs dev et prod
pkill -f "next dev.*:3001"
pkill -f "next start.*:3000"
```

### 2. Sauvegarde de production
```sql
-- Export des mots de passe actuels de production
mysqldump --single-transaction --no-create-info --inserts \
    --where="password IS NOT NULL" \
    database User > backup.sql
```

### 3. Export des mots de passe de dev
```sql
-- Export des mots de passe de développement
mysqldump --single-transaction --no-create-info --inserts \
    --where="password IS NOT NULL" \
    database User > dev_passwords.sql
```

### 4. Application à la production
```sql
-- Application avec gestion des conflits
INSERT INTO User (...) VALUES (...) 
ON DUPLICATE KEY UPDATE 
    password = VALUES(password),
    updatedAt = NOW();
```

### 5. Vérification
```sql
-- Comparaison du nombre d'utilisateurs avec mots de passe
SELECT COUNT(*) FROM User WHERE password IS NOT NULL;
```

### 6. Redémarrage des serveurs
```bash
# Redémarrage sécurisé des serveurs
bash dev/scripts/dev-start.sh &
bash prod/scripts/prod-start.sh &
```

## 🎯 Utilisation

### Commande simple
```bash
npm run copy-passwords
```

### Exécution directe
```bash
./scripts/copy-user-passwords.sh
```

## 📊 Résultats de l'exécution

```
[INFO] === Copie des mots de passe utilisateurs Dev → Prod ===
[INFO] Arrêt des serveurs avant synchronisation...
[INFO] Arrêt du serveur de développement...
[INFO] Arrêt du serveur de production...
[SUCCESS] Serveurs arrêtés
[INFO] Sauvegarde des mots de passe de production...
[SUCCESS] Sauvegarde créée: /data/dalon974/backups/user_passwords_backup_20250830_174431.sql
[INFO] Export des mots de passe de développement...
[SUCCESS] Mots de passe de dev exportés: /data/dalon974/backups/dev_passwords_20250830_174431.sql
[INFO] Application des mots de passe à la production...
[SUCCESS] Mots de passe appliqués à la production
[INFO] Vérification de la synchronisation...
[INFO] Utilisateurs avec mots de passe - Dev: 2, Prod: 2
[SUCCESS] Synchronisation réussie !
[INFO] Nettoyage des fichiers temporaires...
[SUCCESS] Fichiers temporaires nettoyés
[INFO] Redémarrage des serveurs après synchronisation...
[INFO] Redémarrage du serveur de développement...
[INFO] Redémarrage du serveur de production...
[SUCCESS] Serveurs redémarrés
[INFO] Vérification de santé des serveurs...
[SUCCESS] Serveurs accessibles
[SUCCESS] Copie des mots de passe terminée en 10 secondes !
```

## 🔧 Fonctionnalités techniques

### Gestion des configurations
```bash
# Extraction automatique des paramètres de base de données
extract_db_config() {
    # Parse DATABASE_URL: mysql://user:password@host:port/database
    # Gestion de l'encodage URL pour les mots de passe
    password=$(printf '%b' "${password//%/\\x}")
}
```

### Sauvegarde sécurisée
```bash
# Sauvegarde avant modification
backup_production_passwords() {
    mysqldump --single-transaction --no-create-info --inserts \
        --where="password IS NOT NULL" \
        database User > backup.sql
}
```

### Application avec fallback
```bash
# Tentative d'application directe
mysql database < passwords.sql || {
    # Fallback avec requêtes UPDATE manuelles
    mysql -N -e "SELECT CONCAT('UPDATE User SET password = \"', password, '\" WHERE email = \"', email, '\";') FROM User WHERE password IS NOT NULL;" > update.sql
    mysql database < update.sql
}
```

### Vérification de synchronisation
```bash
# Comparaison du nombre d'utilisateurs
dev_count=$(mysql -N -e "SELECT COUNT(*) FROM User WHERE password IS NOT NULL;" dev_db)
prod_count=$(mysql -N -e "SELECT COUNT(*) FROM User WHERE password IS NOT NULL;" prod_db)

if [ "$dev_count" -eq "$prod_count" ]; then
    log_success "Synchronisation réussie !"
else
    log_warning "Différence détectée entre dev et prod"
fi
```

## 🔒 Sécurité

### Hashage des mots de passe
- **Algorithme** : bcrypt (déjà hashé en base)
- **Salt rounds** : 12 (niveau de sécurité élevé)
- **Résistance** : Force brute, rainbow tables

### Gestion des accès
- **Connexions sécurisées** : Utilisation de MYSQL_PWD
- **Transactions** : Opérations atomiques
- **Sauvegardes** : Backup avant modification

### Protection des données
- **Fichiers temporaires** : Nettoyage automatique
- **Logs sécurisés** : Pas d'exposition de mots de passe
- **Permissions** : Vérification des accès

## 📁 Fichiers de sauvegarde

### Sauvegardes de production
- **Format** : `user_passwords_backup_YYYYMMDD_HHMMSS.sql`
- **Contenu** : Mots de passe de production avant modification
- **Conservation** : Gardé pour rollback

### Fichiers temporaires
- **Export dev** : `dev_passwords_YYYYMMDD_HHMMSS.sql`
- **Requêtes UPDATE** : `update_passwords_YYYYMMDD_HHMMSS.sql`
- **Nettoyage** : Suppression automatique

## 🚨 Gestion d'erreurs

### Erreurs courantes

#### 1. Fichier de configuration manquant
```
[ERROR] Fichier de configuration non trouvé: prod/.env.local
```
**Solution** : Vérifier l'existence des fichiers `.env.local`

#### 2. Format DATABASE_URL invalide
```
[ERROR] Format DATABASE_URL invalide dans prod/.env.local
```
**Solution** : Vérifier le format de l'URL de connexion

#### 3. Échec de connexion à la base de données
```
[ERROR] Access denied for user 'user'@'host'
```
**Solution** : Vérifier les permissions MySQL

#### 4. Aucun utilisateur avec mot de passe
```
[WARNING] Aucun utilisateur avec mot de passe trouvé en développement
```
**Solution** : Vérifier que des utilisateurs ont des mots de passe en dev

### Vérification post-synchronisation

#### Test de connexion
```bash
# Vérifier que les serveurs fonctionnent
curl -f http://localhost:3001/api/health
curl -f http://localhost:3000/api/health
```

#### Test d'authentification
1. Aller sur la page de connexion
2. Utiliser les identifiants synchronisés
3. Vérifier l'accès aux fonctionnalités

## 🔄 Intégration avec l'écosystème

### Scripts de déploiement
- Compatible avec `npm run deploy-fast`
- Compatible avec `npm run deploy-ultra-fast`
- Intégré dans le workflow de synchronisation

### Gestion des utilisateurs
- Complémentaire à `npm run copy-users`
- Synchronisation avec `npm run sync-db-structure`
- Cohérence entre dev et prod

### Mise à jour des mots de passe
- Différent de `npm run update-passwords` (met à jour un mot de passe spécifique)
- Synchronise tous les mots de passe existants
- Maintient la cohérence des environnements

## 📈 Avantages

### Sécurité
- **Synchronisation sécurisée** : Hashage préservé
- **Sauvegarde automatique** : Rollback possible
- **Vérification** : Contrôle post-synchronisation

### Automatisation
- **Processus complet** : De la sauvegarde à la vérification
- **Gestion d'erreurs** : Fallback automatique
- **Nettoyage** : Suppression des fichiers temporaires

### Maintenance
- **Cohérence** : Même mots de passe en dev et prod
- **Traçabilité** : Logs détaillés
- **Récupération** : Sauvegardes conservées

## 🎯 Scénarios d'utilisation

### Scénario 1 : Synchronisation après développement
1. Créer/modifier des utilisateurs en dev
2. Tester les mots de passe
3. Synchroniser vers prod
4. Vérifier la cohérence

### Scénario 2 : Récupération après problème
1. Problème avec les mots de passe en prod
2. Synchroniser depuis dev
3. Restaurer la cohérence
4. Vérifier le fonctionnement

### Scénario 3 : Maintenance préventive
1. Sauvegarde automatique
2. Synchronisation régulière
3. Vérification de cohérence
4. Monitoring des différences

## 📝 Maintenance

### Vérifications régulières
- **Synchronisation** : Après modifications importantes
- **Sauvegardes** : Vérification de l'intégrité
- **Permissions** : Contrôle des accès

### Nettoyage
- **Fichiers temporaires** : Suppression automatique
- **Anciennes sauvegardes** : Conservation limitée
- **Logs** : Rotation des fichiers

### Monitoring
- **Tentatives de connexion** : Surveillance des échecs
- **Utilisateurs actifs** : Suivi des accès
- **Cohérence** : Vérification régulière

## 🚀 Optimisations futures

### Améliorations possibles
- **Synchronisation incrémentale** : Seulement les changements
- **Interface web** : Gestion graphique
- **Scheduling** : Synchronisation automatique

### Monitoring avancé
- **Alertes** : Notifications en cas de problème
- **Métriques** : Statistiques de synchronisation
- **Audit** : Traçabilité complète

## 🎉 Conclusion

Le script de copie des mots de passe offre une solution sécurisée et automatisée pour maintenir la cohérence des mots de passe entre les environnements de développement et de production. Il respecte les bonnes pratiques de sécurité et s'intègre parfaitement avec l'écosystème existant.
