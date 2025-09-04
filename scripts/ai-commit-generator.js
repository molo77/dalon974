#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
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

// Fonction pour lire la version de dev
function getDevVersion() {
  try {
    const content = fs.readFileSync(DEV_PACKAGE_FILE, 'utf8');
    const packageData = JSON.parse(content);
    return packageData.version;
  } catch (error) {
    logError(`Erreur lors de la lecture de la version: ${error.message}`);
    return null;
  }
}

// Fonction pour obtenir les fichiers modifiés
function getModifiedFiles() {
  try {
    const output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
    return output.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    logError('Erreur lors de la récupération des fichiers modifiés');
    return [];
  }
}

// Fonction pour obtenir les changements détaillés
function getDetailedChanges() {
  try {
    const output = execSync('git diff --cached --stat', { encoding: 'utf8' });
    return output.trim();
  } catch (error) {
    logError('Erreur lors de la récupération des changements détaillés');
    return '';
  }
}

// Fonction pour analyser le type de changement
function analyzeChangeType(files) {
  const analysis = {
    type: 'feat',
    scope: '',
    description: '',
    files: files
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

  // Déterminer le type de changement
  if (hasNewFiles) {
    analysis.type = 'feat';
  } else if (hasDeletedFiles) {
    analysis.type = 'remove';
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
  } else if (files.some(f => f.includes('package.json'))) {
    analysis.scope = 'deps';
  }

  return analysis;
}

// Fonction pour générer un message de commit intelligent
function generateCommitMessage() {
  const version = getDevVersion();
  const files = getModifiedFiles();
  const changes = getDetailedChanges();

  if (files.length === 0) {
    logError('Aucun fichier en staging. Utilisez "git add" d\'abord.');
    return null;
  }

  logInfo('Analyse des changements...');
  
  const analysis = analyzeChangeType(files);
  
  // Générer une description basée sur les fichiers modifiés
  let description = '';
  
  if (files.length === 1) {
    const file = files[0];
    if (file.includes('api/')) {
      description = `Mise à jour de l'API ${path.basename(file, '.ts')}`;
    } else if (file.includes('components/')) {
      description = `Amélioration du composant ${path.basename(file, '.tsx')}`;
    } else if (file.includes('lib/')) {
      description = `Mise à jour de la bibliothèque ${path.basename(file, '.ts')}`;
    } else if (file.includes('scripts/')) {
      description = `Amélioration du script ${path.basename(file, '.js')}`;
    } else if (file.includes('prisma/')) {
      description = 'Mise à jour du schéma de base de données';
    } else if (file.includes('package.json')) {
      description = 'Mise à jour des dépendances';
    } else {
      description = `Modification de ${path.basename(file)}`;
    }
  } else {
    const uniqueDirs = [...new Set(files.map(f => path.dirname(f).split('/')[0]))];
    if (uniqueDirs.length === 1) {
      const dir = uniqueDirs[0];
      description = `Mise à jour de ${dir} (${files.length} fichiers)`;
    } else {
      description = `Modifications multiples (${files.length} fichiers)`;
    }
  }

  // Construire le message final
  const versionPrefix = version ? `[v${version}] ` : '';
  const scopePrefix = analysis.scope ? `(${analysis.scope}) ` : '';
  
  let finalMessage = `${versionPrefix}${analysis.type}: ${scopePrefix}${description}`;

  // Ajouter des détails si nécessaire
  if (files.length <= 3) {
    const fileList = files.map(f => path.basename(f)).join(', ');
    finalMessage += ` - ${fileList}`;
  }

  return finalMessage;
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

// Fonction pour afficher l'aide
function showHelp() {
  log('🤖 Générateur de messages de commit avec IA', 'bright');
  log('');
  log('Usage:', 'bright');
  log('  node scripts/ai-commit-generator.js [commande]');
  log('');
  log('Commandes:', 'bright');
  log('  generate                 Générer et afficher un message de commit');
  log('  commit                   Générer et exécuter le commit automatiquement');
  log('  help                     Afficher cette aide');
  log('');
  log('Exemples:', 'bright');
  log('  node scripts/ai-commit-generator.js generate');
  log('  node scripts/ai-commit-generator.js commit');
  log('');
  log('Version actuelle de dev:', 'bright');
  const version = getDevVersion();
  if (version) {
    log(`  ${version}`, 'cyan');
  } else {
    log('  Impossible de récupérer la version', 'red');
  }
}

// Fonction principale
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  if (command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'generate':
      const message = generateCommitMessage();
      if (message) {
        log('🤖 Message de commit généré par IA:', 'bright');
        log('');
        log(message, 'green');
        log('');
        log('Copiez ce message pour votre commit !', 'yellow');
        log('Ou utilisez "commit" pour l\'exécuter automatiquement.', 'blue');
      }
      break;
      
    case 'commit':
      const commitMessage = generateCommitMessage();
      if (commitMessage) {
        log('🤖 Message de commit généré par IA:', 'bright');
        log('');
        log(commitMessage, 'green');
        log('');
        
        // Demander confirmation
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        rl.question('Voulez-vous exécuter ce commit ? (y/N): ', (answer) => {
          rl.close();
          if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
            executeCommit(commitMessage);
          } else {
            logInfo('Commit annulé.');
          }
        });
      }
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
  getDevVersion,
  generateCommitMessage,
  analyzeChangeType,
  getModifiedFiles
};
