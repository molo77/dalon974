# Configuration AdSense

⚠️ **DÉPRÉCIÉ** : Nous recommandons maintenant d'utiliser **Ezoic** pour de meilleurs revenus publicitaires (2-3x plus élevés). Consultez [EZOIC_SETUP.md](./EZOIC_SETUP.md) pour la migration.

---

## Problème actuel
Le message "AdSense non configuré (client attendu 'ca-pub-…')" apparaît car la variable d'environnement `NEXT_PUBLIC_ADSENSE_CLIENT` n'est pas configurée.

## Solution

### 1. Obtenir un compte AdSense
1. Rendez-vous sur [Google AdSense](https://www.google.com/adsense/)
2. Créez un compte ou connectez-vous
3. Ajoutez votre site web
4. Une fois approuvé, récupérez votre ID client

### 2. Configuration des variables d'environnement

Créez un fichier `.env.local` dans le dossier `dev/` et/ou `prod/` avec :

```bash
# Configuration AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT=XXXXXXXXXX
```

**Important :**
- Remplacez `XXXXXXXXXXXX` par votre vrai ID client AdSense
- Le format doit commencer par `ca-pub-`
- Le slot est optionnel mais recommandé

### 3. Initialisation des données publicitaires

Exécutez le script d'initialisation :

```bash
# Dans le dossier dev/
npm run ads:init

# Ou directement
cd dev && node scripts/init-ads.js
```

### 4. Vérification

Vérifiez que les données sont correctement initialisées :

```bash
# Dans le dossier dev/
npm run ads:check

# Ou directement
cd dev && node scripts/check-ads.js
```

## Emplacements publicitaires configurés

Le système utilise les emplacements suivants :

- `home.initial.belowHero` - Sous l'image hero de la page d'accueil
- `home.hero` - Dans la section hero
- `listing.inline.1` - Entre les annonces (toutes les 8 annonces)
- `home.list.rightSidebar` - Barre latérale droite
- `home.footer` - Pied de page

## Comportement en développement

En mode développement (NODE_ENV !== 'production'), les composants AdSense affichent :
- Un placeholder avec le message d'erreur
- Une bordure en pointillés pour visualiser l'emplacement
- Pas d'appels réels à AdSense

## Comportement en production

En production, si AdSense n'est pas configuré :
- Les composants ne s'affichent pas (return null)
- Aucune erreur n'est générée
- L'expérience utilisateur n'est pas impactée

## Dépannage

### Le message persiste après configuration
1. Vérifiez que le fichier `.env.local` est dans le bon dossier
2. Redémarrez le serveur de développement
3. Vérifiez que la variable commence bien par `ca-pub-`

### AdSense ne s'affiche pas en production
1. Vérifiez que votre site est approuvé par AdSense
2. Vérifiez que les slots sont correctement configurés
3. Vérifiez les logs de la console pour d'éventuelles erreurs

## Sécurité

- Ne commitez jamais vos fichiers `.env.local`
- Gardez vos clés AdSense confidentielles
- Utilisez des variables d'environnement différentes pour dev/prod
