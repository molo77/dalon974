# 🚨 Système de Maintenance Automatique

## 📋 Vue d'ensemble

Le système de maintenance automatique détecte quand la base de données n'est pas accessible et redirige automatiquement les utilisateurs vers une page de maintenance informative et moderne.

## ✨ Fonctionnalités

### 🔍 Détection automatique
- **Vérification en temps réel** de la connectivité de la base de données
- **Test simple et rapide** avec une requête SQL `SELECT 1`
- **Timeout configurable** (5 secondes par défaut)
- **Vérification périodique** toutes les 30 secondes sur la page de maintenance

### 🔄 Redirection intelligente
- **Redirection automatique** vers `/maintenance` si la DB n'est pas accessible
- **Récupération automatique** quand la DB est rétablie
- **Redirection vers l'accueil** une fois le service restauré

### 🎨 Interface moderne
- **Design responsive** et accessible
- **Indicateurs visuels** (vert/rouge) pour l'état du système
- **Informations détaillées** sur l'état de la base de données
- **Boutons d'action** pour réessayer et actualiser

### 🔔 Notifications
- **Alertes en temps réel** pour les problèmes de maintenance
- **Notifications de récupération** quand le service est rétabli
- **Auto-masquage** des alertes de succès

## 🏗️ Architecture

### Composants principaux

1. **`lib/databaseHealth.ts`** - Service de vérification de la DB
2. **`components/DatabaseGuard.tsx`** - Garde qui redirige si nécessaire
3. **`app/maintenance/page.tsx`** - Page de maintenance
4. **`app/api/health/route.ts`** - API de santé
5. **`hooks/useDatabaseHealth.ts`** - Hook React pour la santé de la DB
6. **`components/SystemStatus.tsx`** - Composant d'affichage du statut
7. **`components/MaintenanceAlert.tsx`** - Composant d'alerte

### Flux de fonctionnement

```
Utilisateur accède à l'app
         ↓
DatabaseGuard vérifie la DB
         ↓
DB accessible ? → OUI → Affichage normal
         ↓ NON
Redirection vers /maintenance
         ↓
Page de maintenance avec vérification périodique
         ↓
DB rétablie ? → OUI → Redirection vers l'accueil
         ↓ NON
Affichage de la page de maintenance
```

## 🚀 Utilisation

### Intégration automatique
Le système est déjà intégré dans le layout principal (`app/layout.tsx`) :

```tsx
<DatabaseGuard>
  {children}
  <MaintenanceAlert />
</DatabaseGuard>
```

### Utilisation manuelle
```tsx
import { useDatabaseHealth } from '@/hooks/useDatabaseHealth';

function MonComposant() {
  const { isHealthy, checkHealth } = useDatabaseHealth();
  
  return (
    <div>
      {isHealthy ? 'Système opérationnel' : 'Maintenance en cours'}
      <button onClick={checkHealth}>Vérifier</button>
    </div>
  );
}
```

## 🧪 Tests

### Test automatique
```bash
# Test complet du système
node scripts/test-maintenance-system.js

# Test simple
node scripts/test-maintenance.js

# Simulation d'une DB inaccessible
node scripts/test-maintenance-system.js --simulate-down
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

### Réponses

**DB accessible :**
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

**DB inaccessible :**
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

## ⚙️ Configuration

### Variables d'environnement
```env
# URL de la base de données (déjà configurée)
DATABASE_URL=mysql://user:password@host:port/database
```

### Personnalisation
- **Fréquence de vérification** : Modifiez `checkInterval` dans les composants
- **Timeout de la DB** : Modifiez la logique dans `lib/databaseHealth.ts`
- **Design** : Personnalisez les composants avec Tailwind CSS

## 🔒 Sécurité

### Middleware
- La page de maintenance et l'API de santé sont **exclues** des vérifications d'authentification
- **Accès public** autorisé pour ces routes critiques
- **Protection** des routes admin maintenue

### Vérifications
- **Test simple** : Requête SQL basique pour éviter les surcharges
- **Timeout limité** : 5 secondes maximum pour éviter les blocages
- **Gestion d'erreurs** robuste avec fallbacks

## 📈 Monitoring

### Métriques disponibles
- **Temps de réponse** de la base de données
- **Statut de connectivité** (connecté/déconnecté)
- **Messages d'erreur** détaillés
- **Timestamp** des vérifications

### Logs
- **Console** : Logs détaillés dans la console du navigateur
- **API** : Logs des requêtes de santé
- **Rapports** : Génération automatique de rapports de test

## 🚨 Dépannage

### Problèmes courants

**La page de maintenance ne s'affiche pas**
1. Vérifiez que `DatabaseGuard` est bien intégré dans le layout
2. Vérifiez les logs du serveur
3. Testez l'API `/api/health` directement

**Redirection en boucle**
1. Vérifiez que la base de données est accessible
2. Vérifiez les logs pour les erreurs de connexion
3. Testez la fonction `checkDatabaseHealth()` directement

**Performance lente**
1. La vérification ajoute un délai au chargement des pages
2. Considérez l'utilisation d'un cache
3. Optimisez la requête de test si nécessaire

### Commandes utiles
```bash
# Vérifier l'état de la DB
curl http://localhost:3000/api/health

# Tester la page de maintenance
curl http://localhost:3000/maintenance

# Générer un rapport complet
node scripts/test-maintenance-system.js
```

## 📝 Notes importantes

- ✅ **Fonctionne côté client** pour une meilleure réactivité
- ✅ **Vérifications non-bloquantes** pour éviter de ralentir l'application
- ✅ **Interface responsive** et accessible
- ✅ **Récupération automatique** quand la DB est rétablie
- ✅ **Système robuste** avec gestion d'erreurs complète

## 🎯 Avantages

1. **Expérience utilisateur améliorée** : Pas d'erreurs 500 brutales
2. **Transparence** : Les utilisateurs savent que le problème est temporaire
3. **Récupération automatique** : Pas besoin d'intervention manuelle
4. **Monitoring en temps réel** : Visibilité sur l'état du système
5. **Maintenance facile** : Système modulaire et configurable

Le système de maintenance est maintenant opérationnel et prêt à gérer les interruptions de service de manière élégante ! 🎉
