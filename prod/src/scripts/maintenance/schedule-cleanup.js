const { cleanupUnusedImages } = require('./cleanup-unused-images');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const LOG_DIR = path.join(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'cleanup-images.log');

/**
 * Crée le dossier de logs s'il n'existe pas
 */
async function ensureLogDirectory() {
  try {
    await fs.access(LOG_DIR);
  } catch {
    await fs.mkdir(LOG_DIR, { recursive: true });
  }
}

/**
 * Écrit un message dans le fichier de log
 */
async function writeLog(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  try {
    await fs.appendFile(LOG_FILE, logMessage);
  } catch (error) {
    console.error('❌ Erreur lors de l\'écriture du log:', error);
  }
}

/**
 * Nettoie les anciens logs (garde seulement les 30 derniers jours)
 */
async function cleanupOldLogs() {
  try {
    const logContent = await fs.readFile(LOG_FILE, 'utf-8');
    const lines = logContent.split('\n').filter(line => line.trim());
    
    // Garder seulement les logs des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentLines = lines.filter(line => {
      const match = line.match(/\[(.*?)\]/);
      if (match) {
        const logDate = new Date(match[1]);
        return logDate > thirtyDaysAgo;
      }
      return true; // Garder les lignes sans timestamp
    });
    
    await fs.writeFile(LOG_FILE, recentLines.join('\n') + '\n');
  } catch (error) {
    // Ignorer les erreurs si le fichier n'existe pas encore
  }
}

/**
 * Fonction principale de planification
 */
async function scheduledCleanup() {
  console.log('🕐 Début du nettoyage planifié...');
  
  try {
    await ensureLogDirectory();
    await writeLog('🧹 Début du nettoyage automatique des images');
    
    // Exécuter le nettoyage
    await cleanupUnusedImages();
    
    await writeLog('✅ Nettoyage automatique terminé avec succès');
    console.log('✅ Nettoyage planifié terminé');
    
    // Nettoyer les anciens logs
    await cleanupOldLogs();
    
  } catch (error) {
    const errorMessage = `❌ Erreur lors du nettoyage automatique: ${error.message}`;
    await writeLog(errorMessage);
    console.error(errorMessage);
    throw error;
  }
}

/**
 * Fonction pour tester le nettoyage
 */
async function testCleanup() {
  console.log('🧪 Test du nettoyage...');
  
  try {
    await ensureLogDirectory();
    await writeLog('🧪 Test du nettoyage des images');
    
    // Exécuter en mode dry-run
    const originalArgv = process.argv;
    process.argv = [...originalArgv, '--dry-run', '--verbose'];
    
    await cleanupUnusedImages();
    
    process.argv = originalArgv;
    
    await writeLog('✅ Test du nettoyage terminé');
    console.log('✅ Test terminé');
    
  } catch (error) {
    const errorMessage = `❌ Erreur lors du test: ${error.message}`;
    await writeLog(errorMessage);
    console.error(errorMessage);
    throw error;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      testCleanup();
      break;
    case 'cleanup':
    default:
      scheduledCleanup();
      break;
  }
}

module.exports = { scheduledCleanup, testCleanup };
