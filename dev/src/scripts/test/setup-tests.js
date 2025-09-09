#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSetup {
  constructor() {
    this.projectRoot = process.cwd();
  }

  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      start: '🚀'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async runCommand(command, description) {
    try {
      this.log(`Exécution: ${description}`, 'info');
      execSync(command, { stdio: 'inherit', cwd: this.projectRoot });
      this.log(`${description} terminé avec succès`, 'success');
      return true;
    } catch (error) {
      this.log(`Erreur lors de ${description}: ${error.message}`, 'error');
      return false;
    }
  }

  async installDependencies() {
    this.log('Installation des dépendances de test...', 'start');
    
    const commands = [
      {
        cmd: 'npm install',
        desc: 'Installation des dépendances npm'
      },
      {
        cmd: 'npx playwright install',
        desc: 'Installation des navigateurs Playwright'
      }
    ];

    for (const { cmd, desc } of commands) {
      const success = await this.runCommand(cmd, desc);
      if (!success) {
        this.log(`Échec de l'installation. Arrêt du processus.`, 'error');
        process.exit(1);
      }
    }
  }

  async createDirectories() {
    this.log('Création des dossiers de test...', 'start');
    
    const directories = [
      'tests/unit',
      'tests/integration', 
      'tests/e2e',
      'src/__tests__/components',
      'src/__tests__/utils',
      'src/__tests__/services',
      'test-results',
      'coverage'
    ];

    for (const dir of directories) {
      const fullPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        this.log(`Dossier créé: ${dir}`, 'success');
      } else {
        this.log(`Dossier existe déjà: ${dir}`, 'info');
      }
    }
  }

  async verifyConfiguration() {
    this.log('Vérification de la configuration...', 'start');
    
    const configFiles = [
      'jest.config.js',
      'jest.setup.js',
      'playwright.config.ts'
    ];

    for (const file of configFiles) {
      const fullPath = path.join(this.projectRoot, file);
      if (fs.existsSync(fullPath)) {
        this.log(`✅ ${file} existe`, 'success');
      } else {
        this.log(`❌ ${file} manquant`, 'error');
      }
    }
  }

  async runInitialTests() {
    this.log('Exécution des tests initiaux...', 'start');
    
    const testCommands = [
      {
        cmd: 'npm run test:unit',
        desc: 'Tests unitaires'
      },
      {
        cmd: 'npm run test:integration', 
        desc: 'Tests d\'intégration'
      }
    ];

    for (const { cmd, desc } of testCommands) {
      const success = await this.runCommand(cmd, desc);
      if (!success) {
        this.log(`⚠️ ${desc} ont échoué, mais l'installation continue`, 'warning');
      }
    }
  }

  async generateTestData() {
    this.log('Génération des données de test...', 'start');
    
    // Créer un fichier d'exemple de test
    const exampleTest = `import { test, expect } from '@playwright/test'

test('exemple de test', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/rodcoloc/i)
})`;

    const examplePath = path.join(this.projectRoot, 'tests/e2e/example.spec.ts');
    if (!fs.existsSync(examplePath)) {
      fs.writeFileSync(examplePath, exampleTest);
      this.log('Fichier d\'exemple créé: tests/e2e/example.spec.ts', 'success');
    }
  }

  async displayInstructions() {
    this.log('Configuration terminée !', 'success');
    console.log('\n📋 Instructions pour utiliser les tests:');
    console.log('\n🧪 Tests unitaires:');
    console.log('  npm run test:unit');
    console.log('  npm run test:watch');
    
    console.log('\n🔗 Tests d\'intégration:');
    console.log('  npm run test:integration');
    
    console.log('\n🌐 Tests end-to-end:');
    console.log('  npm run test:e2e');
    console.log('  npm run test:e2e:ui');
    
    console.log('\n🎯 Tests complets:');
    console.log('  npm run test:all');
    console.log('  npm run test:complete');
    
    console.log('\n📊 Couverture de code:');
    console.log('  npm run test:coverage');
    
    console.log('\n📖 Documentation:');
    console.log('  Consultez TESTS.md pour plus d\'informations');
    
    console.log('\n🚀 Pour commencer:');
    console.log('  1. Démarrez votre serveur: npm run dev');
    console.log('  2. Dans un autre terminal: npm run test:e2e');
  }

  async setup() {
    this.log('🚀 Configuration du système de tests rodcoloc', 'start');
    
    try {
      await this.createDirectories();
      await this.installDependencies();
      await this.verifyConfiguration();
      await this.generateTestData();
      await this.runInitialTests();
      await this.displayInstructions();
      
      this.log('🎉 Configuration terminée avec succès !', 'success');
    } catch (error) {
      this.log(`❌ Erreur lors de la configuration: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Exécuter la configuration
const setup = new TestSetup();
setup.setup().catch(console.error);
