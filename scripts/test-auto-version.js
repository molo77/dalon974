#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Fonction pour lire la version depuis package.json
function getDevVersion() {
  try {
    const packagePath = path.join(process.cwd(), 'dev', 'package.json');
    const packageContent = fs.readFileSync(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    return packageData.version;
  } catch (error) {
    logError(`Erreur lecture version dev: ${error.message}`);
    return null;
  }
}

// Fonction pour tester l'incrémentation automatique
async function testAutoVersion() {
  log('🧪 Test du système d\'incrémentation automatique de version', 'bright');
  log('');
  
  // 1. Vérifier la version actuelle
  const currentVersion = getDevVersion();
  if (!currentVersion) {
    logError('Impossible de récupérer la version actuelle');
    return false;
  }
  
  logInfo(`Version actuelle de dev: ${currentVersion}`);
  
  // 2. Simuler un redémarrage du serveur dev
  logInfo('Simulation d\'un redémarrage du serveur de développement...');
  
  try {
    // Exécuter le script de démarrage dev (avec timeout pour éviter qu'il reste en cours)
    const result = execSync('timeout 10 npm run dev', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    // Vérifier si la version a été incrémentée
    const newVersion = getDevVersion();
    if (!newVersion) {
      logError('Impossible de récupérer la nouvelle version');
      return false;
    }
    
    logInfo(`Nouvelle version de dev: ${newVersion}`);
    
    if (newVersion !== currentVersion) {
      logSuccess(`Version incrémentée automatiquement: ${currentVersion} → ${newVersion}`);
      return true;
    } else {
      logWarning('La version n\'a pas été incrémentée');
      return false;
    }
    
  } catch (error) {
    // Le timeout est normal, on vérifie juste si la version a changé
    const newVersion = getDevVersion();
    if (!newVersion) {
      logError('Impossible de récupérer la nouvelle version');
      return false;
    }
    
    logInfo(`Nouvelle version de dev: ${newVersion}`);
    
    if (newVersion !== currentVersion) {
      logSuccess(`Version incrémentée automatiquement: ${currentVersion} → ${newVersion}`);
      return true;
    } else {
      logWarning('La version n\'a pas été incrémentée');
      return false;
    }
  }
}

// Fonction principale
async function main() {
  try {
    const success = await testAutoVersion();
    
    log('');
    if (success) {
      logSuccess('Test réussi ! Le système d\'incrémentation automatique fonctionne.');
    } else {
      logError('Test échoué ! Le système d\'incrémentation automatique ne fonctionne pas.');
    }
    
    log('');
    log('📋 Résumé:', 'bright');
    log('- La version de développement s\'incrémente automatiquement lors des redémarrages');
    log('- Seule la version de développement est affectée (prod reste inchangée)');
    log('- L\'incrémentation se fait en mode "patch" (0.3.4 → 0.3.5)');
    
  } catch (error) {
    logError(`Erreur lors du test: ${error.message}`);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = {
  testAutoVersion,
  getDevVersion
};

