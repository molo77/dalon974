# Guide d'automatisation ProtonVPN

## 🚀 Connexion automatique ProtonVPN

### Fonctionnalités automatiques

Le script `scrape-lbc-proton-auto.js` automatise complètement la gestion de ProtonVPN :

- ✅ **Lancement automatique** de l'application ProtonVPN
- ✅ **Connexion automatique** au serveur le plus rapide
- ✅ **Déconnexion automatique** avant changement d'IP
- ✅ **Reconnexion automatique** à un nouveau serveur
- ✅ **Vérification automatique** du changement d'IP

## 🔧 Prérequis

### 1. Installation de ProtonVPN
```bash
# Télécharger depuis
https://protonvpn.com/download

# Ou installer via package manager
# Windows : Télécharger l'exe
# macOS : Télécharger le dmg
# Linux : sudo apt install protonvpn
```

### 2. Configuration du compte
1. **Créer un compte** sur https://account.protonvpn.com/signup
2. **Choisir un plan** (gratuit ou payant)
3. **Confirmer l'email**
4. **Noter les identifiants**

### 3. Première connexion manuelle
1. **Lancer ProtonVPN**
2. **Se connecter** avec vos identifiants
3. **Tester la connexion** sur https://whatismyipaddress.com/
4. **Fermer l'application**

## 🤖 Fonctionnement de l'automatisation

### Sur Windows
Le script utilise PowerShell pour automatiser l'interface ProtonVPN :

```powershell
# Détection automatique du processus ProtonVPN
$protonWindow = Get-Process | Where-Object {$_.ProcessName -like "*ProtonVPN*"}

# Activation de la fenêtre
$shell = New-Object -ComObject WScript.Shell
$shell.AppActivate($protonWindow.ProcessName)

# Connexion automatique (Ctrl+Shift+C)
[System.Windows.Forms.SendKeys]::SendWait("^+C")

# Déconnexion automatique (Ctrl+Shift+D)
[System.Windows.Forms.SendKeys]::SendWait("^+D")
```

### Sur macOS/Linux
L'automatisation est limitée, le script demande une intervention manuelle.

## 📋 Serveurs utilisés

### Rotation automatique
Le script utilise ces serveurs dans l'ordre :
1. **FR#1** - France (gratuit)
2. **NL#1** - Pays-Bas (gratuit)
3. **DE#1** - Allemagne (gratuit)
4. **FR#2** - France (payant)
5. **NL#2** - Pays-Bas (payant)
6. **DE#2** - Allemagne (payant)

### Logique de sélection
- **Serveur aléatoire** à chaque tentative
- **Évite la répétition** du même serveur
- **Priorité aux serveurs gratuits** si disponibles

## 🔍 Vérification automatique

### Changement d'IP
Le script vérifie automatiquement :
```bash
# Avant connexion
🌐 IP actuelle: 92.130.119.8

# Après connexion
🌐 Nouvelle IP: 185.159.157.12
✅ IP changée avec succès !
```

### Détection d'échec
Si l'IP ne change pas :
```
⚠️ IP non changée ou impossible à vérifier
💡 Vérifiez que ProtonVPN est bien configuré
```

## 🛠️ Configuration avancée

### Chemins d'installation détectés
Le script cherche ProtonVPN dans ces emplacements :

**Windows :**
- `C:\Program Files\Proton Technologies\ProtonVPN\ProtonVPN.exe`
- `C:\Program Files (x86)\Proton Technologies\ProtonVPN\ProtonVPN.exe`
- `C:\Users\%USERNAME%\AppData\Local\Programs\ProtonVPN\ProtonVPN.exe`

**macOS :**
- `/Applications/ProtonVPN.app/Contents/MacOS/ProtonVPN`

**Linux :**
- `/usr/bin/protonvpn`
- `/usr/local/bin/protonvpn`

### Personnalisation des serveurs
Modifiez le tableau `servers` dans le script :
```javascript
const PROTONVPN_CONFIG = {
  servers: ['FR#1', 'NL#1', 'DE#1', 'FR#2', 'NL#2', 'DE#2']
};
```

## 🔒 Sécurité

### Bonnes pratiques
1. **Compte dédié** pour le scraping
2. **Identifiants sécurisés**
3. **Rotation des serveurs**
4. **Surveillance des logs**

### Limitations
- **Windows uniquement** pour l'automatisation complète
- **macOS/Linux** nécessitent intervention manuelle
- **Dépendance** à l'interface graphique ProtonVPN

## 🔍 Dépannage

### Problème : "ProtonVPN non trouvé"
**Solutions :**
1. Vérifiez l'installation de ProtonVPN
2. Redémarrez l'ordinateur
3. Réinstallez ProtonVPN
4. Vérifiez les permissions

### Problème : "Fenêtre ProtonVPN non trouvée"
**Solutions :**
1. Fermez toutes les instances ProtonVPN
2. Relancez l'application
3. Vérifiez que l'application est visible
4. Redémarrez le script

### Problème : "Connexion échoue"
**Solutions :**
1. Vérifiez vos identifiants
2. Testez la connexion manuellement
3. Vérifiez votre abonnement
4. Contactez le support ProtonVPN

## 📊 Monitoring

### Logs automatiques
Le script génère des logs détaillés :
```
🚀 Lancement de ProtonVPN...
✅ ProtonVPN lancé
🔌 Connexion automatique à ProtonVPN...
🎯 Connexion au serveur: FR#1
✅ Connexion ProtonVPN initiée
🌐 Nouvelle IP: 185.159.157.12
✅ IP changée avec succès !
```

### Capture d'écran
Le script sauvegarde automatiquement :
- `lbc-proton-auto-result.png` - Résultat final

## 🆘 Support

### En cas de problème
1. **Vérifiez les logs** dans la console
2. **Testez ProtonVPN** manuellement
3. **Consultez la capture d'écran**
4. **Contactez le support** si nécessaire

### Ressources utiles
- **ProtonVPN Support** : https://protonvpn.com/support/
- **Documentation** : https://protonvpn.com/support/
- **Forum** : https://www.reddit.com/r/ProtonVPN/

---

*Dernière mise à jour : Décembre 2024*
