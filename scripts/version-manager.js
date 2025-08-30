#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const ENVIRONMENTS = ['dev', 'prod'];
const PACKAGE_FILES = ENVIRONMENTS.map(env => path.join(process.cwd(), env, 'package.json'));
const DEV_PACKAGE_FILE = path.join(process.cwd(), 'dev', 'package.json');

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

// Fonction pour lire le package.json
function readPackageJson(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    logError(`Erreur lors de la lecture de ${filePath}: ${error.message}`);
    return null;
  }
}

// Fonction pour écrire le package.json
function writePackageJson(filePath, data) {
  try {
    const content = JSON.stringify(data, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    logError(`Erreur lors de l'écriture de ${filePath}: ${error.message}`);
    return false;
  }
}

// Fonction pour incrémenter la version
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'patch':
      parts[2]++;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    default:
      throw new Error(`Type de version invalide: ${type}`);
  }
  
  return parts.join('.');
}

// Fonction pour mettre à jour toutes les versions
function updateVersions(newVersion) {
  logInfo(`Mise à jour vers la version ${newVersion}...`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const packageFile of PACKAGE_FILES) {
    const packageData = readPackageJson(packageFile);
    if (!packageData) {
      errorCount++;
      continue;
    }
    
    const oldVersion = packageData.version;
    packageData.version = newVersion;
    
    if (writePackageJson(packageFile, packageData)) {
      logSuccess(`${path.basename(path.dirname(packageFile))}: ${oldVersion} → ${newVersion}`);
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  return { successCount, errorCount };
}

// Fonction pour afficher les versions actuelles
function showCurrentVersions() {
  logInfo('Versions actuelles :');
  
  for (const packageFile of PACKAGE_FILES) {
    const packageData = readPackageJson(packageFile);
    if (packageData) {
      const env = path.basename(path.dirname(packageFile));
      log(`  ${env}: ${packageData.version}`, 'cyan');
    }
  }
}

// Fonction pour incrémenter automatiquement (dev seulement)
function autoIncrement(type) {
  // Lire la version depuis dev
  const devPackage = readPackageJson(DEV_PACKAGE_FILE);
  if (!devPackage) {
    logError('Impossible de lire la version de dev');
    return false;
  }
  
  const currentVersion = devPackage.version;
  const newVersion = incrementVersion(currentVersion, type);
  
  logInfo(`Incrémentation automatique dev : ${currentVersion} → ${newVersion} (${type})`);
  
  // Mettre à jour seulement dev
  const packageData = readPackageJson(DEV_PACKAGE_FILE);
  if (!packageData) {
    logError('Impossible de lire le package.json de dev');
    return false;
  }
  
  const oldVersion = packageData.version;
  packageData.version = newVersion;
  
  if (writePackageJson(DEV_PACKAGE_FILE, packageData)) {
    logSuccess(`✅ dev: ${oldVersion} → ${newVersion}`);
    logInfo(`ℹ️  La version de prod reste inchangée (${currentVersion})`);
    return true;
  } else {
    logError('Erreur lors de la mise à jour de la version de dev');
    return false;
  }
}

// Fonction pour définir une version spécifique
function setVersion(version, targetEnv = null) {
  // Validation du format de version
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    logError(`Format de version invalide: ${version}. Utilisez le format X.Y.Z`);
    return false;
  }
  
  if (targetEnv && !ENVIRONMENTS.includes(targetEnv)) {
    logError(`Environnement invalide: ${targetEnv}. Environnements valides: ${ENVIRONMENTS.join(', ')}`);
    return false;
  }
  
  if (targetEnv) {
    // Cibler un environnement spécifique
    logInfo(`Définition de la version ${version} pour ${targetEnv}...`);
    const packageFile = path.join(process.cwd(), targetEnv, 'package.json');
    const packageData = readPackageJson(packageFile);
    if (!packageData) {
      logError(`Impossible de lire le package.json de ${targetEnv}`);
      return false;
    }
    
    const oldVersion = packageData.version;
    packageData.version = version;
    
    if (writePackageJson(packageFile, packageData)) {
      logSuccess(`✅ ${targetEnv}: ${oldVersion} → ${version}`);
      return true;
    } else {
      logError(`Erreur lors de la mise à jour de la version de ${targetEnv}`);
      return false;
    }
  } else {
    // Mettre à jour tous les environnements
    logInfo(`Définition de la version ${version} pour tous les environnements...`);
    const result = updateVersions(version);
    
    if (result.errorCount === 0) {
      logSuccess(`✅ Toutes les versions ont été définies à ${version}`);
      return true;
    } else {
      logError(`${result.errorCount} erreur(s) lors de la mise à jour`);
      return false;
    }
  }
}

// Fonction pour synchroniser prod avec dev
function syncProd() {
  logInfo('Synchronisation de prod avec la version de dev...');
  
  const devPackage = readPackageJson(DEV_PACKAGE_FILE);
  if (!devPackage) {
    logError('Impossible de lire la version de dev');
    return false;
  }
  
  const devVersion = devPackage.version;
  return setVersion(devVersion, 'prod');
}

// Fonction pour afficher l'aide
function showHelp() {
  log('🔧 Gestionnaire de versions automatique', 'bright');
  log('');
  log('Usage:', 'bright');
  log('  node scripts/version-manager.js [commande] [argument]');
  log('');
  log('Commandes:', 'bright');
  log('  show                    Afficher les versions actuelles');
  log('  patch                   Incrémenter la version patch de dev (0.2.0 → 0.2.1)');
  log('  minor                   Incrémenter la version minor de dev (0.2.0 → 0.3.0)');
  log('  major                   Incrémenter la version major de dev (0.2.0 → 1.0.0)');
  log('  set <version> [env]     Définir une version spécifique (ex: 1.0.0)');
  log('  sync-prod               Synchroniser prod avec la version de dev');
  log('  help                    Afficher cette aide');
  log('');
  log('Exemples:', 'bright');
  log('  node scripts/version-manager.js show');
  log('  node scripts/version-manager.js patch');
  log('  node scripts/version-manager.js set 1.0.0');
  log('  node scripts/version-manager.js set 1.0.0 dev');
  log('  node scripts/version-manager.js set 1.0.0 prod');
  log('  node scripts/version-manager.js sync-prod');
  log('');
  log('Environnements gérés:', 'bright');
  ENVIRONMENTS.forEach(env => log(`  - ${env}`, 'cyan'));
  log('');
  log('Notes:', 'bright');
  log('  - Les commandes patch/minor/major ne modifient que dev');
  log('  - Utilisez sync-prod pour synchroniser prod avec dev');
  log('  - Utilisez set <version> <env> pour cibler un environnement spécifique');
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'show':
      showCurrentVersions();
      break;
      
    case 'patch':
    case 'minor':
    case 'major':
      autoIncrement(command);
      break;
      
    case 'set':
      const version = args[1];
      const targetEnv = args[2];
      if (!version) {
        logError('Version manquante. Usage: set <version> [env]');
        process.exit(1);
      }
      setVersion(version, targetEnv);
      break;
      
    case 'sync-prod':
      syncProd();
      break;
      
    default:
      logError(`Commande inconnue: ${command}`);
      log('Utilisez "help" pour voir les commandes disponibles');
      process.exit(1);
  }
}

// Exécution
if (require.main === module) {
  main();
}

module.exports = {
  incrementVersion,
  updateVersions,
  showCurrentVersions,
  autoIncrement,
  setVersion
};
