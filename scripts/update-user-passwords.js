#!/usr/bin/env node

const { hash } = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

// Configuration
const NEW_PASSWORD = 'Bulgroz!1977';
const USERS_TO_UPDATE = [
  'molo777@gmail.com',
  'cedric.roddier@gmail.com'
];

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getDatabaseConfig(environment) {
  const envFile = environment === 'dev' ? 'dev/.env.local' : 'prod/.env.local';
  require('dotenv').config({ path: envFile });
  
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(`DATABASE_URL non trouvée dans ${envFile}`);
  }
  
  // Parse DATABASE_URL: mysql://user:password@host:port/database
  const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    throw new Error(`Format DATABASE_URL invalide: ${url}`);
  }
  
  // Décoder le mot de passe (gérer l'encodage URL)
  const password = decodeURIComponent(match[2]);
  
  return {
    host: match[3],
    port: parseInt(match[4]),
    user: match[1],
    password: password,
    database: match[5]
  };
}

async function updateUserPassword(connection, email, hashedPassword) {
  const [result] = await connection.execute(
    'UPDATE User SET password = ?, updatedAt = NOW() WHERE email = ?',
    [hashedPassword, email]
  );
  
  if (result.affectedRows === 0) {
    // L'utilisateur n'existe pas, le créer
    const userId = require('crypto').randomUUID();
    await connection.execute(
      'INSERT INTO User (id, email, password, name, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [userId, email, hashedPassword, email.split('@')[0], 'user']
    );
    return 'created';
  }
  
  return 'updated';
}

async function updatePasswordsInEnvironment(environment) {
  log(`\n${colors.bright}=== Mise à jour des mots de passe en ${environment.toUpperCase()} ===${colors.reset}`, 'blue');
  
  try {
    // Configuration de la base de données
    const dbConfig = await getDatabaseConfig(environment);
    log(`Connexion à la base de données ${environment}...`, 'blue');
    
    // Connexion à la base de données
    const connection = await mysql.createConnection(dbConfig);
    
    // Hash du nouveau mot de passe
    log('Hashage du mot de passe...', 'blue');
    const hashedPassword = await hash(NEW_PASSWORD, 12);
    
    // Mise à jour de chaque utilisateur
    for (const email of USERS_TO_UPDATE) {
      try {
        log(`Mise à jour de ${email}...`, 'yellow');
        const action = await updateUserPassword(connection, email, hashedPassword);
        log(`✅ ${email} ${action === 'created' ? 'créé' : 'mis à jour'}`, 'green');
      } catch (error) {
        log(`❌ Erreur pour ${email}: ${error.message}`, 'red');
      }
    }
    
    // Fermeture de la connexion
    await connection.end();
    log(`✅ Mise à jour ${environment} terminée`, 'green');
    
  } catch (error) {
    log(`❌ Erreur ${environment}: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  log(`${colors.bright}🔐 Mise à jour des mots de passe utilisateurs${colors.reset}`, 'blue');
  log(`Mot de passe: ${NEW_PASSWORD}`, 'yellow');
  log(`Utilisateurs: ${USERS_TO_UPDATE.join(', ')}`, 'yellow');
  
  try {
    // Mise à jour en développement
    await updatePasswordsInEnvironment('dev');
    
    // Mise à jour en production
    await updatePasswordsInEnvironment('prod');
    
    log(`\n${colors.bright}🎉 Mise à jour terminée avec succès !${colors.reset}`, 'green');
    log(`Les utilisateurs peuvent maintenant se connecter avec le mot de passe: ${NEW_PASSWORD}`, 'green');
    
  } catch (error) {
    log(`\n${colors.bright}❌ Échec de la mise à jour${colors.reset}`, 'red');
    log(`Erreur: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécution du script
if (require.main === module) {
  main();
}

module.exports = { updatePasswordsInEnvironment };
