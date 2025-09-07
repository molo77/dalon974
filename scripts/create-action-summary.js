#!/usr/bin/env node

/**
 * Script pour créer un résumé d'actions
 * Utilisé pour documenter les modifications avant un commit
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ACTION_SUMMARY_PATH = path.join(__dirname, '..', 'action-summary.md');

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

function createActionSummary() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  log('📝 Création du résumé d\'actions', 'blue');
  log('================================', 'blue');

  const summary = {
    title: '',
    objective: '',
    actions: [],
    technicalDetails: [],
    result: '',
    commitMessage: ''
  };

  function askQuestion(question, callback) {
    rl.question(`${colors.cyan}${question}${colors.reset}`, callback);
  }

  function askMultiLine(question, callback) {
    log(`${colors.cyan}${question}${colors.reset}`);
    log(`${colors.yellow}(Tapez 'FIN' sur une ligne vide pour terminer)${colors.reset}`);
    
    const lines = [];
    const askLine = () => {
      rl.question('> ', (line) => {
        if (line.trim() === 'FIN') {
          callback(lines.join('\n'));
        } else {
          lines.push(line);
          askLine();
        }
      });
    };
    askLine();
  }

  askQuestion('🎯 Titre de la session: ', (title) => {
    summary.title = title;
    
    askQuestion('📋 Objectif principal: ', (objective) => {
      summary.objective = objective;
      
      askMultiLine('✅ Actions réalisées (une par ligne):', (actions) => {
        summary.actions = actions.split('\n').filter(a => a.trim());
        
        askMultiLine('🔧 Détails techniques (fichiers modifiés, APIs, etc.):', (details) => {
          summary.technicalDetails = details.split('\n').filter(d => d.trim());
          
          askQuestion('🎉 Résultat final: ', (result) => {
            summary.result = result;
            
            askQuestion('📝 Message de commit suggéré: ', (commitMessage) => {
              summary.commitMessage = commitMessage;
              
              // Générer le fichier markdown
              generateMarkdownFile(summary);
              rl.close();
            });
          });
        });
      });
    });
  });
}

function generateMarkdownFile(summary) {
  const timestamp = new Date().toLocaleString('fr-FR');
  
  const markdown = `# Résumé des Actions - Session Actuelle

## 🚀 ${summary.title}

### 📅 Date: ${timestamp.split(',')[0]}
### 🎯 Objectif: ${summary.objective}

---

## ✅ Actions Réalisées

${summary.actions.map(action => `- **${action}**`).join('\n')}

---

## 🔧 Détails Techniques

${summary.technicalDetails.map(detail => `- ${detail}`).join('\n')}

---

## 🎯 Résultat Final

${summary.result}

---

## 📝 Notes pour le Commit

**Type de commit:** Feature (nouvelle fonctionnalité)  
**Impact:** ${summary.objective}  
**Tests:** APIs fonctionnelles, interface utilisateur opérationnelle  
**Documentation:** Code commenté et structure claire  

**Message de commit suggéré:**
\`\`\`
${summary.commitMessage}
\`\`\`
`;

  try {
    fs.writeFileSync(ACTION_SUMMARY_PATH, markdown, 'utf8');
    log('✅ Fichier de résumé créé avec succès !', 'green');
    log(`📁 Emplacement: ${ACTION_SUMMARY_PATH}`, 'blue');
    log('💡 Utilisez "npm run commit:patch" pour commiter avec ce résumé', 'yellow');
  } catch (error) {
    log(`❌ Erreur lors de la création du fichier: ${error.message}`, 'red');
  }
}

// Vérifier si le fichier existe déjà
if (fs.existsSync(ACTION_SUMMARY_PATH)) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question(`${colors.yellow}⚠️  Un fichier de résumé existe déjà. Le remplacer ? (y/N): ${colors.reset}`, (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      rl.close();
      createActionSummary();
    } else {
      log('❌ Opération annulée', 'red');
      rl.close();
    }
  });
} else {
  createActionSummary();
}
