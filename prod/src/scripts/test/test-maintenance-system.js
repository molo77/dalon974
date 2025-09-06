// Script de test complet du système de maintenance
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class MaintenanceTester {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.testResults = [];
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      test: '🧪'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    this.testResults.push({ timestamp, type, message });
  }

  async testHealthAPI() {
    await this.log('Test de l\'API de santé...', 'test');
    
    try {
      const { stdout } = await execAsync(`curl -s ${this.baseUrl}/api/health`);
      const response = JSON.parse(stdout);
      
      if (response.status) {
        await this.log(`API de santé accessible - Statut: ${response.status}`, 'success');
        await this.log(`Temps de réponse DB: ${response.database?.responseTime || 'N/A'}ms`, 'info');
        
        if (response.database?.error) {
          await this.log(`Erreur DB détectée: ${response.database.error}`, 'warning');
        }
        
        return response;
      } else {
        await this.log('Réponse API invalide', 'error');
        return null;
      }
    } catch (error) {
      await this.log(`Erreur API de santé: ${error.message}`, 'error');
      return null;
    }
  }

  async testMaintenancePage() {
    await this.log('Test de la page de maintenance...', 'test');
    
    try {
      const { stdout } = await execAsync(`curl -s ${this.baseUrl}/maintenance`);
      
      if (stdout.includes('Maintenance en cours')) {
        await this.log('Page de maintenance accessible', 'success');
        return true;
      } else {
        await this.log('Page de maintenance non accessible ou contenu incorrect', 'error');
        return false;
      }
    } catch (error) {
      await this.log(`Erreur page de maintenance: ${error.message}`, 'error');
      return false;
    }
  }

  async testDatabaseGuard() {
    await this.log('Test du DatabaseGuard...', 'test');
    
    try {
      // Test de la page d'accueil (devrait rediriger vers maintenance si DB inaccessible)
      const { stdout } = await execAsync(`curl -s -I ${this.baseUrl}/`);
      
      if (stdout.includes('200 OK')) {
        await this.log('Page d\'accueil accessible', 'success');
        return true;
      } else if (stdout.includes('302') || stdout.includes('redirect')) {
        await this.log('Redirection détectée (probablement vers maintenance)', 'warning');
        return true;
      } else {
        await this.log('Page d\'accueil non accessible', 'error');
        return false;
      }
    } catch (error) {
      await this.log(`Erreur DatabaseGuard: ${error.message}`, 'error');
      return false;
    }
  }

  async testComponents() {
    await this.log('Vérification des composants...', 'test');
    
    const components = [
      'lib/databaseHealth.ts',
      'components/DatabaseGuard.tsx',
      'components/SystemStatus.tsx',
      'components/MaintenanceAlert.tsx',
      'hooks/useDatabaseHealth.ts',
      'app/maintenance/page.tsx',
      'app/api/health/route.ts'
    ];
    
    let allExist = true;
    
    for (const component of components) {
      if (fs.existsSync(component)) {
        await this.log(`✅ ${component} existe`, 'success');
      } else {
        await this.log(`❌ ${component} manquant`, 'error');
        allExist = false;
      }
    }
    
    return allExist;
  }

  async testMiddleware() {
    await this.log('Test du middleware...', 'test');
    
    try {
      const { stdout } = await execAsync(`curl -s -I ${this.baseUrl}/maintenance`);
      
      if (stdout.includes('200 OK')) {
        await this.log('Middleware: Page de maintenance accessible', 'success');
        return true;
      } else {
        await this.log('Middleware: Page de maintenance bloquée', 'error');
        return false;
      }
    } catch (error) {
      await this.log(`Erreur middleware: ${error.message}`, 'error');
      return false;
    }
  }

  async generateReport() {
    await this.log('Génération du rapport de test...', 'test');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.testResults.length,
        success: this.testResults.filter(r => r.type === 'success').length,
        error: this.testResults.filter(r => r.type === 'error').length,
        warning: this.testResults.filter(r => r.type === 'warning').length
      },
      results: this.testResults
    };
    
    const reportPath = 'maintenance-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    await this.log(`Rapport sauvegardé: ${reportPath}`, 'success');
    
    // Afficher le résumé
    console.log('\n📊 Résumé des tests:');
    console.log(`Total: ${report.summary.total}`);
    console.log(`✅ Succès: ${report.summary.success}`);
    console.log(`❌ Erreurs: ${report.summary.error}`);
    console.log(`⚠️ Avertissements: ${report.summary.warning}`);
    
    if (report.summary.error === 0) {
      await this.log('🎉 Tous les tests sont passés avec succès !', 'success');
    } else {
      await this.log('⚠️ Certains tests ont échoué. Vérifiez le rapport.', 'warning');
    }
  }

  async runAllTests() {
    console.log('🚀 Démarrage des tests du système de maintenance\n');
    
    // Test 1: Vérification des composants
    await this.testComponents();
    
    // Test 2: API de santé
    await this.testHealthAPI();
    
    // Test 3: Page de maintenance
    await this.testMaintenancePage();
    
    // Test 4: DatabaseGuard
    await this.testDatabaseGuard();
    
    // Test 5: Middleware
    await this.testMiddleware();
    
    // Générer le rapport
    await this.generateReport();
  }
}

// Fonction pour simuler une base de données inaccessible
async function simulateDatabaseDown() {
  console.log('🔧 Simulation d\'une base de données inaccessible...\n');
  
  const originalDbUrl = process.env.DATABASE_URL;
  
  try {
    // Changer temporairement l'URL de base de données
    process.env.DATABASE_URL = 'mysql://invalid:invalid@localhost:3306/invalid';
    
    console.log('📋 URL de base de données temporairement modifiée');
    console.log('🔄 Redémarrez votre serveur Next.js pour tester');
    console.log('🌐 Accédez à http://localhost:3000');
    console.log('📱 Vous devriez être redirigé vers la page de maintenance');
    
    console.log('\n⏰ Appuyez sur Ctrl+C pour restaurer l\'URL de base de données');
    
    // Attendre indéfiniment
    await new Promise(() => {});
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    // Restaurer l'URL de base de données
    process.env.DATABASE_URL = originalDbUrl;
    console.log('\n✅ URL de base de données restaurée');
  }
}

// Gestion des arguments de ligne de commande
const args = process.argv.slice(2);

if (args.includes('--simulate-down')) {
  simulateDatabaseDown();
} else {
  const tester = new MaintenanceTester();
  tester.runAllTests().catch(console.error);
}
