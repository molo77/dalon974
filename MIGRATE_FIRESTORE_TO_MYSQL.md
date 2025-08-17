# Migration Firestore -> MySQL (Prisma)

But: fournir un script et instructions pour migrer les données Firestore locales vers une base MySQL locale et adapter l'app.

Prérequis
- MySQL local (ou docker) accessible via `DATABASE_URL`.
- Un fichier de clés de service Firebase (serviceAccount JSON) avec accès Firestore. Exporter depuis la console Firebase.
- Node 18+, npm/yarn.

Installer dépendances

```powershell
npm install
npm install -D prisma ts-node @types/node
npx prisma generate
```

Initialiser Prisma

```powershell
# configuer DATABASE_URL dans .env
npx prisma migrate dev --name init
```

Exécuter la migration (dry-run par défaut)

```powershell
# dry run: ne modifie pas MySQL
npm run migrate:firestore-to-mysql

# apply (écrit dans MySQL)
npm run migrate:firestore-to-mysql -- --apply
```

Variables d'environnement
- FIREBASE_ADMIN_CREDENTIALS: chemin vers le JSON du compte de service
- DATABASE_URL: chaîne de connexion MySQL (ex: mysql://user:pass@localhost:3306/dalon974)

Notes
- Le script conserve `photos` comme champ JSON sur la table `ColocProfile` pour compatibilité immédiate.
- Après migration, il faudra adapter le code client/server pour utiliser Prisma/SQL au lieu de Firestore. Voir `lib/prismaClient.ts`.
- Pour déployer en production, sécuriser les credentials et exécuter le worker/cron pour l'autosave si nécessaire.
