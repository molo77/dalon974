#!/usr/bin/env node

/**
 * Système de logging pour le scraper avec backup automatique
 * Gère la rotation des logs et la sauvegarde des anciens fichiers
 */

const fs = require('fs');
const path = require('path');

class ScraperLogger {
  constructor() {
    this.logDir = path.join(__dirname);
    this.currentLogFile = path.join(this.logDir, 'scraper-current.log');
    this.backupDir = path.join(this.logDir, 'backups');
    this.maxLogSize = 10 * 1024 * 1024; // 10MB
    this.maxBackups = 5; // Garder 5 backups maximum
    
    // Créer le dossier de backup s'il n'existe pas
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * Initialise le système de logging
   */
  initialize() {
    this.rotateLogIfNeeded();
    this.cleanOldBackups();
  }

  /**
   * Vérifie si le fichier de log doit être roté
   */
  rotateLogIfNeeded() {
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      if (stats.size > this.maxLogSize) {
        this.rotateLog();
      }
    }
  }

  /**
   * Effectue la rotation du fichier de log
   */
  rotateLog() {
    if (fs.existsSync(this.currentLogFile)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupDir, `scraper-${timestamp}.log`);
      
      try {
        fs.renameSync(this.currentLogFile, backupFile);
        console.log(`📁 Log roté vers: ${backupFile}`);
      } catch (error) {
        console.error('❌ Erreur lors de la rotation du log:', error.message);
      }
    }
  }

  /**
   * Nettoie les anciens fichiers de backup
   */
  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('scraper-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);

      // Supprimer les fichiers en excès
      if (files.length > this.maxBackups) {
        const filesToDelete = files.slice(this.maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`🗑️ Backup supprimé: ${file.name}`);
        });
      }
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des backups:', error.message);
    }
  }

  /**
   * Formate le message de log
   */
  formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(8);
    return `[${timestamp}] [${levelUpper}] ${message}`;
  }

  /**
   * Écrit dans le fichier de log
   */
  writeToFile(level, message) {
    try {
      const formattedMessage = this.formatMessage(level, message);
      fs.appendFileSync(this.currentLogFile, formattedMessage + '\n');
      
      // Vérifier si une rotation est nécessaire après écriture
      this.rotateLogIfNeeded();
    } catch (error) {
      console.error('❌ Erreur lors de l\'écriture du log:', error.message);
    }
  }

  /**
   * Log d'information
   */
  info(message) {
    const formattedMessage = this.formatMessage('info', message);
    console.log(`ℹ️  ${message}`);
    this.writeToFile('info', message);
  }

  /**
   * Log de succès
   */
  success(message) {
    const formattedMessage = this.formatMessage('success', message);
    console.log(`✅ ${message}`);
    this.writeToFile('success', message);
  }

  /**
   * Log d'avertissement
   */
  warning(message) {
    const formattedMessage = this.formatMessage('warning', message);
    console.log(`⚠️  ${message}`);
    this.writeToFile('warning', message);
  }

  /**
   * Log d'erreur
   */
  error(message) {
    const formattedMessage = this.formatMessage('error', message);
    console.error(`❌ ${message}`);
    this.writeToFile('error', message);
  }

  /**
   * Log de debug
   */
  debug(message) {
    const formattedMessage = this.formatMessage('debug', message);
    console.log(`🔍 ${message}`);
    this.writeToFile('debug', message);
  }

  /**
   * Log de démarrage
   */
  start(message) {
    const formattedMessage = this.formatMessage('start', message);
    console.log(`🚀 ${message}`);
    this.writeToFile('start', message);
  }

  /**
   * Log de fin
   */
  end(message) {
    const formattedMessage = this.formatMessage('end', message);
    console.log(`🏁 ${message}`);
    this.writeToFile('end', message);
  }

  /**
   * Log de métriques
   */
  metrics(data) {
    const message = `METRICS: ${JSON.stringify(data)}`;
    const formattedMessage = this.formatMessage('metrics', message);
    console.log(`📊 ${message}`);
    this.writeToFile('metrics', message);
  }

  /**
   * Obtient le chemin du fichier de log actuel
   */
  getCurrentLogPath() {
    return this.currentLogFile;
  }

  /**
   * Obtient la liste des fichiers de backup
   */
  getBackupFiles() {
    try {
      return fs.readdirSync(this.backupDir)
        .filter(file => file.startsWith('scraper-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime - a.stats.mtime);
    } catch (error) {
      console.error('❌ Erreur lors de la lecture des backups:', error.message);
      return [];
    }
  }

  /**
   * Affiche les statistiques des logs
   */
  showStats() {
    console.log('\n📊 Statistiques des logs du scraper:');
    console.log(`📁 Dossier de logs: ${this.logDir}`);
    console.log(`📄 Fichier actuel: ${this.currentLogFile}`);
    console.log(`📦 Dossier de backup: ${this.backupDir}`);
    
    // Taille du fichier actuel
    if (fs.existsSync(this.currentLogFile)) {
      const stats = fs.statSync(this.currentLogFile);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`📏 Taille actuelle: ${sizeKB} KB`);
    } else {
      console.log('📏 Taille actuelle: 0 KB (fichier inexistant)');
    }
    
    // Nombre de backups
    const backups = this.getBackupFiles();
    console.log(`📦 Nombre de backups: ${backups.length}`);
    
    if (backups.length > 0) {
      console.log('📋 Derniers backups:');
      backups.slice(0, 3).forEach((backup, index) => {
        const sizeKB = Math.round(backup.stats.size / 1024);
        const date = backup.stats.mtime.toLocaleString();
        console.log(`  ${index + 1}. ${backup.name} (${sizeKB} KB) - ${date}`);
      });
    }
  }
}

module.exports = ScraperLogger;
