# Guide d'utilisation du scraper avec changement d'IP automatique

## 🚀 Lancement du scraper

### Via l'interface admin
1. Allez dans la section **Admin > Scraper**
2. Cliquez sur **"Lancer le scraper"**
3. Le script s'exécutera avec gestion automatique des blocages

### Via la ligne de commande
```bash
# Avec la base de données
$env:DATABASE_URL="mysql://molo:Bulgroz%401977@mysql-molo.alwaysdata.net:3306/molo_dalon974"; node scripts/scrape-lbc-ip-changer.js
```

## 🔄 Méthodes de changement d'IP

Le script utilise 4 méthodes différentes pour contourner les blocages :

### 1. Redémarrage du routeur (`router_restart`)
**Instructions :**
1. Débranchez l'alimentation du routeur
2. Attendez 30 secondes
3. Rebranchez l'alimentation
4. Attendez que la connexion soit rétablie
5. Appuyez sur Entrée pour continuer

**Avantages :** Simple, efficace, gratuit
**Inconvénients :** Interrompt temporairement la connexion

### 2. VPN manuel (`vpn_manual`)
**Instructions :**
1. Ouvrez votre client VPN (ProtonVPN, NordVPN, etc.)
2. Connectez-vous à un serveur français ou européen
3. Vérifiez que l'IP a changé
4. Appuyez sur Entrée pour continuer

**Avantages :** Rapide, fiable
**Inconvénients :** Nécessite un abonnement VPN

### 3. Rotation de proxy (`proxy_rotation`)
**Instructions :**
1. Configurez un proxy français
2. Ou utilisez un service de rotation de proxy
3. Appuyez sur Entrée pour continuer

**Avantages :** Peut être automatisé
**Inconvénients :** Configuration complexe

### 4. Attente et retry (`wait_and_retry`)
**Instructions :**
- Le script attend automatiquement 5 minutes
- Puis réessaie avec la même IP

**Avantages :** Aucune action requise
**Inconvénients :** Peut ne pas fonctionner

## 📋 Fonctionnement du script

### Phase 1 : Initialisation
- ✅ Vérification de la configuration
- ✅ Récupération du token Datadome
- ✅ Lancement du navigateur en mode visible
- ✅ Configuration anti-détection

### Phase 2 : Tentatives de scraping
- 🔍 Navigation vers Leboncoin
- 🚨 Détection automatique des blocages
- 🔄 Changement d'IP si nécessaire
- 🤖 Simulation d'un comportement humain
- 📊 Récupération des annonces

### Phase 3 : Résultats
- ✅ Mise à jour du token Datadome
- 📸 Capture d'écran de résultat
- 📋 Affichage des annonces trouvées

## 🛠️ Configuration

### Variables d'environnement
```bash
LBC_SEARCH_URL=https://www.leboncoin.fr/recherche?category=11&locations=r_26
LBC_BROWSER_HEADLESS=false
LBC_MAX=40
LBC_FETCH_DETAILS=true
LBC_DETAIL_LIMIT=12
LBC_PAGES=1
LBC_DEBUG=false
```

### Token Datadome
Le script récupère automatiquement le token Datadome depuis la base de données et le met à jour si nécessaire.

## 🔍 Dépannage

### Problème : "Aucune annonce trouvée"
**Solutions :**
1. Vérifiez que l'URL de recherche est correcte
2. Changez d'IP avec une des méthodes proposées
3. Attendez quelques heures
4. Essayez depuis un autre réseau

### Problème : "Blocage détecté"
**Solutions :**
1. Suivez les instructions de changement d'IP
2. Utilisez un VPN
3. Redémarrez votre routeur
4. Attendez que le blocage expire

### Problème : "Erreur de connexion"
**Solutions :**
1. Vérifiez votre connexion internet
2. Vérifiez la configuration de la base de données
3. Redémarrez le script

## 📊 Monitoring

### Vérification de l'IP
Le script affiche automatiquement :
- 🌐 IP initiale
- 🌐 IP après chaque changement
- ✅ Confirmation du changement d'IP

### Logs détaillés
Le script affiche :
- 📋 Configuration utilisée
- 🔍 Progression du scraping
- 🚨 Détection des blocages
- 📊 Résultats obtenus

## 🔒 Sécurité

### Bonnes pratiques
1. **Utilisez un VPN dédié** pour le scraping
2. **Ne partagez pas vos identifiants**
3. **Changez régulièrement d'IP**
4. **Respectez les conditions d'utilisation**

### Anti-détection
Le script utilise :
- 🤖 User agents aléatoires
- 🍪 Cookies Datadome
- 📱 Headers réalistes
- 🖱️ Simulation de comportement humain
- 🔒 Masquage de l'automation

## 📞 Support

### En cas de problème
1. **Vérifiez les logs** affichés dans la console
2. **Consultez la capture d'écran** : `lbc-ip-changer-result.png`
3. **Essayez une autre méthode** de changement d'IP
4. **Contactez le support** si le problème persiste

### Ressources utiles
- 📖 [Guide de déblocage](scripts/deblocage-guide.md)
- 🔧 [Installation ProtonVPN](INSTALL_PROTONVPN.md)
- 📋 [Configuration du scraper](README.md)

---

*Dernière mise à jour : Décembre 2024*
