// Migration complète vers dalon974_dev
const { execSync } = require('child_process');
const path = require('path');

async function migrateToDev() {
  console.log('🚀 Migration complète vers dalon974_dev\n');
  console.log('📋 Étapes de la migration:');
  console.log('   1. Export des données actuelles');
  console.log('   2. Création de la base dalon974_dev');
  console.log('   3. Application du schéma Prisma');
  console.log('   4. Import des données\n');
  
  try {
    // Étape 1: Export
    console.log('📤 ÉTAPE 1: Export des données actuelles...');
    execSync('node scripts/export-database.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Export terminé\n');
    
    // Étape 2: Création de la base
    console.log('🏗️ ÉTAPE 2: Création de la base dalon974_dev...');
    execSync('node scripts/create-dev-database.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Base créée\n');
    
    // Étape 3: Application du schéma
    console.log('📋 ÉTAPE 3: Application du schéma Prisma...');
    execSync('node scripts/apply-schema-to-dev.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Schéma appliqué\n');
    
    // Étape 4: Import des données
    console.log('📥 ÉTAPE 4: Import des données...');
    execSync('node scripts/import-database.js', { 
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    console.log('✅ Import terminé\n');
    
    console.log('🎉 Migration terminée avec succès !');
    console.log('📊 Base de données dalon974_dev prête à l\'emploi');
    console.log('💡 Pour utiliser la nouvelle base, modifiez DATABASE_URL dans .env.local');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.log('💡 Vérifiez les logs ci-dessus pour identifier le problème');
  }
}

migrateToDev();
