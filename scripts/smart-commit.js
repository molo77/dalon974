#!/usr/bin/env node

/**
 * Script Smart Commit pour rodcoloc
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
const ACTION_SUMMARY_PATH = path.join(__dirname, '..', 'action-summary.md');

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

// Fonction pour lire le résumé des actions
function getActionSummary() {
  try {
    if (fs.existsSync(ACTION_SUMMARY_PATH)) {
      const content = fs.readFileSync(ACTION_SUMMARY_PATH, 'utf8');
      
      // Extraire le message de commit suggéré s'il existe
      const commitMatch = content.match(/## 📝 Notes pour le Commit[\s\S]*?```([\s\S]*?)```/);
      if (commitMatch) {
        return {
          hasSummary: true,
          suggestedMessage: commitMatch[1].trim(),
          fullContent: content
        };
      }
      
      // Sinon, extraire les sections principales
      const sections = content.match(/## ✅ Actions Réalisées[\s\S]*?(?=##|$)/);
      if (sections) {
        return {
          hasSummary: true,
          suggestedMessage: null,
          fullContent: content,
          actionsSection: sections[0]
        };
      }
      
      return {
        hasSummary: true,
        suggestedMessage: null,
        fullContent: content
      };
    }
  } catch (error) {
    log(`⚠️  Erreur lors de la lecture du résumé d'actions: ${error.message}`, 'yellow');
  }
  
  return { hasSummary: false };
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

// Fonction pour analyser le contenu des modifications
function analyzeFileChanges() {
  try {
    const diff = execSync('git diff --cached', { encoding: 'utf8' });
    const files = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim().split('\n').filter(f => f.trim());
    
    const analysis = {
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      features: [],
      fixes: [],
      configs: [],
      dependencies: [],
      specificDetails: []
    };
    
    // Analyser chaque fichier
    files.forEach(file => {
      const fileDiff = execSync(`git diff --cached -- "${file}"`, { encoding: 'utf8' });
      
      // Détecter les nouveaux fichiers
      if (fileDiff.startsWith('diff --git a/dev/null')) {
        analysis.newFiles.push(file);
      }
      // Détecter les fichiers supprimés
      else if (fileDiff.includes('deleted file mode')) {
        analysis.deletedFiles.push(file);
      }
      // Analyser les modifications
      else {
        analysis.modifiedFiles.push(file);
        
        // Analyser le contenu des modifications
        const lines = fileDiff.split('\n');
        lines.forEach(line => {
          if (line.startsWith('+') && !line.startsWith('+++')) {
            const content = line.substring(1);
            
            // Détecter les nouvelles fonctionnalités
            if (content.includes('useEffect') || content.includes('useState') || content.includes('useSession')) {
              if (!analysis.features.includes('Hooks React')) analysis.features.push('Hooks React');
            }
            if (content.includes('router.push') || content.includes('redirect')) {
              if (!analysis.features.includes('Navigation')) analysis.features.push('Navigation');
            }
            if (content.includes('signIn') || content.includes('authentication')) {
              if (!analysis.features.includes('Authentification')) analysis.features.push('Authentification');
            }
            if (content.includes('prisma') || content.includes('database')) {
              if (!analysis.features.includes('Base de données')) analysis.features.push('Base de données');
            }
            
            // Détecter les URLs et paramètres spécifiques
            if (content.includes('localhost:3000') || content.includes('localhost:3001')) {
              if (!analysis.features.includes('Configuration serveur')) analysis.features.push('Configuration serveur');
            }
            if (content.includes('/api/auth/callback/google') || content.includes('google')) {
              if (!analysis.features.includes('OAuth Google')) analysis.features.push('OAuth Google');
            }
            if (content.includes('code=') || content.includes('scope=') || content.includes('authuser=')) {
              if (!analysis.features.includes('Paramètres OAuth')) analysis.features.push('Paramètres OAuth');
            }
            if (content.includes('NEXTAUTH_URL') || content.includes('GOOGLE_CLIENT_ID')) {
              if (!analysis.features.includes('Variables environnement')) analysis.features.push('Variables environnement');
            }
            
            // Capturer les détails spécifiques
            if (content.includes('localhost:3000') && content.includes('localhost:3001')) {
              analysis.specificDetails.push('Correction URL: 3000 → 3001');
            } else if (content.includes('localhost:3000')) {
              analysis.specificDetails.push('URL production: localhost:3000');
            } else if (content.includes('localhost:3001')) {
              analysis.specificDetails.push('URL développement: localhost:3001');
            }
            
            if (content.includes('/api/auth/callback/google')) {
              analysis.specificDetails.push('Callback Google OAuth configuré');
            }
            
            if (content.includes('senderId: { not: userId }')) {
              analysis.specificDetails.push('Logique messages lus corrigée');
            }
            
            if (content.includes('useSession') && content.includes('useEffect')) {
              analysis.specificDetails.push('Redirection automatique login ajoutée');
            }
            
            // Détecter les corrections
            if (content.includes('fix') || content.includes('error') || content.includes('bug')) {
              if (!analysis.fixes.includes('Corrections')) analysis.fixes.push('Corrections');
            }
            if (content.includes('eslint') || content.includes('warning')) {
              if (!analysis.fixes.includes('Linting')) analysis.fixes.push('Linting');
            }
            
            // Détecter les configurations
            if (content.includes('version') || content.includes('package.json')) {
              if (!analysis.configs.includes('Versions')) analysis.configs.push('Versions');
            }
            if (content.includes('import') || content.includes('require')) {
              if (!analysis.dependencies.includes('Imports')) analysis.dependencies.push('Imports');
            }
          }
        });
      }
    });
    
    return analysis;
  } catch (error) {
    log(`⚠️ Erreur lors de l'analyse des modifications: ${error.message}`, 'yellow');
    return null;
  }
}

// Fonction pour générer un résumé intelligent des changements
function generateIntelligentSummary(changes, versionType, actionSummary = null) {
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
  
  // Analyser le contenu des modifications
  const contentAnalysis = analyzeFileChanges();
  
  // Générer le résumé basé sur les catégories
  let summary = '';
  const categoryEntries = Object.entries(categories);
  
  if (categoryEntries.length > 0) {
    summary = 'Modifications dans: ' + categoryEntries.map(([cat, count]) => 
      count > 1 ? `${cat} (${count} fichiers)` : cat
    ).join(', ');
  }
  
  // Si un résumé d'actions est disponible, l'utiliser en priorité
  if (actionSummary && actionSummary.hasSummary) {
    if (actionSummary.suggestedMessage) {
      // Utiliser le message de commit suggéré
      return {
        summary: actionSummary.suggestedMessage.split('\n')[0].replace(/^\[v[\d.]+\]\s*/, ''),
        details: actionSummary.suggestedMessage,
        stats: `${changes.added} lignes ajoutées, ${changes.deleted} lignes supprimées, ${changes.modified} fichiers modifiés`,
        fromActionSummary: true
      };
    } else {
      // Utiliser les informations du résumé d'actions
      return {
        summary: 'Actions documentées dans le résumé',
        details: actionSummary.actionsSection ? actionSummary.actionsSection.substring(0, 200) + '...' : 'Résumé d\'actions disponible',
        stats: `${changes.added} lignes ajoutées, ${changes.deleted} lignes supprimées, ${changes.modified} fichiers modifiés`,
        fromActionSummary: true
      };
    }
  }

  // Ajouter des détails basés sur l'analyse du contenu
  let details = [];
  if (contentAnalysis) {
    if (contentAnalysis.features.length > 0) {
      details.push(`Nouvelles fonctionnalités: ${contentAnalysis.features.join(', ')}`);
    }
    if (contentAnalysis.fixes.length > 0) {
      details.push(`Corrections: ${contentAnalysis.fixes.join(', ')}`);
    }
    if (contentAnalysis.configs.length > 0) {
      details.push(`Configurations: ${contentAnalysis.configs.join(', ')}`);
    }
    if (contentAnalysis.dependencies.length > 0) {
      details.push(`Dépendances: ${contentAnalysis.dependencies.join(', ')}`);
    }
    if (contentAnalysis.newFiles.length > 0) {
      details.push(`Nouveaux fichiers: ${contentAnalysis.newFiles.length}`);
    }
    if (contentAnalysis.deletedFiles.length > 0) {
      details.push(`Fichiers supprimés: ${contentAnalysis.deletedFiles.length}`);
    }
    if (contentAnalysis.specificDetails.length > 0) {
      details.push(`Détails: ${contentAnalysis.specificDetails.join(', ')}`);
    }
  }
  
  // Ajouter des détails basés sur le type de version
  const versionDetails = {
    major: 'Changements majeurs avec impact sur la compatibilité',
    minor: 'Nouvelles fonctionnalités et améliorations',
    patch: 'Corrections de bugs et optimisations'
  };
  
  if (details.length === 0) {
    details.push(versionDetails[versionType] || 'Mise à jour générale');
  }
  
  return {
    summary: summary || 'Modifications diverses',
    details: details.join(' | '),
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
  
  // Lire le résumé des actions
  const actionSummary = getActionSummary();
  
  // Analyser les changements Git
  const changes = getGitChanges();
  const intelligentSummary = generateIntelligentSummary(changes, versionType, actionSummary);
  
  // Message par défaut basé sur l'analyse intelligente
  const defaultMessages = {
    major: 'Mise à jour majeure avec changements incompatibles',
    minor: 'Nouvelle fonctionnalité ajoutée',
    patch: 'Correction de bugs et améliorations mineures'
  };
  
  const title = customMessage || intelligentSummary.summary || defaultMessages[versionType] || 'Mise à jour';
  
  // Si le résumé d'actions contient un message suggéré, l'utiliser
  if (actionSummary && actionSummary.hasSummary && actionSummary.suggestedMessage) {
    return actionSummary.suggestedMessage;
  }
  
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
      log(`   🔍 Détails: ${intelligentSummary.details}`, 'yellow');
      log('');
    }
    
    // Création du message de commit
    const commitMessage = getCommitMessage(version, versionType, customMessage);
    
    // Commit avec le message formaté
    execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
    
    log('✅ Commit effectué avec succès', 'green');
    
    // Nettoyer le fichier de résumé d'actions après le commit
    if (fs.existsSync(ACTION_SUMMARY_PATH)) {
      try {
        fs.unlinkSync(ACTION_SUMMARY_PATH);
        log('🧹 Fichier de résumé d\'actions nettoyé', 'blue');
      } catch (error) {
        log(`⚠️  Impossible de nettoyer le fichier de résumé: ${error.message}`, 'yellow');
      }
    }
    
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
