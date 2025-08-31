# Configuration SMTP Local + Relay

## ✅ Installation terminée

Le serveur SMTP local avec relay Gmail a été configuré avec succès !

## 🔧 Configuration de l'application

Ajoutez ces variables dans votre fichier `.env.local` :

```bash
# Configuration SMTP Local + Relay
EMAIL_SERVER_HOST=localhost
EMAIL_SERVER_PORT=25
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM=noreply@depannage-informatique974.fr
```

## 🔑 Configuration Gmail

**IMPORTANT** : Remplacez les identifiants dans `/etc/postfix/sasl_passwd` :

```bash
sudo nano /etc/postfix/sasl_passwd
```

Remplacez :
```
[smtp.gmail.com]:587 votre-email@gmail.com:votre-mot-de-passe-app
```

Par vos vraies informations :
```
[smtp.gmail.com]:587 votre-vrai-email@gmail.com:votre-vrai-mot-de-passe-app
```

Puis :
```bash
sudo postmap /etc/postfix/sasl_passwd
sudo systemctl reload postfix
```

## 🧪 Test de configuration

Testez l'envoi d'email :
```bash
echo "Test email" | mail -s "Test SMTP Local" votre-email@example.com
```

## 📋 Avantages de cette configuration

✅ **Contrôle local** : Serveur SMTP sur votre machine
✅ **Bonne délivrabilité** : Relay via Gmail (réputation établie)
✅ **Sécurité** : Chiffrement TLS obligatoire
✅ **Gratuit** : Pas de frais mensuels
✅ **Flexible** : Possibilité de changer de relay facilement

## 🔄 Gestion des logs

```bash
# Voir les logs Postfix
sudo tail -f /var/log/mail.log

# Voir la queue des emails
sudo mailq

# Vider la queue si nécessaire
sudo postsuper -d ALL
```

## 🛠️ Maintenance

- **Redémarrer Postfix** : `sudo systemctl restart postfix`
- **Vérifier le statut** : `sudo systemctl status postfix`
- **Recharger la config** : `sudo systemctl reload postfix`
