#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Configuration
const DEV_PACKAGE_FILE = path.join(process.cwd(), 'dev', 'package.json');
const PROD_PACKAGE_FILE = path.join(process.cwd(), 'package.json');

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

// Fonction pour lire la version d'un package.json
function getVersion(packageFile) {
  try {
    const content = fs.readFileSync(packageFile, 'utf8');
    const packageData = JSON.parse(content);
    return packageData.version;
  } catch (error) {
    return null;
  }
}

// Fonction pour mettre à jour la version
function updateVersion(packageFile, newVersion) {
  try {
    const content = fs.readFileSync(packageFile, 'utf8');
    const packageData = JSON.parse(content);
    packageData.version = newVersion;
    fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');
    return true;
  } catch (error) {
    logError(`Erreur lors de la mise à jour de ${packageFile}: ${error.message}`);
    return false;
  }
}

// Fonction pour incrémenter la version
function incrementVersion(version, type) {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

// Fonction pour obtenir les fichiers modifiés
function getModifiedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    return [];
  }
}

// Fonction pour analyser le type de changement
function analyzeChangeType(files) {
  const analysis = {
    type: 'feat',
    scope: '',
    description: '',
    versionType: 'patch'
  };

  // Analyser les fichiers modifiés
  const hasNewFiles = files.some(file => {
    try {
      const output = execSync(`git diff --cached --name-status ${file}`, { encoding: 'utf8' });
      return output.startsWith('A');
    } catch {
      return false;
    }
  });

  const hasDeletedFiles = files.some(file => {
    try {
      const output = execSync(`git diff --cached --name-status ${file}`, { encoding: 'utf8' });
      return output.startsWith('D');
    } catch {
      return false;
    }
  });

  // Déterminer le type de changement et le type de version
  if (hasNewFiles) {
    analysis.type = 'feat';
    // Si c'est une nouvelle fonctionnalité majeure, incrémenter minor
    if (files.some(f => f.includes('api/') || f.includes('components/') || f.includes('lib/'))) {
      analysis.versionType = 'minor';
    }
  } else if (hasDeletedFiles) {
    analysis.type = 'remove';
    analysis.versionType = 'minor';
  } else {
    analysis.type = 'fix';
  }

  // Déterminer le scope basé sur les fichiers
  if (files.some(f => f.includes('api/'))) {
    analysis.scope = 'api';
  } else if (files.some(f => f.includes('components/'))) {
    analysis.scope = 'ui';
  } else if (files.some(f => f.includes('lib/'))) {
    analysis.scope = 'lib';
  } else if (files.some(f => f.includes('scripts/'))) {
    analysis.scope = 'scripts';
  } else if (files.some(f => f.includes('prisma/'))) {
    analysis.scope = 'db';
    analysis.versionType = 'minor'; // Changements DB = version minor
  } else if (files.some(f => f.includes('package.json'))) {
    analysis.scope = 'deps';
    analysis.versionType = 'patch';
  }

  return analysis;
}

// Fonction pour analyser les changements en détail
function analyzeChanges(files) {
  const changes = {
    newFiles: [],
    modifiedFiles: [],
    deletedFiles: [],
    apiChanges: [],
    componentChanges: [],
    dbChanges: [],
    scriptChanges: [],
    configChanges: []
  };

  files.forEach(file => {
    try {
      const output = execSync(`git diff --cached --name-status ${file}`, { encoding: 'utf8' });
      const status = output.charAt(0);
      
      if (status === 'A') {
        changes.newFiles.push(file);
      } else if (status === 'M') {
        changes.modifiedFiles.push(file);
      } else if (status === 'D') {
        changes.deletedFiles.push(file);
      }

      // Catégoriser par type
      if (file.includes('api/')) {
        changes.apiChanges.push(file);
      } else if (file.includes('components/')) {
        changes.componentChanges.push(file);
      } else if (file.includes('prisma/') || file.includes('schema.prisma')) {
        changes.dbChanges.push(file);
      } else if (file.includes('scripts/')) {
        changes.scriptChanges.push(file);
      } else if (file.includes('package.json') || file.includes('package-lock.json')) {
        changes.configChanges.push(file);
      }
    } catch (error) {
      // Ignorer les erreurs pour les fichiers non suivis
    }
  });

  return changes;
}

// Fonction pour générer une description détaillée
function generateDetailedDescription(analysis, changes) {
  const descriptions = [];
  
  // Nouveaux fichiers
  if (changes.newFiles.length > 0) {
    if (changes.newFiles.length === 1) {
      const file = changes.newFiles[0];
      if (file.includes('api/')) {
        descriptions.push(`Ajout de l'API ${path.basename(file, '.ts')}`);
      } else if (file.includes('components/')) {
        descriptions.push(`Nouveau composant ${path.basename(file, '.tsx')}`);
      } else if (file.includes('contexts/')) {
        descriptions.push(`Nouveau contexte ${path.basename(file, '.tsx')}`);
      } else if (file.includes('hooks/')) {
        descriptions.push(`Nouveau hook ${path.basename(file, '.ts')}`);
      } else if (file.includes('scripts/')) {
        descriptions.push(`Nouveau script ${path.basename(file, '.js')}`);
      } else {
        descriptions.push(`Nouveau fichier ${path.basename(file)}`);
      }
    } else {
      descriptions.push(`${changes.newFiles.length} nouveaux fichiers ajoutés`);
    }
  }

  // Modifications
  if (changes.modifiedFiles.length > 0) {
    if (changes.modifiedFiles.length === 1) {
      const file = changes.modifiedFiles[0];
      if (file.includes('api/')) {
        descriptions.push(`Amélioration de l'API ${path.basename(file, '.ts')}`);
      } else if (file.includes('components/')) {
        descriptions.push(`Mise à jour du composant ${path.basename(file, '.tsx')}`);
      } else if (file.includes('lib/')) {
        descriptions.push(`Amélioration de la bibliothèque ${path.basename(file, '.ts')}`);
      } else if (file.includes('scripts/')) {
        descriptions.push(`Amélioration du script ${path.basename(file, '.js')}`);
      } else {
        descriptions.push(`Modification de ${path.basename(file)}`);
      }
    } else {
      descriptions.push(`${changes.modifiedFiles.length} fichiers modifiés`);
    }
  }

  // Suppressions
  if (changes.deletedFiles.length > 0) {
    descriptions.push(`${changes.deletedFiles.length} fichier(s) supprimé(s)`);
  }

  // Changements spécifiques
  if (changes.dbChanges.length > 0) {
    descriptions.push('Mise à jour du schéma de base de données');
  }
  
  if (changes.configChanges.length > 0) {
    descriptions.push('Mise à jour de la configuration');
  }

  return descriptions.join(', ');
}

// Fonction pour générer un message de commit intelligent
function generateCommitMessage(version, analysis, files) {
  const changes = analyzeChanges(files);
  const detailedDescription = generateDetailedDescription(analysis, changes);
  
  // Construire le message final
  const scopePrefix = analysis.scope ? `(${analysis.scope}) ` : '';
  let finalMessage = `[v${version}] ${analysis.type}: ${scopePrefix}${detailedDescription}`;

  // Ajouter des détails sur les fichiers principaux
  const mainFiles = files.slice(0, 5); // Limiter à 5 fichiers pour éviter un message trop long
  if (mainFiles.length <= 5) {
    const fileList = mainFiles.map(f => path.basename(f)).join(', ');
    finalMessage += `\n\nFichiers: ${fileList}`;
  } else {
    const fileList = mainFiles.slice(0, 3).map(f => path.basename(f)).join(', ');
    finalMessage += `\n\nFichiers principaux: ${fileList} (+${files.length - 3} autres)`;
  }

  // Ajouter des informations sur les types de changements
  const changeTypes = [];
  if (changes.newFiles.length > 0) changeTypes.push(`${changes.newFiles.length} ajout(s)`);
  if (changes.modifiedFiles.length > 0) changeTypes.push(`${changes.modifiedFiles.length} modification(s)`);
  if (changes.deletedFiles.length > 0) changeTypes.push(`${changes.deletedFiles.length} suppression(s)`);
  
  if (changeTypes.length > 0) {
    finalMessage += `\nChangements: ${changeTypes.join(', ')}`;
  }

  return finalMessage;
}

// Fonction pour demander confirmation à l'utilisateur
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Fonction pour exécuter le commit
function executeCommit(message) {
  try {
    logInfo('Exécution du commit...');
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
    logSuccess('Commit effectué avec succès !');
    return true;
  } catch (error) {
    logError('Erreur lors du commit');
    return false;
  }
}

// Fonction pour restaurer les versions en cas d'échec
function restoreVersions(currentVersion) {
  logWarning('Restauration des versions...');
  updateVersion(DEV_PACKAGE_FILE, currentVersion);
  updateVersion(PROD_PACKAGE_FILE, currentVersion);
  logInfo('Versions restaurées à la version précédente');
}

// Fonction pour afficher l'aide
function showHelp() {
  log('🚀 Smart Commit - Gestionnaire de version et commit intelligent', 'bright');
  log('');
  log('Usage:', 'bright');
  log('  node scripts/smart-commit.js [commande] [options]');
  log('');
  log('Commandes:', 'bright');
  log('  commit [type]           Générer version, message et commit automatiquement');
  log('  version [type]          Incrémenter la version uniquement');
  log('  help                    Afficher cette aide');
  log('');
  log('Types de version:', 'bright');
  log('  patch (défaut)          Incrémenter la version patch (1.0.0 -> 1.0.1)');
  log('  minor                   Incrémenter la version minor (1.0.0 -> 1.1.0)');
  log('  major                   Incrémenter la version major (1.0.0 -> 2.0.0)');
  log('');
  log('Exemples:', 'bright');
  log('  node scripts/smart-commit.js commit');
  log('  node scripts/smart-commit.js commit minor');
  log('  node scripts/smart-commit.js version patch');
  log('');
  log('Version actuelle de dev:', 'bright');
  const version = getVersion(DEV_PACKAGE_FILE);
  if (version) {
    log(`  ${version}`, 'cyan');
  } else {
    log('  Impossible de récupérer la version', 'red');
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'commit';
  const versionType = args[1] || 'patch';
  
  if (command === 'help') {
    showHelp();
    return;
  }
  
  // Vérifier si on est dans un repo Git
  try {
    execSync('git rev-parse --git-dir', { stdio: 'ignore' });
  } catch (error) {
    logError('Ce répertoire n\'est pas un repository Git');
    process.exit(1);
  }
  
  // Récupérer la version actuelle
  const currentVersion = getVersion(DEV_PACKAGE_FILE);
  if (!currentVersion) {
    logError('Impossible de récupérer la version actuelle');
    process.exit(1);
  }
  
  // Calculer la nouvelle version
  const newVersion = incrementVersion(currentVersion, versionType);
  
  if (command === 'version') {
    logInfo(`Mise à jour de la version: ${currentVersion} -> ${newVersion}`);
    
    if (updateVersion(DEV_PACKAGE_FILE, newVersion)) {
      logSuccess(`Version mise à jour dans dev/package.json: ${newVersion}`);
    }
    
    if (updateVersion(PROD_PACKAGE_FILE, newVersion)) {
      logSuccess(`Version mise à jour dans package.json: ${newVersion}`);
    }
    
    return;
  }
  
  if (command === 'commit') {
    // Vérifier s'il y a des fichiers en staging
    const files = getModifiedFiles();
    if (files.length === 0) {
      logError('Aucun fichier en staging. Utilisez "git add" d\'abord.');
      process.exit(1);
    }
    
    logInfo(`Nouvelle version prévue: ${currentVersion} -> ${newVersion}`);
    
    // Analyser les changements
    logInfo('Analyse des changements...');
    const analysis = analyzeChangeType(files);
    
    // Générer le message de commit (avec la nouvelle version)
    const commitMessage = generateCommitMessage(newVersion, analysis, files);
    
    log('🤖 Message de commit généré:', 'bright');
    log('');
    // Afficher le message avec une meilleure mise en forme
    const lines = commitMessage.split('\n');
    lines.forEach((line, index) => {
      if (index === 0) {
        log(line, 'green'); // Première ligne en vert
      } else if (line.startsWith('Fichiers:')) {
        log(line, 'cyan'); // Section fichiers en cyan
      } else if (line.startsWith('Changements:')) {
        log(line, 'yellow'); // Section changements en jaune
      } else {
        log(line, 'green'); // Autres lignes en vert
      }
    });
    log('');
    
    // Afficher les changements
    logInfo('Changements qui vont être commités:');
    try {
      const changes = execSync('git diff --cached --stat', { encoding: 'utf8' });
      console.log(changes);
    } catch (error) {
      logWarning('Impossible d\'afficher les changements');
    }
    
    // Demander confirmation
    const confirmed = await askConfirmation('Voulez-vous exécuter ce commit ? (y/N): ');
    
    if (confirmed) {
      // Mettre à jour les versions AVANT le commit
      logInfo(`Mise à jour de la version: ${currentVersion} -> ${newVersion}`);
      
      if (!updateVersion(DEV_PACKAGE_FILE, newVersion)) {
        logError('Impossible de mettre à jour la version dans dev/package.json');
        process.exit(1);
      }
      
      if (!updateVersion(PROD_PACKAGE_FILE, newVersion)) {
        logError('Impossible de mettre à jour la version dans package.json');
        // Restaurer la version dev en cas d'erreur
        updateVersion(DEV_PACKAGE_FILE, currentVersion);
        process.exit(1);
      }
      
      // Ajouter les fichiers de version au staging
      try {
        execSync('git add dev/package.json package.json', { stdio: 'ignore' });
        logInfo('Fichiers de version ajoutés au staging');
      } catch (error) {
        logWarning('Impossible d\'ajouter les fichiers de version au staging');
      }
      
      // Exécuter le commit
      if (executeCommit(commitMessage)) {
        logSuccess(`Commit effectué avec succès ! Version ${newVersion} appliquée.`);
      } else {
        // En cas d'échec du commit, restaurer les versions
        logError('Échec du commit. Restauration des versions...');
        restoreVersions(currentVersion);
        process.exit(1);
      }
    } else {
      logInfo('Commit annulé.');
      logInfo('Message généré:', commitMessage);
    }
  }
}

// Exécution
if (require.main === module) {
  main().catch(error => {
    logError(`Erreur: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  getVersion,
  updateVersion,
  incrementVersion,
  generateCommitMessage,
  analyzeChangeType
};
