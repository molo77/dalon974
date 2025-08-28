# 🕷️ Scraper avec Affichage Terminal et Option ProtonVPN

## 📋 Vue d'ensemble

Le scraper Leboncoin a été amélioré avec :
- **Affichage détaillé des étapes dans le terminal** avec emojis et couleurs
- **Option pour désactiver ProtonVPN** via variable d'environnement
- **Logs informatifs** pour un meilleur suivi du processus

## 🚀 Nouvelles Fonctionnalités

### 1. Affichage Terminal Amélioré

#### Étapes Visibles dans le Terminal
```
🚀 [ÉTAPE 1/5] Initialisation du scraper...
🔌 [VPN] ProtonVPN désactivé par configuration
✅ [ÉTAPE 1/5] Initialisation terminée

📋 [ÉTAPE 2/5] Collecte des annonces...
🔍 URL de recherche: https://www.leboncoin.fr/recherche?category=11&locations=r_26
📄 Pages à traiter: 1
🎯 Annonces max: 40
📄 [PAGE 1/1] Navigation vers la page...
📄 [PAGE 1/1] Chargement du contenu...
📄 [PAGE 1/1] Contenu chargé avec succès
📄 [PAGE 1/1] 25 annonces trouvées
📊 [RÉSUMÉ] Total annonces collectées: 25
✅ [ÉTAPE 2/5] Collecte terminée - 25 annonces trouvées

🔍 [ÉTAPE 3/5] Récupération des détails...
🔍 [DÉTAILS] Limite de traitement: 12
🔍 [DÉTAIL 1/12] Traitement: Colocation 2 chambres Saint-Denis...
🔍 [DÉTAIL 2/12] Traitement: Studio meublé Saint-Pierre...
...
✅ [ÉTAPE 3/5] Récupération des détails terminée

💾 [ÉTAPE 4/5] Export des données...
✅ [ÉTAPE 4/5] Export terminé

💾 [ÉTAPE 5/5] Sauvegarde en base de données...
✅ [ÉTAPE 5/5] Sauvegarde terminée - 8 créées, 4 mises à jour, 0 ignorées

🎉 [SCRAPER] Toutes les étapes terminées avec succès !
📈 [STATISTIQUES FINALES]
   • Annonces collectées: 25
   • Annonces traitées: 12
   • Nouvelles annonces: 8
   • Annonces mises à jour: 4
   • Annonces ignorées: 0
```

### 2. Option ProtonVPN

#### Variable d'Environnement
```bash
# Activer ProtonVPN (défaut)
LBC_USE_PROTONVPN=true

# Désactiver ProtonVPN
LBC_USE_PROTONVPN=false
```

#### Comportement
- **Activé** : Le script tente de se connecter à ProtonVPN avant le scraping
- **Désactivé** : Le scraping se lance directement sans VPN
- **Défaut** : ProtonVPN est activé (`true`)

## 🔧 Configuration

### Variables d'Environnement

#### Option ProtonVPN
```bash
# Dans .env.local ou .env
LBC_USE_PROTONVPN=false  # Désactiver ProtonVPN
LBC_USE_PROTONVPN=true   # Activer ProtonVPN (défaut)
```

#### Autres Variables
```bash
LBC_SEARCH_URL=https://www.leboncoin.fr/recherche?category=11&locations=r_26
LBC_BROWSER_HEADLESS=true
LBC_MAX=40
LBC_FETCH_DETAILS=true
LBC_DETAIL_LIMIT=12
LBC_PAGES=1
LBC_DEBUG=false
```

## 🎯 Utilisation

### 1. Scraping avec ProtonVPN (défaut)
```bash
node scripts/scrape-leboncoin-colocation.cjs
```

### 2. Scraping sans ProtonVPN
```bash
# Option 1: Variable d'environnement
LBC_USE_PROTONVPN=false node scripts/scrape-leboncoin-colocation.cjs

# Option 2: Dans .env.local
echo "LBC_USE_PROTONVPN=false" >> .env.local
node scripts/scrape-leboncoin-colocation.cjs
```

### 3. Via l'Interface Admin
1. Aller sur `/admin` → Onglet "🕷️ Scraper"
2. Configurer `LBC_USE_PROTONVPN=false` dans les paramètres
3. Lancer le scraper

## 🧪 Tests

### Test de l'Option ProtonVPN
```bash
node scripts/test-protonvpn-option.js
```

### Test des Étapes
```bash
node scripts/test-scraper-steps.js
```

### Démonstration Interactive
```bash
node scripts/demo-scraper-steps.js
```

## 📊 Avantages

### Affichage Terminal
- **Visibilité** : Suivi en temps réel du processus
- **Debugging** : Identification rapide des problèmes
- **UX** : Interface claire avec emojis et couleurs
- **Monitoring** : Statistiques détaillées

### Option ProtonVPN
- **Flexibilité** : Choix d'utiliser ou non le VPN
- **Performance** : Scraping plus rapide sans VPN
- **Fiabilité** : Moins de dépendances externes
- **Configuration** : Facile à activer/désactiver

## 🔍 Détails Techniques

### Gestion ProtonVPN
```javascript
// Fonction handleProtonVPN()
if (!USE_PROTONVPN) {
  console.log('🔌 [VPN] ProtonVPN désactivé par configuration');
  return;
}
```

### Affichage des Étapes
```javascript
// Étape avec progression
console.log('🚀 [ÉTAPE 1/5] Initialisation du scraper...');
console.log('📄 [PAGE 1/3] Navigation vers la page...');
console.log('🔍 [DÉTAIL 1/12] Traitement: Colocation...');
```

### Statistiques Finales
```javascript
console.log('📈 [STATISTIQUES FINALES]');
console.log('   • Annonces collectées:', total);
console.log('   • Nouvelles annonces:', created);
console.log('   • Annonces mises à jour:', updated);
```

## 🚀 Cas d'Usage

### 1. Développement Local
```bash
# Scraping rapide sans VPN
LBC_USE_PROTONVPN=false node scripts/scrape-leboncoin-colocation.cjs
```

### 2. Production avec VPN
```bash
# Scraping sécurisé avec VPN
LBC_USE_PROTONVPN=true node scripts/scrape-leboncoin-colocation.cjs
```

### 3. Debugging
```bash
# Mode debug avec affichage détaillé
LBC_DEBUG=true LBC_USE_PROTONVPN=false node scripts/scrape-leboncoin-colocation.cjs
```

## 🔮 Évolutions Futures

- **Couleurs dans le terminal** : Support des couleurs ANSI
- **Barre de progression** : Affichage visuel de la progression
- **Logs structurés** : Export des logs en JSON
- **Notifications** : Alertes en temps réel
- **Métriques avancées** : Temps par étape, performance
