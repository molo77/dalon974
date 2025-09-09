// Basculement entre les bases de données
const fs = require('fs');
const path = require('path');

const PRODUCTION_DB = 'mysql://molo:password@mysql-molo.alwaysdata.com:3306/rodcoloc';
const DEVELOPMENT_DB = 'mysql://molo:Bulgroz%401977@192.168.1.200:3306/rodcoloc_dev';

async function switchDatabase() {
  console.log('🔄 Basculement de base de données...\n');
  
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Fichier .env.local non trouvé');
      return;
    }
    
    // Lire le contenu actuel
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Détecter la base actuelle
    const currentDbMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
    if (!currentDbMatch) {
      console.log('❌ DATABASE_URL non trouvé dans .env.local');
      return;
    }
    
    const currentDb = currentDbMatch[1];
    let newDb, newDbName;
    
    if (currentDb.includes('alwaysdata.com')) {
      // Basculer vers la base de développement
      newDb = DEVELOPMENT_DB;
      newDbName = 'développement (rodcoloc_dev)';
      console.log('🔄 Basculement vers la base de développement...');
    } else {
      // Basculer vers la base de production
      newDb = PRODUCTION_DB;
      newDbName = 'production (rodcoloc)';
      console.log('🔄 Basculement vers la base de production...');
    }
    
    // Remplacer la DATABASE_URL
    const newEnvContent = envContent.replace(
      /DATABASE_URL="[^"]*"/,
      `DATABASE_URL="${newDb}"`
    );
    
    // Sauvegarder
    fs.writeFileSync(envPath, newEnvContent);
    
    console.log(`✅ Basculé vers: ${newDbName}`);
    console.log(`📊 URL: ${newDb}`);
    
    // Afficher les informations de connexion
    if (newDb.includes('192.168.1.200')) {
      console.log('\n💡 Base de développement locale:');
      console.log('   • Serveur: 192.168.1.200:3306');
      console.log('   • Base: rodcoloc_dev');
      console.log('   • Données: Importées depuis la production');
    } else {
      console.log('\n💡 Base de production:');
      console.log('   • Serveur: mysql-molo.alwaysdata.com:3306');
      console.log('   • Base: rodcoloc');
      console.log('   • Données: Production live');
    }
    
    console.log('\n🔄 Redémarrez le serveur pour appliquer les changements');
    console.log('   npm run dev');
    
  } catch (error) {
    console.error('❌ Erreur lors du basculement:', error.message);
  }
}

switchDatabase();
