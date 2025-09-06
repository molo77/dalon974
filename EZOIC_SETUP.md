# Configuration Ezoic

Ce guide explique comment configurer Ezoic pour remplacer Google AdSense dans le projet RodColoc.

## 1. Créer un compte Ezoic

1. Allez sur [Ezoic.com](https://www.ezoic.com/)
2. Créez un compte ou connectez-vous
3. Ajoutez votre site web
4. Une fois approuvé, récupérez votre Site ID

## 2. Configuration des variables d'environnement

Créez un fichier `.env.local` dans le dossier `dev/` et/ou `prod/` avec :

```bash
# Configuration Ezoic
NEXT_PUBLIC_EZOIC_SITE_ID=123456789
```

**Important :**
- Remplacez `123456789` par votre vrai Site ID Ezoic
- Le Site ID est un nombre (pas de préfixe comme AdSense)
- Pas besoin de slot ID séparé (Ezoic gère cela automatiquement)

## 3. Initialisation des données publicitaires

Exécutez le script d'initialisation :

```bash
# Dans le dossier dev/
npm run ads:init

# Ou directement
cd dev && node scripts/init-ads.js
```

## 4. Vérification

Vérifiez que les données sont correctement initialisées :

```bash
# Dans le dossier dev/
npm run ads:check

# Ou directement
cd dev && node scripts/check-ads.js
```

## 5. Emplacements publicitaires configurés

Le système utilise les emplacements suivants :

- `home.initial.belowHero` - Sous l'image hero de la page d'accueil
- `home.hero` - Dans la section hero
- `listing.inline.1` - Entre les annonces (toutes les 8 annonces)
- `home.list.rightSidebar` - Barre latérale droite
- `home.footer` - Pied de page
- `idees-pratiques.hero` - Dans la page des idées pratiques
- `idees-pratiques.content` - Dans le contenu des idées pratiques

## 6. Avantages d'Ezoic vs AdSense

### Ezoic
- ✅ **Meilleurs revenus** : Généralement 2-3x plus que AdSense
- ✅ **Optimisation automatique** : IA qui optimise les emplacements
- ✅ **Moins de restrictions** : Plus flexible sur le contenu
- ✅ **Support dédié** : Équipe de support personnalisée
- ✅ **Analytics avancés** : Données détaillées sur les performances
- ✅ **A/B Testing** : Tests automatiques d'optimisation

### AdSense
- ❌ **Revenus limités** : Seuil de revenus plus bas
- ❌ **Restrictions strictes** : Politique de contenu rigide
- ❌ **Support limité** : Support communautaire uniquement
- ❌ **Optimisation manuelle** : Nécessite plus d'intervention

## 7. Comportement en développement

En mode développement (NODE_ENV !== 'production'), les composants Ezoic affichent :
- Un placeholder avec le message d'erreur
- Une bordure en pointillés pour visualiser l'emplacement
- Pas d'appels réels à Ezoic

## 8. Comportement en production

En production, si Ezoic n'est pas configuré :
- Les composants ne s'affichent pas (return null)
- Aucune erreur n'est générée
- L'expérience utilisateur n'est pas impactée

## 9. Migration depuis AdSense

Si vous migrez depuis AdSense :

1. **Gardez AdSense actif** pendant la transition
2. **Configurez Ezoic** avec votre Site ID
3. **Testez en développement** avant de déployer
4. **Surveillez les revenus** pendant la période de transition
5. **Désactivez AdSense** une fois Ezoic optimisé

## 10. Optimisation des revenus

### Conseils pour maximiser les revenus Ezoic :

1. **Contenu de qualité** : Publiez du contenu original et engageant
2. **Trafic organique** : Optimisez votre SEO pour plus de visiteurs
3. **Vitesse du site** : Ezoic optimise automatiquement la vitesse
4. **Mobile-first** : Assurez-vous que votre site est mobile-friendly
5. **Engagement utilisateur** : Temps de session et pages vues

### Zones à éviter :
- Trop de publicités sur une page
- Publicités qui gênent la navigation
- Contenu de mauvaise qualité
- Trafic artificiel ou bot

## 11. Dépannage

### Erreur "Ezoic non configuré"
- Vérifiez que `NEXT_PUBLIC_EZOIC_SITE_ID` est définie
- Vérifiez que le Site ID est un nombre valide
- Redémarrez le serveur après modification

### Publicités ne s'affichent pas
- Vérifiez que votre site est approuvé par Ezoic
- Vérifiez les logs de la console pour les erreurs
- Contactez le support Ezoic si nécessaire

### Revenus faibles
- Attendez 2-4 semaines pour l'optimisation automatique
- Vérifiez la qualité de votre contenu
- Optimisez votre trafic organique
- Utilisez les outils d'analyse Ezoic

## 12. Support

- **Documentation Ezoic** : [help.ezoic.com](https://help.ezoic.com/)
- **Support client** : Via votre tableau de bord Ezoic
- **Communauté** : [Ezoic Community](https://community.ezoic.com/)

