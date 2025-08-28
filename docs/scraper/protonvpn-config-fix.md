# Correction du problème LBC_USE_PROTONVPN

## Problème identifié

L'utilisateur signalait que la configuration `LBC_USE_PROTONVPN` ne s'enregistrait pas quand il la mettait à `false` dans l'interface admin.

## Cause du problème

1. **API non autorisée** : La clé `LBC_USE_PROTONVPN` n'était pas dans la liste `ALLOWED_KEYS` de l'API `/api/admin/scraper/settings`
2. **Interface utilisateur** : Le champ était affiché comme un input texte au lieu d'un select pour les valeurs booléennes

## Corrections apportées

### 1. API - Ajout de LBC_USE_PROTONVPN aux clés autorisées

**Fichier** : `app/api/admin/scraper/settings/route.ts`

```typescript
const ALLOWED_KEYS = [
  'LBC_SEARCH_URL','LBC_BROWSER_HEADLESS','LBC_MAX','LBC_FETCH_DETAILS','LBC_DETAIL_LIMIT',
  'LBC_DETAIL_SLEEP','LBC_PAGES','LBC_VERBOSE_LIST','LBC_EXPORT_JSON','LBC_NO_DB',
  'LBC_UPDATE_COOLDOWN_HOURS','LBC_EXTRA_SLEEP','LBC_COOKIES','LBC_DATADOME','DATADOME_TOKEN','LBC_DEBUG','LBC_USE_PROTONVPN'
];
```

### 2. Interface utilisateur - Amélioration de l'affichage des champs booléens

**Fichier** : `app/admin/page.tsx`

- Ajout de la détection des champs booléens
- Affichage en select avec options `true`/`false` pour les champs booléens
- Champs concernés : `LBC_USE_PROTONVPN`, `LBC_BROWSER_HEADLESS`, `LBC_FETCH_DETAILS`, `LBC_VERBOSE_LIST`, `LBC_EXPORT_JSON`, `LBC_NO_DB`, `LBC_DEBUG`

```typescript
const isBoolean = k === 'LBC_USE_PROTONVPN' || k === 'LBC_BROWSER_HEADLESS' || k === 'LBC_FETCH_DETAILS' || k === 'LBC_VERBOSE_LIST' || k === 'LBC_EXPORT_JSON' || k === 'LBC_NO_DB' || k === 'LBC_DEBUG';

{isBoolean ? (
  <select
    value={scraperConfig[k] ?? DEFAULT_SCRAPER_CONFIG[k]}
    onChange={e=>updateCfgField(k,e.target.value)}
    className='border rounded px-2 py-1 text-sm'
  >
    <option value="true">true</option>
    <option value="false">false</option>
  </select>
) : (
  <input
    type={isSens && !showSecret[k] ? 'password':'text'}
    value={scraperConfig[k] ?? ''}
    placeholder={DEFAULT_SCRAPER_CONFIG[k]}
    onChange={e=>updateCfgField(k,e.target.value)}
    className='border rounded px-2 py-1 text-sm placeholder:text-slate-400'
  />
)}
```

## Tests effectués

### Script de test : `scripts/test-protonvpn-config.js`

Le script vérifie :
- La lecture de la configuration actuelle
- La mise à jour vers `false`
- La mise à jour vers `true`
- La persistance en base de données

**Résultat** : ✅ Tous les tests passent

## Utilisation

1. **Accéder à l'interface admin** : `/admin`
2. **Onglet Scraper** : Cliquer sur "🕷️ Scraper"
3. **Afficher la configuration** : Cliquer sur "🔼 Afficher config"
4. **Modifier LBC_USE_PROTONVPN** : Utiliser le select avec options `true`/`false`
5. **Sauvegarder** : Cliquer sur "Sauvegarder config"

## Valeurs possibles

- `true` : Utilise ProtonVPN pour changer d'IP automatiquement
- `false` : Désactive ProtonVPN (recommandé pour les tests)

## Impact sur le scraper

Le scraper lit cette configuration via `process.env.LBC_USE_PROTONVPN` et :
- Si `true` : Lance ProtonVPN et change d'IP avant de scraper
- Si `false` : Scrape directement sans VPN

## Fichiers modifiés

- `app/api/admin/scraper/settings/route.ts` - Ajout de LBC_USE_PROTONVPN aux clés autorisées
- `app/admin/page.tsx` - Amélioration de l'interface pour les champs booléens
- `scripts/test-protonvpn-config.js` - Script de test (nouveau)
- `docs/protonvpn-config-fix.md` - Documentation (nouveau)
