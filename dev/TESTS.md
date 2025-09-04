# 🧪 Guide des Tests - dalon974

Ce guide explique comment exécuter tous les tests de votre application dalon974.

## 📋 Types de Tests

### 1. **Tests Unitaires** (`npm run test:unit`)
- Testent les composants React individuellement
- Testent les fonctions utilitaires
- Testent les services
- Utilisent Jest et React Testing Library

### 2. **Tests d'Intégration** (`npm run test:integration`)
- Testent les APIs
- Testent l'interaction entre composants
- Testent les flux de données

### 3. **Tests End-to-End** (`npm run test:e2e`)
- Testent l'application complète du point de vue utilisateur
- Utilisent Playwright
- Testent les parcours utilisateur complets

### 4. **Tests de Maintenance** (`npm run test:maintenance`)
- Testent le système de maintenance
- Vérifient la santé de l'application
- Testent les gardes de base de données

### 5. **Tests d'Application** (`npm run test:app`)
- Testent les endpoints principaux
- Vérifient la disponibilité des pages

### 6. **Tests de Base de Données** (`npm run test:db`)
- Testent la connectivité à la base de données
- Vérifient les migrations

## 🚀 Commandes de Test

### Tests Rapides
```bash
# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Tests end-to-end uniquement
npm run test:e2e
```

### Tests Complets
```bash
# Tous les tests (Jest + Playwright)
npm run test:all

# Suite complète avec rapports détaillés
npm run test:complete

# Tests avec couverture de code
npm run test:coverage
```

### Tests Spécialisés
```bash
# Tests de maintenance
npm run test:maintenance

# Tests d'application
npm run test:app

# Tests de base de données
npm run test:db
```

### Tests en Mode Watch
```bash
# Tests unitaires en mode watch (re-exécution automatique)
npm run test:watch

# Tests E2E avec interface graphique
npm run test:e2e:ui
```

## 📁 Structure des Tests

```
dev/
├── src/__tests__/           # Tests unitaires
│   ├── components/          # Tests des composants React
│   ├── utils/              # Tests des fonctions utilitaires
│   └── services/           # Tests des services
├── tests/                  # Tests d'intégration et E2E
│   ├── integration/        # Tests d'intégration
│   └── e2e/               # Tests end-to-end
└── src/scripts/test/       # Scripts de test personnalisés
```

## 🎯 Exemples de Tests

### Test Unitaire - Composant
```typescript
// src/__tests__/components/PhotoUploader.test.tsx
import { render, screen } from '@testing-library/react'
import PhotoUploader from '@/shared/components/PhotoUploader'

test('renders without crashing', () => {
  render(<PhotoUploader />)
  expect(screen.getByText('Ajouter des photos')).toBeInTheDocument()
})
```

### Test E2E - Parcours Utilisateur
```typescript
// tests/e2e/homepage.spec.ts
import { test, expect } from '@playwright/test'

test('should filter annonces by price', async ({ page }) => {
  await page.goto('/')
  await page.fill('input[name="prixMax"]', '500')
  await page.click('button[type="submit"]')
  await expect(page.locator('[data-testid="annonce-card"]')).toHaveCount.greaterThan(0)
})
```

## 📊 Rapports de Test

### Couverture de Code
```bash
npm run test:coverage
```
Génère un rapport de couverture dans `coverage/`

### Rapports E2E
```bash
npm run test:e2e
```
Génère des rapports dans `test-results/` et `playwright-report/`

### Rapport Complet
```bash
npm run test:complete
```
Génère un rapport JSON complet dans `test-results/complete-test-report.json`

## 🔧 Configuration

### Jest (Tests Unitaires)
- Configuration: `jest.config.js`
- Setup: `jest.setup.js`
- Environnement: jsdom

### Playwright (Tests E2E)
- Configuration: `playwright.config.ts`
- Navigateurs: Chrome, Firefox, Safari
- Modes: Desktop et Mobile

## 🚨 Dépannage

### Problèmes Courants

1. **Tests E2E échouent**
   ```bash
   # Vérifier que le serveur dev est démarré
   npm run dev
   
   # Dans un autre terminal
   npm run test:e2e
   ```

2. **Tests de base de données échouent**
   ```bash
   # Vérifier la connexion DB
   npm run test:db
   
   # Vérifier les variables d'environnement
   cat .env.local
   ```

3. **Tests de maintenance échouent**
   ```bash
   # Tester le système de maintenance
   npm run test:maintenance
   
   # Simuler une DB inaccessible
   node src/scripts/test/test-maintenance-system.js --simulate-down
   ```

### Logs et Debug
```bash
# Tests avec logs détaillés
DEBUG=* npm run test:unit

# Tests E2E avec interface graphique
npm run test:e2e:ui
```

## 📈 Bonnes Pratiques

1. **Écrivez des tests pour chaque nouveau composant**
2. **Testez les cas d'erreur et les cas limites**
3. **Utilisez des data-testid pour les sélecteurs E2E**
4. **Maintenez une couverture de code > 70%**
5. **Exécutez les tests avant chaque commit**

## 🔄 Intégration Continue

Les tests peuvent être intégrés dans votre pipeline CI/CD :

```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm install
    npm run test:complete
```

## 📞 Support

En cas de problème avec les tests :
1. Vérifiez les logs dans `test-results/`
2. Consultez la documentation Jest et Playwright
3. Vérifiez que tous les services sont démarrés
4. Vérifiez les variables d'environnement
