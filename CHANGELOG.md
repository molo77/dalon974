# Changelog

Toutes les nouveautés et modifications notables de ce projet seront documentées ici.

Le format est inspiré de Keep a Changelog et des conventions de commits (feat / fix / refactor / chore ...).

## [Unreleased]
### 🔥 Suppressions / Breaking
- Suppression endpoints d'administration de seed (`seed-annonces`, `seed-colocs`), réparation images (`repair-images`) et reset mot de passe (`set-password`). UI nettoyée des boutons associés. (`27e53ac`)


## [0.1.1] - 2025-08-22
Release de stabilisation UI + nettoyage lint.

### ✨ Nouvelles fonctionnalités / Améliorations
- UI filtres & pub: déplacement de la publicité au‑dessus de la carte, bouton de repli des filtres (cache aussi carte + sélections), marges symétriques, libellé « Affiner la recherche », intégration d'`AdSlot` dans les filtres. (`798b5ca`)
- Accueil: image hero configurable via variables d'environnement, intégration AdSense (script + composant). (`38fbc948`)
- Illustration accueil + élargissement admin sidebar + badges zones/filtres profils + nouvelles APIs admin users/set-password/repair-images. (`4fa89b6a`)
- Admin: détection sous‑communes + affichage enrichi annonces + badge sous‑communes dans cartes coloc. (`19f6b8d8`)
- Seed: sous‑communes intégrées pour annonces & profils; helpers communes centralisés. (`6ce6f15e`)
- Admin seed: création massive via `createMany` pour accélérer l'insertion (annonces & colocs). (`2007b811`)
- Admin: réactivation des routes seed + boutons UI. (`324ba4f3`)
- Admin: chargement Annonces/Colocs (multi champs uid/ownerId/userId) + fix API Coloc. (`9295420b`)
- Auth/ESLint: realignement ESLint + refonte login Google + API PATCH/DELETE annonces/coloc + nettoyage providers + upgrade Next 15.4.6. (`b52c62b1`)
- API: suppression routes Pages Router obsolètes (migration App Router). (`37d6f499`)
- Upload: amélioration gestion uploads + suppression fichiers. (`6d910ce3`)
- Suppression fichiers config Firebase obsolètes. (`46c9494e`)

### 🐛 Corrections
- Auth: sessions JWT pour compatibilité middleware et accès /dashboard après login. (`fdbf6596`)
- Admin/Prisma: gestion erreurs P2022 (sélections colonnes + alias). (`9295420b`)
- Seed/Prisma: éviter P2022 sans migration via `createMany`. (`2007b811`)

### ♻️ Refactorisations
- Accueil / sous‑communes: extraction labels & meilleure lisibilité + nettoyage config ESLint. (`19f6b8d8`)
- Login/middleware: retrait redirection forcée, protection limitée aux routes privées. (`8ea9d968`)
- Dépendances: mise à jour packages + retrait firebase-admin. (`10ef6c6c`)

### 🧪 Données / Import
- Script import SQL (users / annonces / profils / images) + exécution --apply. (`cb3f03a2`)
- Ajout dataset SQL + images. (`cac943ad6`)

### 🧹 Maintenance / Chore
- Release: lint fixes & cleanup dashboard / map. (`5beb7823`)
- ESLint config mise à jour + `.eslintignore`. (`19f6b8d8`)
- Gitignore amélioré. (`04042176`)

### 🔧 Autres modifications
- Suppression routes API dupliquées. (`74910a92`)

## Historique initial
Les commits précédents à la version 0.1.1 constituent la base initiale du projet.

---

[0.1.1]: https://github.com/molo77/dalon974/releases/tag/v0.1.1
[0.2.0]: https://github.com/molo77/dalon974/releases/tag/v0.2.0
[Unreleased]: https://github.com/molo77/dalon974/compare/v0.2.0...HEAD
