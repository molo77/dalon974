# Guide du Système de Maintenance

## 🚨 Vue d'ensemble

Le système de maintenance automatique détecte quand la base de données n'est pas accessible et redirige automatiquement les utilisateurs vers une page de maintenance informative.

## 🔧 Composants du système

### 1. Service de santé de la base de données
- **Fichier**: `lib/databaseHealth.ts`
- **Fonction**: Vérifie la connectivité de la base de données
- **Méthode**: Exécute une requête SQL simple (`SELECT 1`)
- **Retour**: Statut de santé, temps de réponse, erreurs

### 2. Page de maintenance
- **Fichier**: `app/maintenance/page.tsx`
- **Fonction**: Interface utilisateur pendant la maintenance
- **Fonctionnalités**:
  - Affichage du statut de la base de données
  - Bouton de réessai automatique
  - Vérification périodique (30 secondes)
  - Redirection automatique quand la DB est rétablie

### 3. Garde de base de données
- **Fichier**: `components/DatabaseGuard.tsx`
- **Fonction**: Vérifie l'accessibilité de la DB et redirige si nécessaire
- **Intégration**: Utilisé dans le layout principal

### 4. API de santé
- **Fichier**: `app/api/health/route.ts`
- **Endpoint**: `GET /api/health`
- **Fonction**: Fournit des informations sur l'état du système

## 🚀 Utilisation

### Vérification automatique
Le système vérifie automatiquement la base de données :
- Au chargement de chaque page
- Toutes les 30 secondes sur la page de maintenance
- Avant chaque opération critique

### Redirection automatique
- **Si la DB est accessible** : Affichage normal de l'application
- **Si la DB n'est pas accessible** : Redirection vers `/maintenance`

### Récupération automatique
- La page de maintenance vérifie périodiquement la DB
- Redirection automatique vers la page d'accueil quand la DB est rétablie

## 🧪 Tests

### Test de la page de maintenance
```bash
# Démarrer le serveur Next.js
npm run dev

# Dans un autre terminal, tester la page
node scripts/test-maintenance.js
```

### Simulation d'une base de données inaccessible
```bash
# Simuler une DB inaccessible
node scripts/test-maintenance.js --simulate-down
```

### Test manuel
1. Arrêtez votre serveur de base de données
2. Accédez à `http://localhost:3000`
3. Vous devriez être redirigé vers `/maintenance`
4. Redémarrez votre base de données
5. La page devrait automatiquement vous rediriger vers l'accueil

## 📊 API de santé

### Endpoint
```
GET /api/health
```

### Réponse (DB accessible)
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "database": {
    "status": "connected",
    "responseTime": 45,
    "error": null
  }
}
```

### Réponse (DB inaccessible)
```json
{
  "status": "unhealthy",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "database": {
    "status": "disconnected",
    "responseTime": 5000,
    "error": "Connection timeout"
  }
}
```

## 🔒 Sécurité

### Middleware
- La page de maintenance et l'API de santé sont exclues des vérifications d'authentification
- Accès public autorisé pour ces routes

### Vérifications
- Test de connexion simple et rapide
- Timeout de 5 secondes maximum
- Gestion des erreurs robuste

## 🎨 Personnalisation

### Modification de la page de maintenance
Éditez `app/maintenance/page.tsx` pour :
- Changer le design
- Modifier les messages
- Ajouter des fonctionnalités

### Modification des vérifications
Éditez `lib/databaseHealth.ts` pour :
- Changer la requête de test
- Modifier le timeout
- Ajouter d'autres vérifications

### Modification de la fréquence
Dans `app/maintenance/page.tsx`, changez :
```javascript
// Vérifier toutes les 30 secondes
const interval = setInterval(checkHealth, 30000);
```

## 🚨 Dépannage

### La page de maintenance ne s'affiche pas
1. Vérifiez que `DatabaseGuard` est bien intégré dans le layout
2. Vérifiez les logs du serveur pour les erreurs
3. Testez l'API `/api/health` directement

### Redirection en boucle
1. Vérifiez que la base de données est bien accessible
2. Vérifiez les logs pour les erreurs de connexion
3. Testez la fonction `checkDatabaseHealth()` directement

### Performance
1. La vérification de la DB ajoute un délai au chargement des pages
2. Considérez l'utilisation d'un cache pour les vérifications fréquentes
3. Optimisez la requête de test si nécessaire

## 📝 Notes importantes

- Le système fonctionne côté client pour une meilleure réactivité
- Les vérifications sont non-bloquantes pour éviter de ralentir l'application
- La page de maintenance est responsive et accessible
- Le système se remet automatiquement en service quand la DB est rétablie
