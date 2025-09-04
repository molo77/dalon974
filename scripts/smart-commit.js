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
    configChanges: [],
    actionSummary: {
      linesAdded: 0,
      linesRemoved: 0,
      functionsAdded: 0,
      functionsModified: 0,
      functionsRemoved: 0,
      importsAdded: 0,
      importsRemoved: 0
    }
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

      // Analyser les détails du diff pour les fichiers modifiés
      if (status === 'M' || status === 'A') {
        try {
          const diffOutput = execSync(`git diff --cached --numstat ${file}`, { encoding: 'utf8' });
          const diffLines = diffOutput.trim().split('\n');
          diffLines.forEach(line => {
            const parts = line.split('\t');
            if (parts.length >= 3) {
              const added = parseInt(parts[0]) || 0;
              const removed = parseInt(parts[1]) || 0;
              changes.actionSummary.linesAdded += added;
              changes.actionSummary.linesRemoved += removed;
            }
          });

          // Analyser les fonctions et imports pour les fichiers TypeScript/JavaScript
          if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            analyzeCodeChanges(file, changes.actionSummary);
          }
        } catch (error) {
          // Ignorer les erreurs d'analyse de diff
        }
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

// Fonction pour analyser les changements de code
function analyzeCodeChanges(file, actionSummary) {
  try {
    const diffOutput = execSync(`git diff --cached ${file}`, { encoding: 'utf8' });
    const lines = diffOutput.split('\n');
    
    lines.forEach(line => {
      // Compter les fonctions ajoutées/modifiées/supprimées
      if (line.startsWith('+') && (line.includes('function ') || line.includes('const ') || line.includes('export '))) {
        if (line.includes('function ') || line.includes('=>')) {
          actionSummary.functionsAdded++;
        }
        if (line.includes('import ')) {
          actionSummary.importsAdded++;
        }
      } else if (line.startsWith('-') && (line.includes('function ') || line.includes('const ') || line.includes('export '))) {
        if (line.includes('function ') || line.includes('=>')) {
          actionSummary.functionsRemoved++;
        }
        if (line.includes('import ')) {
          actionSummary.importsRemoved++;
        }
      } else if (line.startsWith('+') && line.includes('function ') && line.includes('{')) {
        actionSummary.functionsModified++;
      }
    });
  } catch (error) {
    // Ignorer les erreurs d'analyse
  }
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
  
  // Construire le message final avec le style demandé
  const scopePrefix = analysis.scope ? `(${analysis.scope}) ` : '';
  let finalMessage = `[v${version}] ${analysis.type}: ${scopePrefix}${detailedDescription}`;

  // Ajouter des sections détaillées avec emojis
  const sections = [];

  // 🗄️ Base de données
  if (changes.dbChanges.length > 0) {
    sections.push('🗄️ Base de données :');
    changes.dbChanges.forEach(file => {
      const fileName = path.basename(file);
      if (file.includes('schema.prisma')) {
        sections.push('- Mise à jour du schéma Prisma');
      } else if (file.includes('migration')) {
        sections.push('- Migration de base de données');
      } else {
        sections.push(`- Modification de ${fileName}`);
      }
    });
  }

  // 🔧 Corrections build
  if (changes.configChanges.length > 0 || changes.scriptChanges.length > 0) {
    sections.push('🔧 Corrections build :');
    changes.configChanges.forEach(file => {
      const fileName = path.basename(file);
      if (file.includes('package.json')) {
        sections.push('- Mise à jour des dépendances');
      } else if (file.includes('package-lock.json')) {
        sections.push('- Synchronisation des versions de dépendances');
      } else {
        sections.push(`- Configuration ${fileName}`);
      }
    });
    changes.scriptChanges.forEach(file => {
      const fileName = path.basename(file);
      sections.push(`- Amélioration du script ${fileName}`);
    });
  }

  // 🚀 API et endpoints
  if (changes.apiChanges.length > 0) {
    sections.push('🚀 API et endpoints :');
    changes.apiChanges.forEach(file => {
      const fileName = path.basename(file, '.ts');
      const route = file.split('/').slice(-2).join('/');
      if (file.includes('route.ts')) {
        sections.push(`- ${fileName} (${route})`);
      } else {
        sections.push(`- ${fileName}`);
      }
    });
  }

  // 🎨 Composants et interface
  if (changes.componentChanges.length > 0) {
    sections.push('🎨 Composants et interface :');
    changes.componentChanges.forEach(file => {
      const fileName = path.basename(file, '.tsx');
      if (file.includes('modals/')) {
        sections.push(`- Modal ${fileName}`);
      } else if (file.includes('admin/')) {
        sections.push(`- Composant admin ${fileName}`);
      } else if (file.includes('dashboard/')) {
        sections.push(`- Composant dashboard ${fileName}`);
      } else {
        sections.push(`- Composant ${fileName}`);
      }
    });
  }

  // 📝 Autres modifications
  const otherFiles = files.filter(f => 
    !changes.dbChanges.includes(f) && 
    !changes.configChanges.includes(f) && 
    !changes.scriptChanges.includes(f) && 
    !changes.apiChanges.includes(f) && 
    !changes.componentChanges.includes(f)
  );

  if (otherFiles.length > 0) {
    sections.push('📝 Autres modifications :');
    otherFiles.slice(0, 5).forEach(file => {
      const fileName = path.basename(file);
      if (file.includes('page.tsx')) {
        sections.push(`- Page ${fileName}`);
      } else if (file.includes('layout.tsx')) {
        sections.push(`- Layout ${fileName}`);
      } else {
        sections.push(`- ${fileName}`);
      }
    });
    if (otherFiles.length > 5) {
      sections.push(`- ... et ${otherFiles.length - 5} autres fichiers`);
    }
  }

  // Ajouter les sections au message
  if (sections.length > 0) {
    finalMessage += '\n\n' + sections.join('\n');
  }

  // Ajouter le résumé des actions
  const actionSummary = changes.actionSummary;
  const actionDetails = [];
  
  if (actionSummary.linesAdded > 0 || actionSummary.linesRemoved > 0) {
    actionDetails.push(`${actionSummary.linesAdded}+ lignes, ${actionSummary.linesRemoved}- lignes`);
  }
  
  if (actionSummary.functionsAdded > 0) {
    actionDetails.push(`${actionSummary.functionsAdded} fonction(s) ajoutée(s)`);
  }
  
  if (actionSummary.functionsModified > 0) {
    actionDetails.push(`${actionSummary.functionsModified} fonction(s) modifiée(s)`);
  }
  
  if (actionSummary.functionsRemoved > 0) {
    actionDetails.push(`${actionSummary.functionsRemoved} fonction(s) supprimée(s)`);
  }
  
  if (actionSummary.importsAdded > 0 || actionSummary.importsRemoved > 0) {
    const importChanges = [];
    if (actionSummary.importsAdded > 0) importChanges.push(`${actionSummary.importsAdded} ajout(s)`);
    if (actionSummary.importsRemoved > 0) importChanges.push(`${actionSummary.importsRemoved} suppression(s)`);
    actionDetails.push(`Imports: ${importChanges.join(', ')}`);
  }
  
  if (actionDetails.length > 0) {
    finalMessage += `\n\nActions: ${actionDetails.join(', ')}`;
  }

  // Ajouter un statut de build si applicable
  if (changes.configChanges.length > 0 || changes.scriptChanges.length > 0) {
    finalMessage += '\n\n✅ Build et configuration mis à jour';
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
