# Gestion de Version Conditionnelle - Dalon974

## Vue d'ensemble

Le système de gestion de version a été modifié pour que l'augmentation automatique de version du serveur de développement ne se fasse que s'il y a eu des modifications depuis le dernier démarrage.

## Problème résolu

**Avant :** La version de développement s'incrémentait automatiquement à chaque redémarrage du serveur, même sans modifications.

**Après :** La version ne s'incrémente que s'il y a eu des modifications détectées depuis le dernier démarrage.

## Fonctionnement

### Détection des modifications

Le système utilise deux méthodes pour détecter les modifications :

1. **Méthode Git (prioritaire)** :
   - Vérifie les modifications non commitées (`git diff-index`)
   - Vérifie les nouveaux commits depuis le dernier démarrage
   - Utilise le timestamp du dernier démarrage stocké dans `.last-dev-start`

2. **Méthode par timestamp (fallback)** :
   - Si le projet n'est pas un repository git
   - Vérifie les fichiers modifiés depuis le dernier démarrage
   - Exclut les dossiers `node_modules`, `.git`, `.next`

### Fichiers de suivi

- **`.last-dev-start`** : Fichier temporaire stockant le timestamp du dernier démarrage
- **`dev/package.json`** : Contient la version actuelle du serveur de développement

### Scripts disponibles

```bash
# Démarrer le serveur de développement (avec vérification conditionnelle)
npm run dev

# Tester l'incrémentation automatique (ancien test)
npm run test:auto-version

# Tester l'incrémentation conditionnelle (nouveau test)
npm run test:version-increment

# Gestion manuelle des versions
npm run version:show      # Afficher les versions actuelles
npm run version:patch     # Incrémenter version patch
npm run version:minor     # Incrémenter version minor
npm run version:major     # Incrémenter version major
npm run version:set       # Définir une version spécifique
```

## Scénarios d'utilisation

### 1. Premier démarrage
- Création du fichier `.last-dev-start`
- Pas d'incrémentation de version

### 2. Redémarrage sans modifications
- Détection : aucune modification depuis le dernier démarrage
- Action : pas d'incrémentation de version
- Message : "ℹ️ Aucune modification détectée, pas d'incrémentation de version"

### 3. Redémarrage avec modifications
- Détection : modifications non commitées ou nouveaux commits
- Action : incrémentation automatique de la version patch
- Message : "✅ Version de développement incrémentée automatiquement"

### 4. Redémarrage avec modifications non commitées
- Détection : fichiers modifiés mais non commités
- Action : incrémentation de la version
- Message : "Modifications non commitées détectées"

## Logs et messages

### Messages informatifs
```
🔍 Vérification des modifications depuis le dernier démarrage...
ℹ️ Aucune modification détectée depuis le dernier démarrage
ℹ️ Aucune modification détectée, pas d'incrémentation de version
```

### Messages de succès
```
✅ Modifications détectées depuis le dernier démarrage
🔄 Modifications détectées, incrémentation de la version...
✅ Version de développement incrémentée automatiquement
```

### Messages d'avertissement
```
⚠️ Impossible d'incrémenter la version automatiquement
⚠️ Script de gestion de version non trouvé
```

## Configuration

### Variables d'environnement
Aucune variable d'environnement spécifique requise.

### Fichiers de configuration
- `scripts/start-dev.sh` : Script principal de démarrage
- `scripts/version-manager.js` : Gestionnaire de versions
- `.last-dev-start` : Fichier de suivi (créé automatiquement)

## Tests

### Test automatique
```bash
npm run test:version-increment
```

Ce test :
1. Crée un fichier de test
2. Simule un redémarrage (devrait incrémenter la version)
3. Supprime le fichier de test
4. Simule un autre redémarrage (ne devrait pas incrémenter)

### Test manuel
1. Démarrer le serveur : `npm run dev`
2. Modifier un fichier
3. Redémarrer le serveur : `npm run dev`
4. Vérifier que la version a été incrémentée
5. Redémarrer sans modification
6. Vérifier que la version n'a pas changé

## Dépannage

### Problème : Version toujours incrémentée
- Vérifier que le fichier `.last-dev-start` existe
- Vérifier les permissions du fichier
- Vérifier que git fonctionne correctement

### Problème : Version jamais incrémentée
- Vérifier que le script `version-manager.js` existe
- Vérifier les permissions d'écriture sur `dev/package.json`
- Vérifier les logs pour les erreurs

### Problème : Fichier `.last-dev-start` manquant
- Le fichier est recréé automatiquement au prochain démarrage
- Pas d'action requise

## Sécurité

- Le fichier `.last-dev-start` est ignoré par git (dans `.gitignore`)
- Aucune information sensible n'est stockée
- Les timestamps sont en format Unix (secondes depuis epoch)

## Maintenance

### Nettoyage
Le fichier `.last-dev-start` peut être supprimé manuellement si nécessaire. Il sera recréé au prochain démarrage.

### Migration
Pour les projets existants, le système s'adapte automatiquement :
- Premier démarrage : création du fichier de référence
- Détection automatique du type de projet (git ou non)
- Fallback vers la méthode par timestamp si nécessaire
