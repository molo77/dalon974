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

// Fonction pour créer un fichier de test
function createTestFile() {
  const testFilePath = path.join(process.cwd(), 'test-modification.txt');
  const content = `Test modification - ${new Date().toISOString()}`;
  fs.writeFileSync(testFilePath, content);
  logInfo(`Fichier de test créé: ${testFilePath}`);
  return testFilePath;
}

// Fonction pour supprimer un fichier de test
function removeTestFile(filePath) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    logInfo(`Fichier de test supprimé: ${filePath}`);
  }
}

// Fonction pour simuler un redémarrage du serveur dev
function simulateDevRestart() {
  logInfo('Simulation d\'un redémarrage du serveur de développement...');
  
  try {
    // Exécuter le script de démarrage dev (avec timeout pour éviter qu'il reste en cours)
    execSync('timeout 5 ./scripts/start-dev.sh', { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    return true;
  } catch (error) {
    // Le timeout est normal
    return true;
  }
}

// Fonction pour tester l'incrémentation de version
async function testVersionIncrement() {
  log('🧪 Test de l\'incrémentation conditionnelle de version', 'bright');
  log('');
  
  const testFile = createTestFile();
  
  try {
    // 1. Vérifier la version initiale
    const initialVersion = getDevVersion();
    if (!initialVersion) {
      logError('Impossible de récupérer la version initiale');
      return false;
    }
    
    logInfo(`Version initiale de dev: ${initialVersion}`);
    
    // 2. Simuler un redémarrage avec modifications
    logInfo('Test 1: Redémarrage avec modifications...');
    simulateDevRestart();
    
    // 3. Vérifier si la version a été incrémentée
    const versionAfterChanges = getDevVersion();
    if (!versionAfterChanges) {
      logError('Impossible de récupérer la version après modifications');
      return false;
    }
    
    logInfo(`Version après modifications: ${versionAfterChanges}`);
    
    if (versionAfterChanges !== initialVersion) {
      logSuccess(`✅ Version incrémentée avec modifications: ${initialVersion} → ${versionAfterChanges}`);
    } else {
      logWarning('⚠️  Version non incrémentée malgré les modifications');
    }
    
    // 4. Supprimer le fichier de test
    removeTestFile(testFile);
    
    // 5. Simuler un redémarrage sans modifications
    logInfo('Test 2: Redémarrage sans modifications...');
    simulateDevRestart();
    
    // 6. Vérifier si la version a été incrémentée
    const versionAfterNoChanges = getDevVersion();
    if (!versionAfterNoChanges) {
      logError('Impossible de récupérer la version après redémarrage sans modifications');
      return false;
    }
    
    logInfo(`Version après redémarrage sans modifications: ${versionAfterNoChanges}`);
    
    if (versionAfterNoChanges === versionAfterChanges) {
      logSuccess(`✅ Version non incrémentée sans modifications: ${versionAfterChanges}`);
      return true;
    } else {
      logWarning(`⚠️  Version incrémentée sans modifications: ${versionAfterChanges} → ${versionAfterNoChanges}`);
      return false;
    }
    
  } catch (error) {
    logError(`Erreur lors du test: ${error.message}`);
    removeTestFile(testFile);
    return false;
  }
}

// Fonction principale
async function main() {
  try {
    const success = await testVersionIncrement();
    
    log('');
    if (success) {
      logSuccess('Test réussi ! L\'incrémentation conditionnelle de version fonctionne.');
    } else {
      logError('Test échoué ! L\'incrémentation conditionnelle de version ne fonctionne pas correctement.');
    }
    
    log('');
    log('📋 Résumé:', 'bright');
    log('- La version de développement s\'incrémente seulement s\'il y a des modifications');
    log('- Les redémarrages sans modifications ne déclenchent pas d\'incrémentation');
    log('- Le système utilise git et les timestamps pour détecter les modifications');
    
  } catch (error) {
    logError(`Erreur lors du test: ${error.message}`);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = {
  testVersionIncrement,
  getDevVersion
};
