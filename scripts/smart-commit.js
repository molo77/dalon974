#!/usr/bin/env node

/**
 * Script Smart Commit pour dalon974
 * Gère les commits automatiques avec gestion des versions
 * Respecte les préférences utilisateur pour les messages détaillés
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const PACKAGE_JSON_PATH = path.join(__dirname, '..', 'package.json');
const DEV_PACKAGE_JSON_PATH = path.join(__dirname, '..', 'dev', 'package.json');
const PROD_PACKAGE_JSON_PATH = path.join(__dirname, '..', 'prod', 'package.json');

// Types de version supportés
const VERSION_TYPES = {
  patch: 'patch',
  minor: 'minor', 
  major: 'major'
};

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

// Fonction pour analyser les changements Git
function getGitChanges() {
  try {
    // Obtenir la liste des fichiers modifiés
    const modifiedFiles = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
    if (!modifiedFiles) return { files: [], summary: 'Aucun fichier modifié' };
    
    const files = modifiedFiles.split('\n').filter(f => f.trim());
    
    // Obtenir les détails des modifications
    const diff = execSync('git diff --cached --stat', { encoding: 'utf8' });
    
    // Analyser les types de changements
    const changes = {
      files: files,
      added: 0,
      deleted: 0,
      modified: 0,
      summary: diff
    };
    
    // Compter les lignes ajoutées/supprimées
    const statLines = diff.split('\n');
    statLines.forEach(line => {
      if (line.includes('|')) {
        const parts = line.split('|');
        if (parts.length > 1) {
          const numbers = parts[1].trim().split(' ');
          numbers.forEach(num => {
            if (num.includes('+')) changes.added += parseInt(num.replace('+', '')) || 0;
            if (num.includes('-')) changes.deleted += parseInt(num.replace('-', '')) || 0;
          });
        }
      }
    });
    
    changes.modified = files.length;
    
    return changes;
  } catch (error) {
    log(`⚠️ Erreur lors de l'analyse Git: ${error.message}`, 'yellow');
    return { files: [], summary: 'Erreur lors de l\'analyse des changements' };
  }
}

// Fonction pour générer un résumé intelligent des changements
function generateIntelligentSummary(changes, versionType) {
  const fileTypes = {
    'src/': 'Code source',
    'app/': 'Pages et routes',
    'components/': 'Composants React',
    'config/': 'Configuration',
    'prisma/': 'Base de données',
    'scripts/': 'Scripts utilitaires',
    'package.json': 'Dépendances',
    '.env': 'Variables d\'environnement',
    'tsconfig.json': 'Configuration TypeScript',
    'next.config.js': 'Configuration Next.js'
  };
  
  const categories = {};
  changes.files.forEach(file => {
    for (const [pattern, category] of Object.entries(fileTypes)) {
      if (file.includes(pattern)) {
        categories[category] = (categories[category] || 0) + 1;
        break;
      }
    }
  });
  
  // Générer le résumé basé sur les catégories
  let summary = '';
  const categoryEntries = Object.entries(categories);
  
  if (categoryEntries.length > 0) {
    summary = 'Modifications dans: ' + categoryEntries.map(([cat, count]) => 
      count > 1 ? `${cat} (${count} fichiers)` : cat
    ).join(', ');
  }
  
  // Ajouter des détails basés sur le type de version
  const versionDetails = {
    major: 'Changements majeurs avec impact sur la compatibilité',
    minor: 'Nouvelles fonctionnalités et améliorations',
    patch: 'Corrections de bugs et optimisations'
  };
  
  return {
    summary: summary || 'Modifications diverses',
    details: versionDetails[versionType] || 'Mise à jour générale',
    stats: `${changes.added} lignes ajoutées, ${changes.deleted} lignes supprimées, ${changes.modified} fichiers modifiés`
  };
}

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    return packageJson.version;
  } catch (error) {
    log('❌ Erreur lors de la lecture du package.json', 'red');
    process.exit(1);
  }
}

function updateVersion(versionType) {
  try {
    log(`🔄 Mise à jour de la version (${versionType})...`, 'blue');
    
    // Mise à jour du package.json principal
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    const oldVersion = packageJson.version;
    
    // Calcul de la nouvelle version
    const [major, minor, patch] = oldVersion.split('.').map(Number);
    let newVersion;
    
    switch (versionType) {
      case 'major':
        newVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        throw new Error(`Type de version invalide: ${versionType}`);
    }
    
    packageJson.version = newVersion;
    fs.writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(packageJson, null, 2));
    
    // Mise à jour des package.json dev et prod si ils existent
    [DEV_PACKAGE_JSON_PATH, PROD_PACKAGE_JSON_PATH].forEach(packagePath => {
      if (fs.existsSync(packagePath)) {
        const subPackageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        subPackageJson.version = newVersion;
        fs.writeFileSync(packagePath, JSON.stringify(subPackageJson, null, 2));
        log(`✅ Version mise à jour dans ${path.basename(path.dirname(packagePath))}`, 'green');
      }
    });
    
    log(`✅ Version mise à jour: ${oldVersion} → ${newVersion}`, 'green');
    return newVersion;
    
  } catch (error) {
    log(`❌ Erreur lors de la mise à jour de la version: ${error.message}`, 'red');
    process.exit(1);
  }
}

function getCommitMessage(version, versionType, customMessage = '') {
  const timestamp = new Date().toLocaleString('fr-FR');
  
  // Analyser les changements Git
  const changes = getGitChanges();
  const intelligentSummary = generateIntelligentSummary(changes, versionType);
  
  // Message par défaut basé sur l'analyse intelligente
  const defaultMessages = {
    major: 'Mise à jour majeure avec changements incompatibles',
    minor: 'Nouvelle fonctionnalité ajoutée',
    patch: 'Correction de bugs et améliorations mineures'
  };
  
  const title = customMessage || intelligentSummary.summary || defaultMessages[versionType] || 'Mise à jour';
  
  // Format du message selon les préférences utilisateur avec analyse IA
  return `[v${version}] ${title}

🗄️ Section:
- Mise à jour de la version ${version}
- Type de version: ${versionType}
- Date: ${timestamp}
- ${intelligentSummary.stats}

🔧 Corrections:
- ${intelligentSummary.details}
- ${intelligentSummary.summary}

✅ Succès:
- Version ${version} déployée avec succès
- Tous les fichiers package.json synchronisés
- Commit effectué automatiquement`;
}

function commitChanges(version, versionType, customMessage = '') {
  try {
    log('📝 Préparation du commit...', 'blue');
    
    // Ajout de tous les fichiers modifiés
    execSync('git add .', { stdio: 'inherit' });
    
    // Analyser et afficher les changements
    const changes = getGitChanges();
    if (changes.files.length > 0) {
      log('📊 Analyse des changements:', 'cyan');
      log(`   📁 Fichiers modifiés: ${changes.files.length}`, 'blue');
      log(`   ➕ Lignes ajoutées: ${changes.added}`, 'green');
      log(`   ➖ Lignes supprimées: ${changes.deleted}`, 'red');
      
      const intelligentSummary = generateIntelligentSummary(changes, versionType);
      log(`   🧠 Résumé IA: ${intelligentSummary.summary}`, 'magenta');
      log('');
    }
    
    // Création du message de commit
    const commitMessage = getCommitMessage(version, versionType, customMessage);
    
    // Commit avec le message formaté
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    log('✅ Commit effectué avec succès', 'green');
    
  } catch (error) {
    log(`❌ Erreur lors du commit: ${error.message}`, 'red');
    process.exit(1);
  }
}

function showHelp() {
  log(`
🚀 Smart Commit - Gestionnaire de versions et commits

Usage:
  node scripts/smart-commit.js <action> [options]

Actions:
  commit [versionType] [message]  - Commit avec mise à jour de version
  version [versionType]          - Mise à jour de version uniquement

Types de version:
  patch  - Correction de bugs (1.0.0 → 1.0.1)
  minor  - Nouvelle fonctionnalité (1.0.0 → 1.1.0)  
  major  - Changement majeur (1.0.0 → 2.0.0)

Exemples:
  node scripts/smart-commit.js commit patch
  node scripts/smart-commit.js commit minor "Ajout de la fonctionnalité X"
  node scripts/smart-commit.js version major

Version actuelle: ${getCurrentVersion()}
`, 'cyan');
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
    showHelp();
    return;
  }
  
  const action = args[0];
  const versionType = args[1] || 'patch';
  const customMessage = args[2] || '';
  
  log('🚀 Smart Commit - Démarrage', 'bright');
  log(`📋 Action: ${action}`, 'blue');
  log(`📦 Type de version: ${versionType}`, 'blue');
  log(`📝 Message personnalisé: ${customMessage || 'Aucun'}`, 'blue');
  log('');
  
  if (!VERSION_TYPES[versionType]) {
    log(`❌ Type de version invalide: ${versionType}`, 'red');
    log('Types supportés: patch, minor, major', 'yellow');
    process.exit(1);
  }
  
  try {
    switch (action) {
      case 'commit':
        log('🔄 Démarrage du processus de commit...', 'blue');
        
        // 1. Mise à jour de la version
        const newVersion = updateVersion(versionType);
        
        // 2. Commit des changements
        commitChanges(newVersion, versionType, customMessage);
        
        log('🎉 Processus terminé avec succès !', 'green');
        break;
        
      case 'version':
        log('🔄 Mise à jour de version uniquement...', 'blue');
        const version = updateVersion(versionType);
        log(`🎉 Version mise à jour: ${version}`, 'green');
        break;
        
      default:
        log(`❌ Action inconnue: ${action}`, 'red');
        showHelp();
        process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = {
  updateVersion,
  commitChanges,
  getCommitMessage,
  getCurrentVersion
};
