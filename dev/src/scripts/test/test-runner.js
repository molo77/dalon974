#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, errors: [] },
      integration: { passed: 0, failed: 0, errors: [] },
      e2e: { passed: 0, failed: 0, errors: [] },
      maintenance: { passed: 0, failed: 0, errors: [] },
      app: { passed: 0, failed: 0, errors: [] },
      db: { passed: 0, failed: 0, errors: [] }
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪',
      start: '🚀'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async runCommand(command, testType) {
    try {
      this.log(`Exécution: ${command}`, 'test');
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes timeout
      });
      
      this.results[testType].passed++;
      this.log(`✅ ${testType} tests passed`, 'success');
      return { success: true, output };
    } catch (error) {
      this.results[testType].failed++;
      this.results[testType].errors.push(error.message);
      this.log(`❌ ${testType} tests failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runUnitTests() {
    this.log('Démarrage des tests unitaires...', 'start');
    return await this.runCommand('npm run test:unit', 'unit');
  }

  async runIntegrationTests() {
    this.log('Démarrage des tests d\'intégration...', 'start');
    return await this.runCommand('npm run test:integration', 'integration');
  }

  async runE2ETests() {
    this.log('Démarrage des tests end-to-end...', 'start');
    return await this.runCommand('npm run test:e2e', 'e2e');
  }

  async runMaintenanceTests() {
    this.log('Démarrage des tests de maintenance...', 'start');
    return await this.runCommand('npm run test:maintenance', 'maintenance');
  }

  async runAppTests() {
    this.log('Démarrage des tests d\'application...', 'start');
    return await this.runCommand('npm run test:app', 'app');
  }

  async runDatabaseTests() {
    this.log('Démarrage des tests de base de données...', 'start');
    return await this.runCommand('npm run test:db', 'db');
  }

  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      summary: {
        total: Object.values(this.results).reduce((sum, r) => sum + r.passed + r.failed, 0),
        passed: Object.values(this.results).reduce((sum, r) => sum + r.passed, 0),
        failed: Object.values(this.results).reduce((sum, r) => sum + r.failed, 0)
      },
      results: this.results
    };

    // Sauvegarder le rapport
    const reportPath = 'test-results/complete-test-report.json';
    fs.mkdirSync('test-results', { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Afficher le résumé
    console.log('\n📊 Résumé complet des tests:');
    console.log(`⏱️  Durée totale: ${report.duration}`);
    console.log(`📈 Total: ${report.summary.total}`);
    console.log(`✅ Réussis: ${report.summary.passed}`);
    console.log(`❌ Échoués: ${report.summary.failed}`);
    
    console.log('\n📋 Détail par catégorie:');
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.failed === 0 ? '✅' : '❌';
      console.log(`${status} ${category}: ${result.passed} réussis, ${result.failed} échoués`);
      
      if (result.errors.length > 0) {
        console.log(`   Erreurs: ${result.errors.join(', ')}`);
      }
    });

    if (report.summary.failed === 0) {
      this.log('🎉 Tous les tests sont passés avec succès !', 'success');
    } else {
      this.log(`⚠️ ${report.summary.failed} tests ont échoué. Vérifiez le rapport: ${reportPath}`, 'warning');
    }

    return report;
  }

  async runAllTests(options = {}) {
    this.log('🚀 Démarrage de la suite complète de tests', 'start');
    
    const {
      skipUnit = false,
      skipIntegration = false,
      skipE2E = false,
      skipMaintenance = false,
      skipApp = false,
      skipDb = false
    } = options;

    // Tests unitaires
    if (!skipUnit) {
      await this.runUnitTests();
    }

    // Tests d'intégration
    if (!skipIntegration) {
      await this.runIntegrationTests();
    }

    // Tests de maintenance
    if (!skipMaintenance) {
      await this.runMaintenanceTests();
    }

    // Tests d'application
    if (!skipApp) {
      await this.runAppTests();
    }

    // Tests de base de données
    if (!skipDb) {
      await this.runDatabaseTests();
    }

    // Tests end-to-end (en dernier car ils prennent plus de temps)
    if (!skipE2E) {
      await this.runE2ETests();
    }

    // Générer le rapport final
    return this.generateReport();
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);
const options = {};

if (args.includes('--skip-unit')) options.skipUnit = true;
if (args.includes('--skip-integration')) options.skipIntegration = true;
if (args.includes('--skip-e2e')) options.skipE2E = true;
if (args.includes('--skip-maintenance')) options.skipMaintenance = true;
if (args.includes('--skip-app')) options.skipApp = true;
if (args.includes('--skip-db')) options.skipDb = true;

// Exécuter les tests
const runner = new TestRunner();
runner.runAllTests(options).catch(console.error);
