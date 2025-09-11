# Système de Partage Réseaux Sociaux - RodColoc

## 📋 Vue d'ensemble

Le système de partage social de RodColoc permet aux utilisateurs de partager facilement du contenu sur les réseaux sociaux, avec des métadonnées Open Graph optimisées et des images dynamiques.

## 🧩 Composants

### 1. SocialShare
**Fichier:** `src/shared/components/SocialShare.tsx`

Composant principal de partage avec support pour :
- Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Email
- Copie de lien dans le presse-papiers
- 3 variantes : `default`, `compact`, `floating`
- Personnalisation des hashtags et descriptions

**Utilisation :**
```tsx
<SocialShare
  title="Mon titre"
  description="Ma description"
  hashtags={["RodColoc", "Colocation", "LaReunion"]}
  variant="default"
  showLabels={true}
/>
```

### 2. FloatingShare
**Fichier:** `src/shared/components/FloatingShare.tsx`

Bouton de partage flottant qui apparaît après un certain scroll :
- Apparition après 300px de scroll (configurable)
- Interface expandable
- Design moderne avec animations

### 3. ArticleShare
**Fichier:** `src/shared/components/ArticleShare.tsx`

Composant spécialisé pour les articles :
- Interface compacte et élégante
- Animation d'expansion
- Parfait pour les actualités

### 4. ShareStats
**Fichier:** `src/shared/components/ShareStats.tsx`

Affichage des statistiques de partage :
- Compteurs par plateforme
- Animation de chargement
- Design responsive

## 🎣 Hooks

### useSocialShare
**Fichier:** `src/shared/hooks/useSocialShare.ts`

Hook personnalisé pour gérer le partage :
```tsx
const { share, copyToClipboard, shareToNative, isSharing, lastShared } = useSocialShare({
  title: "Mon titre",
  description: "Ma description"
});

// Utilisation
share("facebook", { title: "Nouveau titre" });
```

## 🖼️ Images Open Graph

### API de génération d'images
**Fichier:** `app/api/og/route.tsx`

Génère des images Open Graph dynamiques :
- Dimensions : 1200x630px
- Design cohérent avec la marque
- Paramètres : title, description, category
- Utilise Next.js ImageResponse

**URL d'exemple :**
```
/api/og?title=Mon%20Titre&description=Ma%20Description&category=Conseils
```

## 📱 Plateformes supportées

### Réseaux sociaux
- **Facebook** : Partage avec aperçu
- **Twitter** : Tweet avec hashtags
- **LinkedIn** : Partage professionnel
- **WhatsApp** : Message direct
- **Telegram** : Partage via bot
- **Email** : Email avec sujet et corps

### Fonctionnalités
- **Copie de lien** : Dans le presse-papiers
- **Partage natif** : Utilise l'API Web Share si disponible
- **Fenêtres popup** : Ouverture dans de nouvelles fenêtres

## 🎨 Variantes de design

### Default
- Boutons avec labels
- Layout horizontal
- Parfait pour les pages de contenu

### Compact
- Boutons sans labels
- Layout serré
- Idéal pour les headers et sidebars

### Floating
- Bouton flottant
- Position fixe
- Apparition conditionnelle

## 🔧 Intégration

### Pages de conseils
```tsx
// Dans app/conseils/[slug]/page.tsx
<SocialShare
  title={conseil.title}
  description={conseil.excerpt}
  hashtags={["RodColoc", "Colocation", "LaReunion", "974", conseil.category]}
  variant="default"
  showLabels={true}
/>

<FloatingShare
  title={conseil.title}
  description={conseil.excerpt}
  hashtags={["RodColoc", "Colocation", "LaReunion", "974", conseil.category]}
/>
```

### Page Idées pratiques
```tsx
// Dans app/idees-pratiques/page.tsx
<SocialShare
  title="Idées Pratiques - Colocation à La Réunion"
  description="Découvrez nos conseils d'experts, actualités et astuces"
  hashtags={["RodColoc", "Colocation", "LaReunion", "974", "Conseils", "Astuces"]}
  variant="compact"
  showLabels={false}
/>
```

## 📊 Métadonnées Open Graph

### Balises essentielles
```html
<meta property="og:title" content="Titre de la page" />
<meta property="og:description" content="Description de la page" />
<meta property="og:image" content="/api/og?title=..." />
<meta property="og:url" content="URL de la page" />
<meta property="og:type" content="article" />
```

### Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Titre de la page" />
<meta name="twitter:description" content="Description de la page" />
<meta name="twitter:image" content="/api/og?title=..." />
```

## 🚀 Optimisations

### Performance
- Images Open Graph générées à la demande
- Composants lazy-loaded
- Animations CSS optimisées

### SEO
- Métadonnées complètes
- URLs canoniques
- Images optimisées pour le partage

### Accessibilité
- Labels ARIA appropriés
- Navigation au clavier
- Contraste respecté

## 🔮 Évolutions futures

### Fonctionnalités prévues
- [ ] Analytics de partage
- [ ] Partage programmé
- [ ] Intégration avec plus de plateformes
- [ ] Personnalisation des images OG
- [ ] Partage de collections d'articles

### Améliorations techniques
- [ ] Cache des images OG
- [ ] Compression d'images
- [ ] Support des vidéos
- [ ] Partage en temps réel

## 🛠️ Maintenance

### Tests
- Tester le partage sur chaque plateforme
- Vérifier les métadonnées Open Graph
- Valider l'accessibilité

### Monitoring
- Surveiller les erreurs de partage
- Analyser les statistiques d'utilisation
- Optimiser les performances

## 📞 Support

Pour toute question ou problème avec le système de partage :
1. Vérifier les logs de la console
2. Tester sur différentes plateformes
3. Valider les métadonnées avec les outils de debug
4. Contacter l'équipe de développement

---

**Dernière mise à jour :** Janvier 2025  
**Version :** 1.0.0  
**Auteur :** Équipe RodColoc
