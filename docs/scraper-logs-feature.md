# 📋 Affichage des Logs du Scraper

## 🎯 Vue d'ensemble

Une nouvelle fonctionnalité a été ajoutée à l'interface d'administration pour afficher les logs détaillés du scraper Leboncoin en temps réel.

## 🚀 Fonctionnalités

### 1. Bouton d'Affichage des Logs
- **Bouton "📋 Afficher logs"** : Affiche la section des logs
- **Bouton "📋 Masquer logs"** : Masque la section des logs
- **Position** : Dans la barre d'outils du scraper, à côté des autres boutons

### 2. Section des Logs
- **Affichage** : Zone de texte avec fond noir et texte vert (style terminal)
- **Contenu** : Logs détaillés du scraper avec informations de progression
- **Hauteur** : Maximum 96 (24 lignes) avec défilement automatique
- **Police** : Monospace pour une meilleure lisibilité

### 3. Boutons d'Action
- **🔄 Actualiser** : Recharge les logs depuis la base de données
- **🗑️ Effacer** : Vide l'affichage des logs (local uniquement)

### 4. Mise à Jour Automatique
- **Polling** : Actualisation automatique toutes les 5 secondes si un run est en cours
- **Condition** : Seulement si la section des logs est affichée
- **Arrêt** : Arrêt automatique quand aucun run n'est en cours

## 🔧 API Endpoint

### GET `/api/admin/scraper/run/[id]/logs`

Récupère les logs d'un run spécifique.

#### Réponse
```text
=== RUN SCRAPER [id] ===
Statut: running
Début: 27/08/2025 14:30:00
Étape actuelle: Étape 2/5
Message: Collecte des annonces...

[logs bruts du scraper]

=== ERREUR ===
[message d'erreur si présent]
```

#### Headers
- `Content-Type: text/plain; charset=utf-8`
- `Cache-Control: no-cache, no-store, must-revalidate`

## 📊 Contenu des Logs

### Informations de Base
- **ID du run** : Identifiant unique du run
- **Statut** : running, success, error, aborted
- **Horodatage** : Début et fin du run
- **Étape actuelle** : Progression détaillée
- **Message** : Description de l'action en cours

### Logs Bruts
- **Sortie console** : Tous les messages du scraper
- **Progression** : Étapes avec pourcentages
- **Erreurs** : Messages d'erreur détaillés
- **Statistiques** : Résultats finaux

## 🎨 Interface Utilisateur

### Section des Logs
```jsx
{showScraperLogs && (
  <div className='mt-6 border border-slate-200 rounded-lg p-4 bg-slate-50'>
    <div className='flex items-center justify-between mb-3'>
      <h3 className='text-lg font-semibold text-slate-700'>Logs du Scraper</h3>
      <div className='flex gap-2'>
        <button onClick={loadScraperLogs}>🔄 Actualiser</button>
        <button onClick={() => setScraperLogs('')}>🗑️ Effacer</button>
      </div>
    </div>
    <div className='bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96'>
      <pre className='whitespace-pre-wrap'>{scraperLogs}</pre>
    </div>
  </div>
)}
```

### Bouton de Contrôle
```jsx
<button 
  onClick={() => {
    setShowScraperLogs(!showScraperLogs);
    if (!showScraperLogs) {
      loadScraperLogs();
    }
  }} 
  className='px-3 py-1.5 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700'
>
  {showScraperLogs ? '📋 Masquer logs' : '📋 Afficher logs'}
</button>
```

## 🔄 Logique de Chargement

### Fonction `loadScraperLogs`
```javascript
const loadScraperLogs = async () => {
  try {
    // Récupérer les logs du dernier run en cours ou du dernier run terminé
    const currentRun = scraperRuns.find(r => r.status === 'running');
    if (currentRun) {
      // Si un run est en cours, récupérer ses logs en temps réel
      const logsRes = await fetch(`/api/admin/scraper/run/${currentRun.id}/logs`);
      if (logsRes.ok) {
        const logs = await logsRes.text();
        setScraperLogs(logs);
      }
    } else {
      // Sinon, récupérer les logs du dernier run terminé
      const lastRun = scraperRuns.find(r => r.status === 'success' || r.status === 'error');
      if (lastRun && lastRun.rawLog) {
        setScraperLogs(lastRun.rawLog);
      } else {
        setScraperLogs('Aucun log disponible');
      }
    }
  } catch(e) { 
    setScraperLogs('Erreur lors du chargement des logs');
  }
};
```

## 🧪 Tests

### Test de l'Interface
```bash
node scripts/test-scraper-logs.js
```

### Test de l'API
```bash
node scripts/test-logs-api.js
```

## 📈 Avantages

### Pour l'Utilisateur
- **Visibilité** : Suivi en temps réel du scraper
- **Debugging** : Identification rapide des problèmes
- **Transparence** : Compréhension du processus
- **Contrôle** : Possibilité d'actualiser ou effacer

### Pour le Développeur
- **Monitoring** : Surveillance des performances
- **Diagnostic** : Analyse des erreurs
- **Optimisation** : Identification des goulots d'étranglement
- **Maintenance** : Support utilisateur facilité

## 🔮 Évolutions Futures

- **Filtrage** : Filtres par niveau de log (INFO, WARN, ERROR)
- **Recherche** : Recherche dans les logs
- **Export** : Export des logs en fichier
- **Notifications** : Alertes en temps réel
- **Métriques** : Graphiques de performance
- **Historique** : Conservation des logs anciens

## 🎯 Utilisation

1. **Accéder à l'admin** : Aller sur `/admin`
2. **Onglet Scraper** : Cliquer sur "🕷️ Scraper"
3. **Afficher les logs** : Cliquer sur "📋 Afficher logs"
4. **Suivre le scraping** : Les logs se mettent à jour automatiquement
5. **Actualiser** : Cliquer sur "🔄 Actualiser" si nécessaire
6. **Masquer** : Cliquer sur "📋 Masquer logs" pour cacher

## 🔧 Configuration

### Variables d'Environnement
```bash
# Dans .env.local
DATABASE_URL="mysql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
LBC_USE_PROTONVPN=true
```

### Polling
- **Intervalle** : 5 secondes
- **Condition** : Run en cours + logs affichés
- **Arrêt** : Automatique quand aucun run en cours
