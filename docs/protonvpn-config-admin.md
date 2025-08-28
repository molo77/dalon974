# 🔌 Configuration ProtonVPN dans l'Interface Admin

## 🎯 Vue d'ensemble

La variable `LBC_USE_PROTONVPN` a été ajoutée aux configurations du scraper dans l'interface d'administration, permettant de contrôler facilement l'utilisation de ProtonVPN sans modifier les fichiers d'environnement.

## 🚀 Fonctionnalités

### 1. Configuration dans l'Interface Admin
- **Champ visible** : `LBC_USE_PROTONVPN` apparaît dans la liste des configurations
- **Valeur par défaut** : `true` (ProtonVPN activé par défaut)
- **Modification en temps réel** : Changement immédiat via l'interface
- **Persistance** : Sauvegarde automatique en base de données

### 2. Comportement du Scraper
- **`true`** : Le scraper tente de se connecter à ProtonVPN avant le scraping
- **`false`** : Le scraper se lance directement sans VPN
- **Défaut** : `true` (sécurité maximale)

## 🎨 Interface Utilisateur

### Accès à la Configuration
1. **Admin Panel** : Aller sur `/admin`
2. **Onglet Scraper** : Cliquer sur "🕷️ Scraper"
3. **Afficher Config** : Cliquer sur "🔼 Afficher config"
4. **Modifier** : Changer la valeur de `LBC_USE_PROTONVPN`

### Champ de Configuration
```jsx
// Dans l'interface admin
<label>LBC_USE_PROTONVPN</label>
<input 
  type="text"
  value="true"  // ou "false"
  placeholder="true"
  onChange={updateCfgField}
/>
```

## 🔧 Configuration Technique

### Valeur par Défaut
```javascript
const DEFAULT_SCRAPER_CONFIG = {
  // ... autres configurations
  LBC_USE_PROTONVPN: 'true'  // Activé par défaut
};
```

### Liste des Champs
```javascript
const fields = [
  'LBC_SEARCH_URL',
  'LBC_BROWSER_HEADLESS',
  'LBC_MAX',
  'LBC_FETCH_DETAILS',
  'LBC_DETAIL_LIMIT',
  'LBC_DETAIL_SLEEP',
  'LBC_PAGES',
  'LBC_VERBOSE_LIST',
  'LBC_EXPORT_JSON',
  'LBC_NO_DB',
  'LBC_UPDATE_COOLDOWN_HOURS',
  'LBC_EXTRA_SLEEP',
  'LBC_COOKIES',
  'LBC_DATADOME',
  'DATADOME_TOKEN',
  'LBC_DEBUG',
  'LBC_USE_PROTONVPN'  // Nouveau champ
];
```

## 🎯 Utilisation

### 1. Activation de ProtonVPN (Recommandé)
```bash
# Dans l'interface admin
LBC_USE_PROTONVPN = true
```
**Avantages** :
- Protection contre le blocage IP
- Rotation automatique des serveurs
- Scraping plus fiable
- Respect des limites de Leboncoin

### 2. Désactivation de ProtonVPN (Développement)
```bash
# Dans l'interface admin
LBC_USE_PROTONVPN = false
```
**Avantages** :
- Scraping plus rapide
- Pas de dépendance VPN
- Debugging plus facile
- Tests locaux

### 3. Changement Dynamique
1. **Modifier** : Changer la valeur dans l'interface
2. **Sauvegarder** : Cliquer sur "Sauvegarder config"
3. **Lancer** : Le prochain scraper utilisera la nouvelle configuration

## 🔄 Intégration avec le Scraper

### Script Principal
```javascript
// Dans scripts/scrape-leboncoin-colocation.cjs
const USE_PROTONVPN = (process.env.LBC_USE_PROTONVPN || 'true').toLowerCase() === 'true';

async function handleProtonVPN() {
  if (!USE_PROTONVPN) {
    console.log('🔌 [VPN] ProtonVPN désactivé par configuration');
    return;
  }
  // ... logique ProtonVPN
}
```

### API de Configuration
```javascript
// GET /api/admin/scraper/settings
{
  "LBC_USE_PROTONVPN": "true",
  // ... autres configurations
}

// POST /api/admin/scraper/settings
{
  "LBC_USE_PROTONVPN": "false"
}
```

## 🧪 Tests

### Test de l'Interface
```bash
node scripts/test-protonvpn-config.js
```

### Test du Scraper
```bash
# Avec ProtonVPN
LBC_USE_PROTONVPN=true node scripts/scrape-leboncoin-colocation.cjs

# Sans ProtonVPN
LBC_USE_PROTONVPN=false node scripts/scrape-leboncoin-colocation.cjs
```

## 📊 Cas d'Usage

### 1. Développement Local
```bash
# Configuration rapide pour les tests
LBC_USE_PROTONVPN = false
```
- **Avantages** : Rapidité, simplicité
- **Inconvénients** : Risque de blocage

### 2. Production
```bash
# Configuration sécurisée pour la production
LBC_USE_PROTONVPN = true
```
- **Avantages** : Fiabilité, sécurité
- **Inconvénients** : Légèrement plus lent

### 3. Debugging
```bash
# Configuration pour le debugging
LBC_USE_PROTONVPN = false
LBC_DEBUG = true
```
- **Avantages** : Logs détaillés, pas d'interférence VPN
- **Inconvénients** : Moins sécurisé

## 🔧 Maintenance

### Sauvegarde de Configuration
- **Automatique** : À chaque modification via l'interface
- **Manuelle** : Bouton "Sauvegarder config"
- **Restauration** : Bouton "Défauts vides"

### Migration
```javascript
// Ancienne méthode (variables d'environnement)
process.env.LBC_USE_PROTONVPN = 'true';

// Nouvelle méthode (interface admin)
// Modifier via l'interface web
```

## 🚀 Avantages

### Pour l'Utilisateur
- **Simplicité** : Configuration via interface graphique
- **Flexibilité** : Changement en temps réel
- **Visibilité** : Toutes les configurations centralisées
- **Persistance** : Sauvegarde automatique

### Pour le Développeur
- **Maintenance** : Configuration centralisée
- **Debugging** : Changement rapide des paramètres
- **Déploiement** : Pas de modification de fichiers
- **Documentation** : Interface auto-documentée

## 🔮 Évolutions Futures

- **Profils** : Configurations prédéfinies (Dev, Prod, Debug)
- **Historique** : Sauvegarde des configurations précédentes
- **Validation** : Vérification des valeurs avant sauvegarde
- **Notifications** : Alertes lors des changements de configuration
