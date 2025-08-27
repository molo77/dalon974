# Installation de ProtonVPN GUI

## 📥 Téléchargement et installation

### 1. Télécharger ProtonVPN
- **Site officiel** : https://protonvpn.com/download
- **Sélectionnez** votre système d'exploitation (Windows, macOS, Linux)
- **Téléchargez** l'installateur

### 2. Installation sur Windows
1. **Exécutez** le fichier `.exe` téléchargé
2. **Suivez** l'assistant d'installation
3. **Redémarrez** votre ordinateur si demandé
4. **Lancez** ProtonVPN depuis le menu Démarrer

### 3. Installation sur macOS
1. **Ouvrez** le fichier `.dmg` téléchargé
2. **Glissez** ProtonVPN dans le dossier Applications
3. **Lancez** ProtonVPN depuis Applications

### 4. Installation sur Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install protonvpn

# Ou via le site officiel
# Téléchargez le .deb et installez avec :
sudo dpkg -i protonvpn_*.deb
```

## 🔧 Configuration initiale

### 1. Premier lancement
1. **Ouvrez** l'application ProtonVPN
2. **Cliquez** sur "Se connecter" ou "Sign in"
3. **Entrez** vos identifiants ProtonVPN :
   - **Email** : votre_email@protonmail.com
   - **Mot de passe** : votre_mot_de_passe

### 2. Créer un compte (si nécessaire)
1. **Allez** sur https://account.protonvpn.com/signup
2. **Choisissez** un plan (gratuit ou payant)
3. **Créez** votre compte
4. **Confirmez** votre email

## 🚀 Utilisation avec le scraper

### 1. Lancer le scraper
```bash
# Via l'interface admin
# Allez dans Admin > Scraper > Lancer le scraper

# Ou via la ligne de commande
$env:DATABASE_URL="mysql://molo:Bulgroz%401977@mysql-molo.alwaysdata.net:3306/molo_dalon974"; node scripts/scrape-lbc-proton-gui.js
```

### 2. Quand un blocage est détecté
1. **Ouvrez** ProtonVPN
2. **Déconnectez-vous** si vous êtes connecté
3. **Connectez-vous** à un serveur français (FR) ou européen (NL, DE)
4. **Vérifiez** que l'IP a changé sur https://whatismyipaddress.com/
5. **Appuyez** sur Entrée dans le terminal pour continuer

## 📋 Serveurs recommandés

### Serveurs gratuits
- **FR#1** - France (gratuit)
- **NL#1** - Pays-Bas (gratuit)
- **DE#1** - Allemagne (gratuit)

### Serveurs payants (plus rapides)
- **FR#2, FR#3, FR#4, FR#5** - France
- **NL#2, NL#3** - Pays-Bas
- **DE#2, DE#3** - Allemagne

## 🔍 Vérification de l'IP

### Méthodes de vérification
1. **ProtonVPN** : L'application affiche votre IP actuelle
2. **Site web** : https://whatismyipaddress.com/
3. **Commande** : `curl ifconfig.me`

### Exemple de changement d'IP
```
🌐 IP initiale: 92.130.119.8
🔄 Connexion à ProtonVPN FR#1...
🌐 Nouvelle IP: 185.159.157.12
✅ IP changée avec succès !
```

## 🔒 Sécurité

### Bonnes pratiques
1. **Utilisez un compte dédié** pour le scraping
2. **Ne partagez pas vos identifiants**
3. **Changez régulièrement votre mot de passe**
4. **Utilisez des serveurs différents** pour éviter la détection

### Configuration recommandée
- **Kill Switch** : Activé (coupe internet si VPN se déconnecte)
- **Auto-connect** : Désactivé (pour contrôler manuellement)
- **Split Tunneling** : Désactivé (tout le trafic passe par le VPN)

## 🔍 Dépannage

### Problème : "Impossible de se connecter"
**Solutions :**
1. Vérifiez votre connexion internet
2. Vérifiez vos identifiants ProtonVPN
3. Essayez un autre serveur
4. Redémarrez l'application

### Problème : "IP non changée"
**Solutions :**
1. Vérifiez que ProtonVPN est bien connecté
2. Attendez quelques secondes après la connexion
3. Essayez un autre serveur
4. Redémarrez l'application

### Problème : "Application ne démarre pas"
**Solutions :**
1. Redémarrez votre ordinateur
2. Réinstallez ProtonVPN
3. Vérifiez les permissions système
4. Contactez le support ProtonVPN

## 📊 Monitoring

### Vérification de la connexion
- **Statut** : Connecté/Déconnecté dans l'application
- **IP** : Affichée dans l'interface
- **Serveur** : Nom et pays du serveur actuel
- **Vitesse** : Débit de connexion

### Logs de connexion
ProtonVPN garde des logs de :
- Tentatives de connexion
- Serveurs utilisés
- Durée des sessions
- Erreurs rencontrées

## 🆘 Support

### Ressources officielles
- **Documentation** : https://protonvpn.com/support/
- **FAQ** : https://protonvpn.com/support/frequently-asked-questions
- **Forum** : https://www.reddit.com/r/ProtonVPN/
- **Support** : https://protonvpn.com/support-form

### Contact support
- **Email** : support@protonvpn.com
- **Chat** : Disponible sur le site officiel
- **Tickets** : Via le portail client

## 💰 Plans et tarifs

### Plan gratuit
- ✅ 3 serveurs (FR, NL, DE)
- ✅ Pas de logs
- ✅ Support communautaire
- ❌ Vitesse limitée
- ❌ Pas de P2P

### Plans payants
- **Basic** : 4€/mois - 2 connexions simultanées
- **Plus** : 8€/mois - 5 connexions simultanées
- **Visionary** : 24€/mois - 10 connexions simultanées

### Recommandation pour le scraping
- **Plan gratuit** : Suffisant pour commencer
- **Plan Plus** : Recommandé pour un usage intensif
- **Serveurs dédiés** : Disponibles sur les plans payants

---

*Dernière mise à jour : Décembre 2024*
