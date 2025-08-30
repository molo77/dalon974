#!/usr/bin/env node

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

// Fonction pour afficher la version dans le format de commit
function showCommitVersion() {
  const version = getDevVersion();
  if (!version) {
    return;
  }
  
  log('📋 Version pour commit:', 'bright');
  log('');
  log(`[v${version}] `, 'cyan');
  log('');
  log('Copiez le préfixe ci-dessus pour vos messages de commit !', 'yellow');
}

// Fonction pour générer un message de commit avec version
function generateCommitMessage(message) {
  const version = getDevVersion();
  if (!version) {
    logError('Impossible de récupérer la version');
    return null;
  }
  
  return `[v${version}] ${message}`;
}

// Fonction pour afficher l'aide
function showHelp() {
  log('📋 Générateur de messages de commit avec version', 'bright');
  log('');
  log('Usage:', 'bright');
  log('  node scripts/commit-version.js [commande] [message]');
  log('');
  log('Commandes:', 'bright');
  log('  show                    Afficher le préfixe de version pour copier');
  log('  generate <message>      Générer un message de commit complet');
  log('  help                    Afficher cette aide');
  log('');
  log('Exemples:', 'bright');
  log('  node scripts/commit-version.js show');
  log('  node scripts/commit-version.js generate "Ajout du système de versions"');
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
  const command = args[0];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  switch (command) {
    case 'show':
      showCommitVersion();
      break;
      
    case 'generate':
      const message = args.slice(1).join(' ');
      if (!message) {
        logError('Message manquant. Usage: generate <message>');
        process.exit(1);
      }
      
      const commitMessage = generateCommitMessage(message);
      if (commitMessage) {
        log('📋 Message de commit généré:', 'bright');
        log('');
        log(commitMessage, 'green');
        log('');
        log('Copiez ce message pour votre commit !', 'yellow');
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
  showCommitVersion
};
