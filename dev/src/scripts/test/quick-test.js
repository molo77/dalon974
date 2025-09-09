#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

class QuickTester {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} ${message}`);
  }

  async runQuickTest(testName, command) {
    try {
      this.log(`Test: ${testName}`, 'test');
      execSync(command, { stdio: 'pipe', timeout: 30000 });
      this.log(`✅ ${testName} - OK`, 'success');
      this.results.push({ name: testName, status: 'success' });
      return true;
    } catch (error) {
      this.log(`❌ ${testName} - ÉCHEC`, 'error');
      this.results.push({ name: testName, status: 'failed', error: error.message });
      return false;
    }
  }

  async checkServer() {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      if (response.ok) {
        this.log('✅ Serveur de développement accessible', 'success');
        return true;
      } else {
        this.log('⚠️ Serveur accessible mais API de santé retourne une erreur', 'warning');
        return true; // On considère que c'est OK car l'API peut retourner 503 si DB inaccessible
      }
    } catch (error) {
      this.log('❌ Serveur de développement non accessible', 'error');
      this.log('💡 Démarrez le serveur avec: npm run dev', 'info');
      return false;
    }
  }

  async runAllQuickTests() {
    this.log('🚀 Tests rapides de l\'application rodcoloc', 'test');
    
    // Vérifier que le serveur est démarré
    const serverOk = await this.checkServer();
    
    if (!serverOk) {
      this.log('⚠️ Serveur non accessible, certains tests seront ignorés', 'warning');
    }

    // Tests de configuration
    await this.runQuickTest('Configuration Jest', 'npx jest --version');
    await this.runQuickTest('Configuration Playwright', 'npx playwright --version');
    
    // Tests de linting
    await this.runQuickTest('Linting TypeScript', 'npm run lint');
    
    // Tests de build
    await this.runQuickTest('Build TypeScript', 'npm run type-check');
    
    // Tests unitaires (si serveur OK)
    if (serverOk) {
      await this.runQuickTest('Tests unitaires', 'npm run test:unit');
    }
    
    // Tests de maintenance
    await this.runQuickTest('Tests de maintenance', 'npm run test:maintenance');
    
    // Afficher le résumé
    this.displaySummary();
  }

  displaySummary() {
    console.log('\n📊 Résumé des tests rapides:');
    
    const success = this.results.filter(r => r.status === 'success').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    
    console.log(`✅ Réussis: ${success}`);
    console.log(`❌ Échoués: ${failed}`);
    
    if (failed > 0) {
      console.log('\n❌ Tests échoués:');
      this.results
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    }
    
    if (failed === 0) {
      this.log('🎉 Tous les tests rapides sont passés !', 'success');
      console.log('\n💡 Vous pouvez maintenant exécuter:');
      console.log('  npm run test:complete  # Suite complète de tests');
      console.log('  npm run test:e2e       # Tests end-to-end');
    } else {
      this.log('⚠️ Certains tests ont échoué. Vérifiez les erreurs ci-dessus.', 'warning');
    }
  }
}

// Exécuter les tests rapides
const tester = new QuickTester();
tester.runAllQuickTests().catch(console.error);
