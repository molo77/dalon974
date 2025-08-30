# Arrêt des Serveurs lors de la Synchronisation

## Vue d'ensemble

Ce document décrit le processus d'arrêt automatique des serveurs lors des opérations de synchronisation entre les environnements de développement et de production.

## Pourquoi arrêter les serveurs ?

### Avantages de l'arrêt des serveurs
- **Cohérence des données** : Évite les conflits de lecture/écriture pendant la synchronisation
- **Intégrité de la base de données** : Prévient les erreurs de verrouillage
- **Sécurité** : Garantit que les modifications sont appliquées proprement
- **Fiabilité** : Évite les états incohérents entre les environnements

### Processus sécurisé
- **Arrêt propre** : Les serveurs sont arrêtés proprement avant synchronisation
- **Redémarrage automatique** : Les serveurs sont redémarrés automatiquement après synchronisation
- **Vérification** : Contrôle de santé après redémarrage

## Scripts modifiés

### 1. Déploiement complet
- **Script** : `scripts/deploy-dev-to-prod.sh`
- **Commande** : `./scripts/deploy-dev-to-prod.sh`

#### Processus :
1. ✅ Arrêt des serveurs (dev + prod)
2. ✅ Sauvegarde de l'environnement de production
3. ✅ Nettoyage de l'environnement de production
4. ✅ Copie des fichiers de dev vers prod
5. ✅ Installation des dépendances
6. ✅ Build de l'application
7. ✅ Synchronisation de la structure MySQL
8. ✅ Redémarrage des serveurs (dev + prod)
9. ✅ Vérification de santé
10. ✅ Nettoyage des anciennes sauvegardes

### 2. Synchronisation MySQL
- **Script** : `scripts/sync-database-structure.sh`
- **Commande** : `npm run sync-db-structure`

#### Processus :
1. ✅ Arrêt des serveurs (dev + prod)
2. ✅ Sauvegarde de la base de production
3. ✅ Export de la structure de développement
4. ✅ Application de la structure à la production
5. ✅ Vérification de la synchronisation
6. ✅ Nettoyage des fichiers temporaires
7. ✅ Redémarrage des serveurs (dev + prod)

### 3. Copie d'utilisateurs
- **Script** : `scripts/copy-users-to-prod.sh`
- **Commande** : `npm run copy-users`

#### Processus :
1. ✅ Arrêt des serveurs (dev + prod)
2. ✅ Vérification des utilisateurs en développement
3. ✅ Création d'utilisateurs par défaut (si nécessaire)
4. ✅ Sauvegarde de la table User de production
5. ✅ Export des utilisateurs de développement
6. ✅ Application à la production
7. ✅ Vérification de la copie
8. ✅ Nettoyage des fichiers temporaires
9. ✅ Redémarrage des serveurs (dev + prod)

## Fonctions d'arrêt et redémarrage

### Arrêt des serveurs
```bash
stop_servers() {
    log_info "Arrêt des serveurs avant synchronisation..."
    
    # Arrêt du serveur de développement
    log_info "Arrêt du serveur de développement..."
    pkill -f "next dev.*:3001" || true
    sleep 2
    
    # Arrêt du serveur de production
    log_info "Arrêt du serveur de production..."
    pkill -f "next start.*:3000" || true
    sleep 2
    
    log_success "Serveurs arrêtés"
}
```

### Redémarrage des serveurs
```bash
restart_servers() {
    log_info "Redémarrage des serveurs après synchronisation..."
    
    # Redémarrage du serveur de développement
    log_info "Redémarrage du serveur de développement..."
    bash "$DEV_DIR/scripts/dev-start.sh" &
    sleep 5
    
    # Redémarrage du serveur de production
    log_info "Redémarrage du serveur de production..."
    bash "$PROD_DIR/scripts/prod-start.sh" &
    sleep 5
    
    log_success "Serveurs redémarrés"
}
```

## Utilisation

### Déploiement complet avec arrêt des serveurs
```bash
./scripts/deploy-dev-to-prod.sh
```

### Synchronisation MySQL avec arrêt des serveurs
```bash
npm run sync-db-structure
```

### Copie d'utilisateurs avec arrêt des serveurs
```bash
npm run copy-users
```

## Sécurité

### Gestion des erreurs
- **Arrêt sécurisé** : Utilisation de `|| true` pour éviter les erreurs si les serveurs ne sont pas en cours d'exécution
- **Délais** : Pauses entre les opérations pour assurer la stabilité
- **Logs** : Toutes les opérations sont tracées

### Vérification post-redémarrage
- **Contrôle de santé** : Vérification que les serveurs répondent correctement
- **Logs** : Surveillance des logs de démarrage
- **Ports** : Vérification que les ports sont bien ouverts

## Avantages

### Pour le développement
- **Cohérence** : Garantit que les modifications sont appliquées proprement
- **Fiabilité** : Évite les erreurs de synchronisation
- **Traçabilité** : Processus clairement documenté et loggé

### Pour la production
- **Sécurité** : Pas de risque de corruption de données
- **Stabilité** : Serveurs redémarrés proprement
- **Maintenance** : Processus automatisé et sécurisé

## Dépannage

### Serveurs qui ne redémarrent pas
```bash
# Vérification manuelle des processus
ps aux | grep next

# Redémarrage manuel
npm run dev:start
npm run prod:start
```

### Erreurs de port déjà utilisé
```bash
# Vérification des ports
lsof -i :3001
lsof -i :3000

# Nettoyage des processus
pkill -f "next dev.*:3001"
pkill -f "next start.*:3000"
```

### Logs de démarrage
```bash
# Logs de développement
tail -f dev/logs/dev.log

# Logs de production
tail -f prod/logs/prod.log
```

## Monitoring

### Vérification de l'état des serveurs
```bash
# Vérification de santé
npm run health-check:dev
npm run health-check:prod

# Statut des environnements
npm run manage:dev status
npm run manage:prod status
```

### Surveillance continue
- **Logs** : Surveillance des logs de démarrage
- **Ports** : Vérification que les ports sont ouverts
- **Réponse** : Test des endpoints de santé

## Conclusion

L'arrêt automatique des serveurs lors de la synchronisation garantit :

- **Cohérence** des données entre les environnements
- **Sécurité** des opérations de synchronisation
- **Fiabilité** du processus de déploiement
- **Traçabilité** complète des opérations

Le système est maintenant robuste et sécurisé pour les opérations de synchronisation en production.
