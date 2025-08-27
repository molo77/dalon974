# Installation de ProtonVPN CLI

## 📥 Installation de ProtonVPN CLI

### Option 1 : Installation via pip (Recommandé)

```bash
# Installer ProtonVPN CLI via pip
pip install protonvpn-cli

# Ou avec pip3
pip3 install protonvpn-cli
```

### Option 2 : Installation via le site officiel

1. **Télécharger** : https://protonvpn.com/support/command-line-tool/
2. **Installer** selon votre système d'exploitation
3. **Vérifier l'installation** : `protonvpn-cli --version`

### Option 3 : Installation via package manager

#### Windows (Chocolatey)
```bash
choco install protonvpn-cli
```

#### macOS (Homebrew)
```bash
brew install protonvpn-cli
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install protonvpn-cli
```

## 🔧 Configuration de ProtonVPN CLI

### 1. Initialisation
```bash
# Initialiser ProtonVPN CLI
protonvpn-cli init

# Entrez vos identifiants ProtonVPN
# Username: votre_email@protonmail.com
# Password: votre_mot_de_passe
```

### 2. Vérification de l'installation
```bash
# Vérifier la version
protonvpn-cli --version

# Vérifier le statut
protonvpn-cli status

# Lister les serveurs disponibles
protonvpn-cli servers
```

## 🚀 Utilisation avec le scraper

### 1. Lancer le scraper avec ProtonVPN
```bash
# Avec la base de données
$env:DATABASE_URL="mysql://molo:Bulgroz%401977@mysql-molo.alwaysdata.net:3306/molo_dalon974"; node scripts/scrape-lbc-protonvpn.js
```

### 2. Commandes ProtonVPN utiles

```bash
# Connexion au serveur le plus rapide
protonvpn-cli connect --fastest

# Connexion à un serveur spécifique
protonvpn-cli connect --server FR#1

# Connexion à un serveur sécurisé
protonvpn-cli connect --secure-core

# Déconnexion
protonvpn-cli disconnect

# Vérifier le statut
protonvpn-cli status

# Voir l'IP actuelle
protonvpn-cli ip
```

## 🔍 Dépannage

### Problème : "protonvpn-cli not found"
```bash
# Vérifier si pip est installé
pip --version

# Réinstaller ProtonVPN CLI
pip uninstall protonvpn-cli
pip install protonvpn-cli

# Ajouter au PATH si nécessaire
export PATH=$PATH:~/.local/bin
```

### Problème : "Authentication failed"
```bash
# Réinitialiser les identifiants
protonvpn-cli init

# Vérifier vos identifiants ProtonVPN
# Assurez-vous d'avoir un compte ProtonVPN actif
```

### Problème : "No servers available"
```bash
# Mettre à jour la liste des serveurs
protonvpn-cli update

# Vérifier votre abonnement ProtonVPN
# Certains serveurs nécessitent un abonnement payant
```

## 📋 Serveurs recommandés

### Serveurs gratuits
- `FR#1` - France
- `NL#1` - Pays-Bas
- `DE#1` - Allemagne

### Serveurs payants (plus rapides)
- `FR#2`, `FR#3`, `FR#4`, `FR#5`
- `NL#2`, `NL#3`
- `DE#2`, `DE#3`

## 🔒 Sécurité

### Bonnes pratiques
1. **Utilisez un compte ProtonVPN dédié** pour le scraping
2. **Ne partagez pas vos identifiants**
3. **Changez régulièrement votre mot de passe**
4. **Utilisez des serveurs différents** pour éviter la détection

### Configuration recommandée
```bash
# Connexion sécurisée
protonvpn-cli connect --secure-core

# Ou connexion rapide
protonvpn-cli connect --fastest
```

## 📊 Monitoring

### Vérifier l'IP
```bash
# Voir l'IP actuelle
curl ifconfig.me

# Ou via ProtonVPN
protonvpn-cli ip
```

### Vérifier la vitesse
```bash
# Test de vitesse (si disponible)
protonvpn-cli speedtest
```

## 🆘 Support

### Ressources officielles
- **Documentation** : https://protonvpn.com/support/command-line-tool/
- **Support** : https://protonvpn.com/support/
- **Forum** : https://www.reddit.com/r/ProtonVPN/

### Commandes de diagnostic
```bash
# Vérifier l'installation
protonvpn-cli --version

# Vérifier le statut
protonvpn-cli status

# Vérifier la configuration
protonvpn-cli config

# Mettre à jour
protonvpn-cli update
```

---

*Dernière mise à jour : Décembre 2024*
