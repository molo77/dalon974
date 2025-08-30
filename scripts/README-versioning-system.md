# Système de Versioning - Dalon974

## Vue d'ensemble

Le système de versioning a été modifié pour permettre une gestion séparée des versions entre les environnements de développement et de production, avec la possibilité de synchroniser quand nécessaire.

## Principe de fonctionnement

### Versions séparées par défaut
- **Dev** : Version qui s'incrémente automatiquement lors du développement
- **Prod** : Version stable qui ne change que lors de la synchronisation

### Workflow recommandé
1. Développement avec incrémentation automatique de la version dev
2. Tests et validation en dev
3. Synchronisation de prod quand le code est prêt pour la production

## Commandes disponibles

### Commandes de base
```bash
# Afficher les versions actuelles
npm run version:show
# ou
node scripts/version-manager.js show

# Incrémenter la version de dev (patch/minor/major)
npm run version:patch
npm run version:minor
npm run version:major
# ou
node scripts/version-manager.js patch
node scripts/version-manager.js minor
node scripts/version-manager.js major

# Synchroniser prod avec la version de dev
npm run version:sync-prod
# ou
node scripts/version-manager.js sync-prod
```

### Commandes avancées
```bash
# Définir une version spécifique pour tous les environnements
node scripts/version-manager.js set 1.0.0

# Définir une version spécifique pour un environnement
node scripts/version-manager.js set 1.0.0 dev
node scripts/version-manager.js set 1.0.0 prod

# Afficher l'aide
node scripts/version-manager.js help
```

## Exemples d'utilisation

### Scénario 1 : Développement normal
```bash
# 1. Vérifier les versions actuelles
npm run version:show
# dev: 0.3.7, prod: 0.3.2

# 2. Développer et tester
# ... travail sur le code ...

# 3. Incrémenter la version de dev
npm run version:patch
# dev: 0.3.7 → 0.3.8, prod: reste à 0.3.2

# 4. Continuer le développement
# ... plus de travail ...

# 5. Incrémenter à nouveau
npm run version:minor
# dev: 0.3.8 → 0.4.0, prod: reste à 0.3.2
```

### Scénario 2 : Déploiement en production
```bash
# 1. Vérifier les versions
npm run version:show
# dev: 0.4.0, prod: 0.3.2

# 2. Tests finaux en dev
# ... tests de validation ...

# 3. Synchroniser prod avec dev
npm run version:sync-prod
# dev: 0.4.0, prod: 0.3.2 → 0.4.0

# 4. Déployer en production
# ... déploiement ...
```

### Scénario 3 : Correction d'urgence en production
```bash
# 1. Vérifier les versions
npm run version:show
# dev: 0.4.0, prod: 0.4.0

# 2. Créer une branche de correction
# ... travail sur la correction ...

# 3. Incrémenter la version de dev
npm run version:patch
# dev: 0.4.0 → 0.4.1, prod: reste à 0.4.0

# 4. Tester la correction
# ... tests ...

# 5. Synchroniser prod
npm run version:sync-prod
# dev: 0.4.1, prod: 0.4.0 → 0.4.1
```

## Avantages du nouveau système

### ✅ Séparation claire
- Dev et prod ont des versions différentes par défaut
- Pas de confusion entre les environnements

### ✅ Contrôle total
- Synchronisation manuelle uniquement quand nécessaire
- Possibilité de cibler un environnement spécifique

### ✅ Workflow flexible
- Développement continu sans impact sur prod
- Déploiement contrôlé avec synchronisation explicite

### ✅ Traçabilité
- Historique clair des versions
- Possibilité de revenir en arrière si nécessaire

## Intégration avec le système de démarrage

Le système de démarrage automatique (`scripts/start-dev.sh`) inclut maintenant une vérification conditionnelle :
- La version ne s'incrémente que s'il y a des modifications
- Seule la version de dev est affectée
- La version de prod reste stable

## Commandes npm disponibles

```bash
# Gestion des versions
npm run version:show        # Afficher les versions
npm run version:patch       # Incrémenter patch (dev)
npm run version:minor       # Incrémenter minor (dev)
npm run version:major       # Incrémenter major (dev)
npm run version:sync-prod   # Synchroniser prod avec dev

# Tests
npm run test:auto-version       # Test ancien système
npm run test:version-increment  # Test nouveau système
```

## Notes importantes

### 🔒 Sécurité
- Les versions de prod ne changent que manuellement
- Pas de risque d'incrémentation accidentelle

### 🔄 Workflow recommandé
1. Développer en dev avec incrémentation automatique
2. Tester et valider
3. Synchroniser prod quand prêt
4. Déployer

### 📝 Bonnes pratiques
- Toujours vérifier les versions avant synchronisation
- Documenter les changements majeurs
- Utiliser des messages de commit descriptifs

## Dépannage

### Problème : Versions désynchronisées
```bash
# Vérifier les versions
npm run version:show

# Synchroniser si nécessaire
npm run version:sync-prod
```

### Problème : Version incorrecte
```bash
# Définir une version spécifique
node scripts/version-manager.js set 1.0.0 dev
node scripts/version-manager.js set 1.0.0 prod
```

### Problème : Erreur de script
```bash
# Vérifier l'aide
node scripts/version-manager.js help

# Vérifier les permissions
chmod +x scripts/version-manager.js
```
