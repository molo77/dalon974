# Guide de déploiement RodColoc

Ce guide explique comment utiliser le nouveau script de déploiement restructuré pour déployer votre application de développement vers la production.

## 🚀 Vue d'ensemble

Le script de déploiement v2.0 offre :
- ✅ **Déploiement automatisé** avec sauvegardes
- ✅ **Rollback automatique** en cas d'erreur
- ✅ **Monitoring et health checks**
- ✅ **Gestion des logs** centralisée
- ✅ **Configuration flexible**
- ✅ **Notifications** (optionnel)

## 📋 Prérequis

- Node.js 18+ installé
- npm ou yarn installé
- Accès en écriture aux répertoires du projet
- Ports 3000 et 3001 disponibles

## 🛠️ Configuration

### Fichier de configuration

Le script utilise le fichier `.deploy-config` à la racine du projet :

```bash
# Ports
PROD_PORT=3000
DEV_PORT=3001

# Sauvegardes
BACKUP_RETENTION=5

# Timeouts (en secondes)
HEALTH_CHECK_TIMEOUT=30
BUILD_TIMEOUT=300

# Fonctionnalités
ENABLE_ROLLBACK=true
ENABLE_NOTIFICATIONS=false

# Notifications (optionnel)
# NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Variables d'environnement

Assurez-vous que vos variables d'environnement sont configurées :

```bash
# Production
NODE_ENV=production
DATABASE_URL=mysql://user:pass@localhost:3306/rodcoloc_prod
NEXTAUTH_URL=https://votre-domaine.com
NEXTAUTH_SECRET=your-secret-key

# Ezoic (recommandé)
NEXT_PUBLIC_EZOIC_SITE_ID=123456789

# reCAPTCHA (optionnel)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...votre_clé_site
RECAPTCHA_SECRET_KEY=6Lc...votre_clé_secrète
```

## 🎯 Utilisation

### Commandes de base

```bash
# Déploiement standard
npm run deploy

# Déploiement avec options
./scripts/deploy.sh deploy --force --verbose

# Rollback en cas de problème
npm run deploy:rollback

# Vérifier le statut
npm run deploy:status

# Voir les logs
npm run deploy:logs
```

### Options disponibles

```bash
# Mode debug
./scripts/deploy.sh --debug

# Mode forcé (ignore certaines vérifications)
./scripts/deploy.sh --force

# Mode silencieux
./scripts/deploy.sh --quiet

# Mode verbeux
./scripts/deploy.sh --verbose

# Aide
./scripts/deploy.sh --help
```

## 📊 Processus de déploiement

### 1. Vérifications préalables
- ✅ Vérification des prérequis
- ✅ Contrôle des ports disponibles
- ✅ Validation de l'environnement

### 2. Sauvegarde
- 💾 Création d'une sauvegarde complète
- 🔗 Lien symbolique vers la dernière sauvegarde
- 🧹 Nettoyage des anciennes sauvegardes

### 3. Préparation
- 🛑 Arrêt des processus existants
- 🧽 Nettoyage de l'environnement de production
- 📁 Copie des fichiers de développement

### 4. Build et déploiement
- 📦 Installation des dépendances
- 🔨 Build de l'application
- 🚀 Démarrage de l'application

### 5. Vérification
- 🏥 Health check de l'application
- 📊 Vérification des logs
- ✅ Confirmation du succès

## 🔄 Rollback

En cas de problème, le rollback est automatiquement disponible :

```bash
# Rollback automatique
npm run deploy:rollback

# Ou directement
./scripts/deploy.sh rollback
```

Le rollback :
- 🛑 Arrête l'application actuelle
- 📁 Restaure la dernière sauvegarde
- 🚀 Redémarre l'application
- ✅ Vérifie le bon fonctionnement

## 📈 Monitoring

### Vérification du statut

```bash
npm run deploy:status
```

Affiche :
- 📊 État des processus (dev/prod)
- 💾 Nombre de sauvegardes
- 🔗 Dernière sauvegarde
- 📁 Répertoires de travail

### Consultation des logs

```bash
# Derniers logs
npm run deploy:logs

# Logs avec plus de lignes
./scripts/deploy.sh logs 100

# Logs en temps réel
tail -f logs/deploy_*.log
```

## 🔔 Notifications

### Configuration Slack

1. Créez un webhook Slack
2. Ajoutez l'URL dans `.deploy-config` :
   ```bash
   ENABLE_NOTIFICATIONS=true
   NOTIFICATION_WEBHOOK=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

### Types de notifications

- 🚀 **Début de déploiement**
- ✅ **Succès du déploiement**
- ❌ **Échec du déploiement**
- 🔄 **Rollback effectué**

## 🛡️ Sécurité

### Bonnes pratiques

1. **Variables d'environnement**
   - Ne jamais commiter les fichiers `.env`
   - Utiliser des secrets forts
   - Rotation régulière des clés

2. **Sauvegardes**
   - Sauvegardes automatiques avant chaque déploiement
   - Rétention configurable (5 par défaut)
   - Stockage sécurisé des sauvegardes

3. **Monitoring**
   - Health checks automatiques
   - Logs centralisés
   - Alertes en cas de problème

## 🐛 Dépannage

### Problèmes courants

#### Port déjà utilisé
```bash
# Vérifier les processus
lsof -i :3000

# Arrêter manuellement
pkill -f "next.*:3000"
```

#### Build échoue
```bash
# Vérifier les logs
npm run deploy:logs

# Nettoyer et réessayer
rm -rf prod/node_modules prod/.next
npm run deploy
```

#### Application non accessible
```bash
# Vérifier le statut
npm run deploy:status

# Rollback si nécessaire
npm run deploy:rollback
```

### Logs de debug

```bash
# Activer le mode debug
DEBUG=true ./scripts/deploy.sh deploy

# Voir tous les logs
tail -f logs/deploy_*.log
```

## 📚 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run deploy` | Déploiement standard |
| `npm run deploy:rollback` | Rollback vers la dernière sauvegarde |
| `npm run deploy:status` | Affiche le statut de l'application |
| `npm run deploy:logs` | Affiche les logs de production |

## 🔧 Personnalisation

### Ajouter des étapes personnalisées

Modifiez le script `deploy.sh` pour ajouter vos propres étapes :

```bash
# Dans la fonction deploy()
custom_step() {
    log_info "🔄 Étape personnalisée..."
    # Votre code ici
    log_success "Étape personnalisée terminée"
}

# Ajouter avant start_application
custom_step
```

### Modifier les timeouts

Ajustez les timeouts dans `.deploy-config` :

```bash
HEALTH_CHECK_TIMEOUT=60  # 60 secondes
BUILD_TIMEOUT=600        # 10 minutes
```

## 📞 Support

En cas de problème :

1. **Vérifiez les logs** : `npm run deploy:logs`
2. **Consultez le statut** : `npm run deploy:status`
3. **Effectuez un rollback** : `npm run deploy:rollback`
4. **Activez le debug** : `DEBUG=true npm run deploy`

---

**Note** : Ce script de déploiement est conçu pour être robuste et sécurisé. Il gère automatiquement les erreurs et propose des solutions de récupération.

