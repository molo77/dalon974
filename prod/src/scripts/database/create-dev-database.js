// Créer la base de données rodcoloc_dev
const mysql = require('mysql2/promise');

// Configuration de connexion (sans spécifier de base de données)
const DB_CONFIG = {
  host: '192.168.1.200',
  user: 'molo',
  password: 'Bulgroz@1977',
  port: 3306
};

async function createDevDatabase() {
  console.log('🏗️ Création de la base de données rodcoloc_dev...\n');
  
  try {
    // Se connecter au serveur MySQL
    console.log('🔌 Connexion au serveur MySQL...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connexion établie');
    
    // Vérifier si la base existe déjà
    console.log('🔍 Vérification de l\'existence de rodcoloc_dev...');
    const [rows] = await connection.execute('SHOW DATABASES LIKE "rodcoloc_dev"');
    
    if (rows.length > 0) {
      console.log('✅ La base de données rodcoloc_dev existe déjà');
    } else {
      console.log('📝 Création de la base de données rodcoloc_dev...');
      await connection.execute('CREATE DATABASE rodcoloc_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Base de données rodcoloc_dev créée');
    }
    
    // Vérifier les privilèges
    console.log('🔍 Vérification des privilèges...');
    const [privileges] = await connection.execute('SHOW GRANTS FOR CURRENT_USER()');
    
    let hasPrivileges = false;
    for (const row of privileges) {
      const grant = Object.values(row)[0];
      if (grant.includes('rodcoloc_dev') || grant.includes('*.*')) {
        hasPrivileges = true;
        break;
      }
    }
    
    if (hasPrivileges) {
      console.log('✅ Privilèges suffisants détectés');
    } else {
      console.log('⚠️ Privilèges insuffisants - contactez l\'administrateur');
    }
    
    // Fermer la connexion
    await connection.end();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('💡 Vous pouvez maintenant exécuter le script d\'import');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Vérifiez que le serveur MySQL est accessible sur 192.168.1.200:3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Vérifiez les identifiants de connexion');
    } else if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.log('💡 L\'utilisateur n\'a pas les privilèges pour créer des bases de données');
    }
  }
}

createDevDatabase();
