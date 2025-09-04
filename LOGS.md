# 📝 Système de Logs - dalon974

Ce document explique comment utiliser le système de logs avec horodatages pour votre application dalon974.

## 🕒 Horodatages Automatiques

Tous les logs incluent maintenant des horodatages au format `[YYYY-MM-DD HH:MM:SS]` pour faciliter le suivi et le débogage.

## 📁 Structure des Logs

```
/data/dalon974/logs/
├── dev.log              # Logs de développement
├── prod.log             # Logs de production  
├── maintenance.log      # Logs de maintenance
└── backup/              # Sauvegardes des anciens logs
    ├── dev.log.backup.20250904_220000
    ├── prod.log.backup.20250904_220000
    └── maintenance.log.backup.20250904_220000
```

## 🚀 Commandes Disponibles

### Démarrage avec Logs Horodatés

```bash
# Démarrage normal (sans horodatages)
npm run dev

# Démarrage avec horodatages automatiques
npm run dev:logs
```

### Visualisation des Logs

```bash
# Voir les logs de développement (50 dernières lignes)
npm run logs

# Voir les logs de production
npm run logs:prod

# Voir les logs de maintenance
npm run logs:maintenance

# Options avancées
./scripts/view-logs.sh dev --tail 100
./scripts/view-logs.sh dev --grep "error"
./scripts/view-logs.sh prod --tail 20 --grep "compiled"
```

### Nettoyage des Logs

```bash
# Nettoyage avec options par défaut (30 jours)
npm run logs:cleanup

# Nettoyage personnalisé
./scripts/cleanup-logs.sh --keep-days 7 --compress
./scripts/cleanup-logs.sh --dry-run  # Voir ce qui serait fait
```

## 🎨 Fonctionnalités de Visualisation

Le script `view-logs.sh` inclut :

- **Couleurs automatiques** :
  - 🟢 Vert : Messages de succès (`✓`)
  - 🔴 Rouge : Erreurs (`❌`, `Error`)
  - 🟡 Jaune : Avertissements (`⚠️`, `Warning`)
  - 🔵 Cyan : Messages de démarrage (`🚀`, `Starting`)
  - ⚪ Blanc : Autres messages

- **Filtrage** : Recherche par pattern avec `--grep`
- **Limitation** : Nombre de lignes avec `--tail`

## 📊 Exemples d'Utilisation

### Surveiller les Erreurs

```bash
# Voir toutes les erreurs récentes
npm run logs --grep "error"

# Surveiller en temps réel
tail -f /data/dalon974/logs/dev.log | grep "error"
```

### Analyser les Performances

```bash
# Voir les temps de compilation
npm run logs --grep "compiled"

# Voir les requêtes API
npm run logs --grep "GET\|POST"
```

### Débogage

```bash
# Voir les 100 dernières lignes
npm run logs --tail 100

# Filtrer par timestamp
npm run logs --grep "2025-09-04 22:"
```

## 🧹 Gestion de l'Espace Disque

### Rotation Automatique

Les logs sont automatiquement nettoyés pour éviter qu'ils deviennent trop volumineux :

- **Conservation** : 30 jours par défaut
- **Sauvegarde** : Les anciens logs sont compressés et archivés
- **Compression** : Option `--compress` pour gagner de l'espace

### Nettoyage Manuel

```bash
# Nettoyage complet avec compression
./scripts/cleanup-logs.sh --keep-days 7 --compress

# Voir l'impact avant de nettoyer
./scripts/cleanup-logs.sh --dry-run
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```bash
# Personnaliser les dossiers de logs
export LOG_DIR="/custom/logs/path"
export BACKUP_DIR="/custom/backup/path"
```

### Scripts Personnalisés

Vous pouvez créer vos propres scripts de log en vous basant sur les exemples :

```bash
# Exemple : Logs avec filtrage personnalisé
#!/bin/bash
./scripts/view-logs.sh dev --grep "dashboard\|api" --tail 200
```

## 📈 Monitoring et Alertes

### Surveillance Continue

```bash
# Script de monitoring (à ajouter à crontab)
#!/bin/bash
ERROR_COUNT=$(./scripts/view-logs.sh dev --grep "error" | wc -l)
if [ $ERROR_COUNT -gt 10 ]; then
    echo "⚠️ Trop d'erreurs détectées: $ERROR_COUNT"
    # Envoyer une alerte
fi
```

### Intégration avec des Outils

Les logs peuvent être intégrés avec :
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Grafana** pour la visualisation
- **Prometheus** pour les métriques
- **Sentry** pour le monitoring d'erreurs

## 🚨 Dépannage

### Problèmes Courants

1. **Logs trop volumineux**
   ```bash
   # Nettoyer immédiatement
   ./scripts/cleanup-logs.sh --keep-days 1
   ```

2. **Permissions insuffisantes**
   ```bash
   # Corriger les permissions
   chmod +x /data/dalon974/scripts/*.sh
   ```

3. **Logs non horodatés**
   ```bash
   # Ajouter des horodatages aux logs existants
   ./scripts/add-timestamps-to-logs.sh
   ```

### Support

En cas de problème :
1. Vérifiez les permissions des scripts
2. Consultez les logs de sauvegarde
3. Utilisez le mode `--dry-run` pour tester
4. Vérifiez l'espace disque disponible

## 📚 Ressources

- [Documentation Next.js - Logging](https://nextjs.org/docs/advanced-features/debugging)
- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [Log Management Best Practices](https://www.elastic.co/guide/en/logstash/current/logstash-best-practices.html)
