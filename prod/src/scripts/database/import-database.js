// Importer la base de données vers rodcoloc_dev
const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Configuration de la base de données de destination
const DB_CONFIG = {
  host: '192.168.1.200',
  user: 'molo',
  password: 'Bulgroz@1977',
  database: 'rodcoloc_dev',
  port: 3306
};

async function importDatabase() {
  console.log('📥 Import vers rodcoloc_dev...\n');
  
  try {
    // Se connecter à la base de données de destination
    console.log('🔌 Connexion à la base de données de destination...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connexion établie');
    
    // Lire le script SQL généré
    const sqlFiles = fs.readdirSync(__dirname + '/..').filter(file => 
      file.startsWith('rodcoloc_import_') && file.endsWith('.sql')
    );
    
    if (sqlFiles.length === 0) {
      console.log('❌ Aucun fichier SQL d\'import trouvé');
      console.log('💡 Exécutez d\'abord le script d\'export');
      return;
    }
    
    // Prendre le plus récent
    const latestSqlFile = sqlFiles.sort().pop();
    const sqlPath = path.join(__dirname, '..', latestSqlFile);
    console.log(`📁 Utilisation du fichier: ${latestSqlFile}`);
    
    // Lire le contenu SQL
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Diviser en requêtes individuelles
    const queries = sqlContent
      .split(';')
      .map(query => query.trim())
      .filter(query => query.length > 0 && !query.startsWith('--'));
    
    console.log(`📊 ${queries.length} requêtes à exécuter\n`);
    
    // Exécuter les requêtes
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      try {
        await connection.execute(query);
        successCount++;
        if (i % 10 === 0) {
          console.log(`   ✅ ${i + 1}/${queries.length} requêtes exécutées`);
        }
      } catch (error) {
        errorCount++;
        console.log(`   ❌ Erreur requête ${i + 1}: ${error.message}`);
        console.log(`   Query: ${query.substring(0, 100)}...`);
      }
    }
    
    // Fermer la connexion
    await connection.end();
    
    console.log(`\n🎉 Import terminé !`);
    console.log(`📊 Résumé:`);
    console.log(`   • Requêtes réussies: ${successCount}`);
    console.log(`   • Erreurs: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log(`✅ Import réussi vers rodcoloc_dev`);
    } else {
      console.log(`⚠️ Import terminé avec ${errorCount} erreurs`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'import:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Vérifiez que le serveur MySQL est accessible sur 192.168.1.200:3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Vérifiez les identifiants de connexion');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('💡 La base de données rodcoloc_dev n\'existe pas');
      console.log('💡 Créez-la d\'abord avec: CREATE DATABASE rodcoloc_dev;');
    }
  }
}

importDatabase();
