// Appliquer le schéma Prisma à rodcoloc_dev
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function applySchemaToDev() {
  console.log('🏗️ Application du schéma Prisma à rodcoloc_dev...\n');
  
  try {
    // Créer un fichier .env temporaire pour la base de développement
    const tempEnvPath = path.join(__dirname, '..', '.env.dev');
    const devDbUrl = 'mysql://molo:Bulgroz%401977@192.168.1.200:3306/rodcoloc_dev';
    
    const envContent = `DATABASE_URL="${devDbUrl}"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key"
`;
    
    fs.writeFileSync(tempEnvPath, envContent);
    console.log('✅ Fichier .env.dev créé');
    
    // Sauvegarder l'ancien DATABASE_URL
    const originalEnvPath = path.join(__dirname, '..', '.env.local');
    let originalEnvContent = '';
    let originalDbUrl = '';
    
    if (fs.existsSync(originalEnvPath)) {
      originalEnvContent = fs.readFileSync(originalEnvPath, 'utf8');
      const dbUrlMatch = originalEnvContent.match(/DATABASE_URL="([^"]+)"/);
      if (dbUrlMatch) {
        originalDbUrl = dbUrlMatch[1];
      }
    }
    
    // Remplacer temporairement le DATABASE_URL
    if (originalDbUrl) {
      const newEnvContent = originalEnvContent.replace(
        /DATABASE_URL="[^"]*"/,
        `DATABASE_URL="${devDbUrl}"`
      );
      fs.writeFileSync(originalEnvPath, newEnvContent);
      console.log('✅ DATABASE_URL temporairement modifié');
    }
    
    try {
      // Générer le client Prisma
      console.log('🔧 Génération du client Prisma...');
      execSync('npx prisma generate', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      // Appliquer le schéma
      console.log('📋 Application du schéma...');
      execSync('npx prisma db push', { 
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
      
      console.log('✅ Schéma appliqué avec succès !');
      
    } finally {
      // Restaurer l'ancien DATABASE_URL
      if (originalDbUrl) {
        const restoredEnvContent = originalEnvContent.replace(
          /DATABASE_URL="[^"]*"/,
          `DATABASE_URL="${originalDbUrl}"`
        );
        fs.writeFileSync(originalEnvPath, restoredEnvContent);
        console.log('✅ DATABASE_URL restauré');
      }
      
      // Nettoyer le fichier temporaire
      if (fs.existsSync(tempEnvPath)) {
        fs.unlinkSync(tempEnvPath);
        console.log('✅ Fichier .env.dev supprimé');
      }
    }
    
    console.log('\n🎉 Schéma appliqué avec succès à rodcoloc_dev !');
    console.log('💡 Vous pouvez maintenant importer les données');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application du schéma:', error.message);
  }
}

applySchemaToDev();
