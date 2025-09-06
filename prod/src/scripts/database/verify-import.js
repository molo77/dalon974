// Vérifier l'import vers dalon974_dev
const mysql = require('mysql2/promise');

// Configuration de la base de données de destination
const DB_CONFIG = {
  host: '192.168.1.200',
  user: 'molo',
  password: 'Bulgroz@1977',
  database: 'dalon974_dev',
  port: 3306
};

async function verifyImport() {
  console.log('🔍 Vérification de l\'import vers dalon974_dev...\n');
  
  try {
    // Se connecter à la base de données de destination
    console.log('🔌 Connexion à dalon974_dev...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connexion établie');
    
    // Vérifier chaque table
    const tables = [
      { name: 'User', description: 'Utilisateurs' },
      { name: 'Annonce', description: 'Annonces' },
      { name: 'ColocProfile', description: 'Profils de colocation' },
      { name: 'Message', description: 'Messages' },
      { name: 'ScraperSetting', description: 'Paramètres du scraper' },
      { name: 'ScraperRun', description: 'Runs du scraper' }
    ];
    
    console.log('📊 Vérification des données importées:\n');
    
    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM \`${table.name}\``);
        const count = rows[0].count;
        console.log(`   • ${table.description}: ${count} enregistrements`);
        
        // Afficher quelques exemples pour les tables principales
        if (count > 0 && ['User', 'Annonce', 'ColocProfile'].includes(table.name)) {
          const [samples] = await connection.execute(`SELECT * FROM \`${table.name}\` LIMIT 2`);
          console.log(`     Exemples: ${samples.map(row => {
            if (table.name === 'User') return `${row.email} (${row.role})`;
            if (table.name === 'Annonce') return `${row.title} - ${row.prix}€`;
            if (table.name === 'ColocProfile') return `${row.title} - ${row.budget}€`;
            return row.id;
          }).join(', ')}`);
        }
        
      } catch (error) {
        console.log(`   ❌ Erreur table ${table.name}: ${error.message}`);
      }
    }
    
    // Vérifier les paramètres du scraper
    console.log('\n🔧 Paramètres du scraper importés:');
    try {
      const [settings] = await connection.execute('SELECT `key`, `value` FROM ScraperSetting ORDER BY `key`');
      settings.forEach(setting => {
        console.log(`   • ${setting.key}: ${setting.value ? setting.value.substring(0, 50) + '...' : 'null'}`);
      });
    } catch (error) {
      console.log(`   ❌ Erreur paramètres: ${error.message}`);
    }
    
    // Vérifier les derniers runs
    console.log('\n📈 Derniers runs du scraper:');
    try {
      const [runs] = await connection.execute('SELECT id, status, startedAt, totalCollected, progress FROM ScraperRun ORDER BY startedAt DESC LIMIT 3');
      runs.forEach(run => {
        console.log(`   • ${run.id}: ${run.status} - ${run.totalCollected || 0} annonces - ${(run.progress * 100).toFixed(1)}%`);
      });
    } catch (error) {
      console.log(`   ❌ Erreur runs: ${error.message}`);
    }
    
    // Fermer la connexion
    await connection.end();
    
    console.log('\n🎉 Vérification terminée !');
    console.log('✅ Base de données dalon974_dev prête à l\'emploi');
    console.log('💡 Pour utiliser cette base, modifiez DATABASE_URL dans .env.local vers:');
    console.log('   mysql://molo:Bulgroz%401977@192.168.1.200:3306/dalon974_dev');
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

verifyImport();
