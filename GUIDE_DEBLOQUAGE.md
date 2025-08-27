# Guide de Déblocage - Leboncoin

## 🚨 Vous avez été bloqué par Leboncoin ?

Ce guide vous aidera à contourner le blocage et reprendre le scraping.

## Solutions Rapides

### 1. **Changer d'Adresse IP** (Recommandé)

#### Option A : Redémarrage du Routeur
```bash
# Redémarrez votre routeur/box internet
# Attendez 2-3 minutes
# Vérifiez votre nouvelle IP sur whatismyipaddress.com
```

#### Option B : Utiliser un VPN
- **NordVPN** : https://nordvpn.com/
- **ExpressVPN** : https://expressvpn.com/
- **ProtonVPN** : https://protonvpn.com/ (gratuit)

#### Option C : Proxy Rotatif
```bash
# Utilisez des services comme :
# - Bright Data
# - Oxylabs
# - SmartProxy
```

### 2. **Attendre le Déblocage Automatique**

Les blocages temporaires expirent généralement après :
- **2-4 heures** pour les blocages légers
- **24-48 heures** pour les blocages plus sévères
- **1 semaine** pour les blocages permanents

### 3. **Changer de Navigateur**

```bash
# Testez avec différents navigateurs :
# - Chrome
# - Firefox
# - Edge
# - Safari
# - Mode navigation privée
```

### 4. **Contacter Leboncoin**

Si le blocage persiste :
- Email : support@leboncoin.fr
- Formulaire : https://www.leboncoin.fr/contact
- Mentionnez que vous êtes un utilisateur légitime

## Script de Déblocage Automatique

Utilisez le script `scrape-lbc-vpn.js` qui :

✅ **Détecte automatiquement les blocages**
✅ **Guide l'utilisateur pour débloquer**
✅ **Utilise des techniques anti-détection**
✅ **Simule un comportement humain**

```bash
# Lancer le script de déblocage
$env:DATABASE_URL="mysql://molo:Bulgroz%401977@mysql-molo.alwaysdata.net:3306/molo_dalon974"; node scripts/scrape-lbc-vpn.js
```

## Techniques Anti-Détection

### 1. **User Agents Rotatifs**
Le script utilise différents user agents pour éviter la détection.

### 2. **Comportement Humain**
- Scroll progressif
- Pauses aléatoires
- Mouvements de souris
- Temps de chargement variables

### 3. **Headers Réalistes**
```javascript
{
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive'
}
```

### 4. **Masquage de l'Automation**
```javascript
// Masquer webdriver
Object.defineProperty(navigator, 'webdriver', {
  get: () => undefined,
});
```

## Prévention des Blocages

### 1. **Limiter la Fréquence**
- Maximum 1 scraping par heure
- Pauses entre les requêtes
- Respect des rate limits

### 2. **Utiliser des Proxies**
```bash
# Configuration proxy dans le script
const proxyConfig = {
  server: 'proxy.example.com:8080',
  username: 'user',
  password: 'pass'
};
```

### 3. **Rotation des Sessions**
- Changer de session régulièrement
- Utiliser différents comptes
- Vider les cookies

### 4. **Monitoring**
```bash
# Surveiller les logs pour détecter les blocages
tail -f scraper.log | grep -i "block\|captcha\|forbidden"
```

## Solutions Avancées

### 1. **Réseau Tor**
```bash
# Installer Tor Browser
# Configurer le proxy SOCKS5
# Utiliser des circuits rotatifs
```

### 2. **Cloudflare Bypass**
```bash
# Utiliser des services comme :
# - 2captcha
# - Anti-Captcha
# - CapMonster
```

### 3. **API Alternatives**
```bash
# Considérer d'autres sources :
# - SeLoger
# - Bien'ici
# - PAP
# - Logic-Immo
```

## Vérification du Déblocage

### 1. **Test Manuel**
```bash
# Ouvrir Leboncoin dans un navigateur normal
# Vérifier que la page se charge
# Tester la recherche
```

### 2. **Test Automatique**
```bash
# Utiliser le script de test
node scripts/test-lbc-url.js
```

### 3. **Vérification IP**
```bash
# Vérifier votre IP actuelle
curl ifconfig.me
# ou
wget -qO- ifconfig.me
```

## Contact et Support

Si vous avez besoin d'aide :

1. **Vérifiez ce guide** en premier
2. **Testez les solutions** une par une
3. **Documentez les erreurs** rencontrées
4. **Contactez le support** avec les détails

## Notes Importantes

⚠️ **Respectez les conditions d'utilisation**
⚠️ **N'utilisez pas de techniques illégales**
⚠️ **Limitez la fréquence des requêtes**
⚠️ **Utilisez des données publiques uniquement**

---

*Dernière mise à jour : Décembre 2024*
