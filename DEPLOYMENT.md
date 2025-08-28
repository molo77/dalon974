# Guide de Déploiement - Serveur Linux

Ce guide explique comment déployer Dalon974 sur un serveur Linux.

## Prérequis

- Serveur Linux (Ubuntu/Debian recommandé)
- Accès SSH avec clés configurées
- Node.js 18+ installé sur le serveur
- Base de données PostgreSQL configurée

## Connexion SSH

### Configuration des clés SSH (si pas déjà fait)

```bash
# Générer une clé SSH (si pas déjà fait)
ssh-keygen -t rsa -b 4096 -C "votre-email@example.com"

# Copier la clé publique sur le serveur
ssh-copy-id molo@192.168.1.200

# Tester la connexion
ssh molo@192.168.1.200
```

### Connexion au serveur

```bash
# Se connecter au serveur
ssh molo@192.168.1.200

# Vérifier que vous êtes bien connecté
whoami
pwd
```

## Configuration Initiale (Première fois)

### 1. Configuration du serveur

```bash
# Exécuter le script de configuration initiale
npm run deploy:setup [utilisateur@serveur] [dossier]

# Exemple:
npm run deploy:setup molo@192.168.1.200 /data/dalon974
```

Ce script va :
- Créer le répertoire du projet
- Installer Node.js et PM2
- Configurer le service systemd
- Créer les scripts de maintenance

### 2. Configuration de l'environnement

Créer le fichier `.env.production` sur le serveur :

```bash
# Se connecter au serveur
ssh molo@192.168.1.200

# Créer le fichier d'environnement
nano /data/dalon974/.env.production
```

Contenu du fichier `.env.production` :

```env
# Base de données
DATABASE_URL="postgresql://utilisateur:motdepasse@localhost:5432/dalon974"

# NextAuth
NEXTAUTH_URL="http://votre-domaine.com"
NEXTAUTH_SECRET="votre-secret-ici"

# Variables d'environnement spécifiques à la production
NODE_ENV=production
```

## Déploiement

### Déploiement automatique

```bash
# Déployer la version actuelle
npm run deploy [utilisateur@serveur] [dossier]

# Exemple:
npm run deploy molo@192.168.1.200 /data/dalon974
```

### Déploiement manuel

```bash
# 1. Construire le projet
npm run build

# 2. Synchroniser les fichiers
rsync -avz --exclude 'node_modules' --exclude '.next' --exclude '.git' \
  ./ molo@192.168.1.200:/data/dalon974/

# 3. Se connecter au serveur
ssh molo@192.168.1.200

# 4. Installer les dépendances
cd /data/dalon974
npm install --production

# 5. Appliquer les migrations
npx prisma migrate deploy
npx prisma generate

# 6. Redémarrer l'application
./maintenance.sh restart
```

## Gestion de l'Application

### Commandes de maintenance

```bash
# Se connecter au serveur
ssh molo@192.168.1.200
cd /data/dalon974

# Redémarrer l'application
./maintenance.sh restart

# Arrêter l'application
./maintenance.sh stop

# Démarrer l'application
./maintenance.sh start

# Voir les logs
./maintenance.sh logs

# Vérifier le statut
./maintenance.sh status
```

### Commandes systemd

```bash
# Redémarrer le service
sudo systemctl restart dalon974

# Vérifier le statut
sudo systemctl status dalon974

# Voir les logs
sudo journalctl -u dalon974 -f
```

## Surveillance et Maintenance

### Vérification de la santé

```bash
# Vérifier que l'application répond
curl http://192.168.1.200:3000/api/health
```

### Nettoyage automatique

```bash
# Configurer un cron job pour le nettoyage des images
# Ajouter dans crontab (crontab -e):
0 2 * * * cd /data/dalon974 && npm run cleanup:images:scheduled
```

### Sauvegarde de la base de données

```bash
# Sauvegarder la base de données
npm run export-database

# Restaurer la base de données
npm run import-database backup.sql
```

## Dépannage

### Problèmes courants

1. **Application ne démarre pas**
   ```bash
   # Vérifier les logs
   ./maintenance.sh logs
   
       # Vérifier les permissions
    ls -la /data/dalon974
   ```

2. **Erreurs de base de données**
   ```bash
   # Vérifier la connexion
   npx prisma db push
   
   # Appliquer les migrations
   npx prisma migrate deploy
   ```

3. **Problèmes de mémoire**
   ```bash
   # Vérifier l'utilisation mémoire
   pm2 monit
   
   # Redémarrer avec plus de mémoire
   pm2 restart dalon974 --max-memory-restart 2G
   ```

### Logs utiles

```bash
# Logs de l'application
pm2 logs dalon974

# Logs systemd
sudo journalctl -u dalon974 -f

# Logs de nettoyage
tail -f /data/dalon974/logs/cleanup-images.log
```

## Sécurité

### Firewall

```bash
# Autoriser seulement le port 3000
sudo ufw allow 3000/tcp
sudo ufw enable
```

### SSL/HTTPS

Pour une production en HTTPS, configurer un reverse proxy avec Nginx :

```bash
# Installer Nginx
sudo apt install nginx

# Configurer le reverse proxy
sudo nano /etc/nginx/sites-available/dalon974
```

Configuration Nginx :

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Support

En cas de problème, vérifiez :
1. Les logs de l'application
2. La connectivité réseau
3. L'espace disque disponible
4. Les permissions des fichiers
5. La configuration de la base de données
