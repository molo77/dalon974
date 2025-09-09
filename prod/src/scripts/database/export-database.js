// Exporter la base de données via Prisma
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');

// Charger les variables d'environnement depuis .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!value.startsWith('#')) {
        process.env[key.trim()] = value.replace(/^["']|["']$/g, '');
      }
    }
  });
  console.log('✅ Variables d\'environnement chargées depuis .env.local');
} else {
  console.log('⚠️ Fichier .env.local non trouvé');
}

const prisma = new PrismaClient();

async function exportDatabase() {
  console.log('📤 Export de la base de données...\n');
  
  try {
    const exportData = {
      exportDate: new Date().toISOString(),
      tables: {}
    };
    
    // Exporter les tables principales
    console.log('📋 Export des utilisateurs...');
    const users = await prisma.user.findMany();
    exportData.tables.users = users;
    console.log(`   ✅ ${users.length} utilisateurs exportés`);
    
    console.log('📋 Export des annonces...');
    const annonces = await prisma.annonce.findMany();
    exportData.tables.annonces = annonces;
    console.log(`   ✅ ${annonces.length} annonces exportées`);
    
    console.log('📋 Export des profils de colocation...');
    const colocs = await prisma.colocProfile.findMany();
    exportData.tables.colocProfiles = colocs;
    console.log(`   ✅ ${colocs.length} profils de colocation exportés`);
    
    console.log('📋 Export des messages...');
    const messages = await prisma.message.findMany();
    exportData.tables.messages = messages;
    console.log(`   ✅ ${messages.length} messages exportés`);
    
    console.log('📋 Export des paramètres du scraper...');
    const scraperSettings = await prisma.scraperSetting.findMany();
    exportData.tables.scraperSettings = scraperSettings;
    console.log(`   ✅ ${scraperSettings.length} paramètres exportés`);
    
    console.log('📋 Export des runs du scraper...');
    const scraperRuns = await prisma.scraperRun.findMany();
    exportData.tables.scraperRuns = scraperRuns;
    console.log(`   ✅ ${scraperRuns.length} runs exportés`);
    
    // Sauvegarder l'export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportPath = path.join(__dirname, '..', `rodcoloc_export_${timestamp}.json`);
    
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
    
    console.log(`\n✅ Export terminé !`);
    console.log(`📁 Fichier: ${exportPath}`);
    console.log(`📊 Résumé:`);
    console.log(`   • Utilisateurs: ${users.length}`);
    console.log(`   • Annonces: ${annonces.length}`);
    console.log(`   • Profils de colocation: ${colocs.length}`);
    console.log(`   • Messages: ${messages.length}`);
    console.log(`   • Paramètres scraper: ${scraperSettings.length}`);
    console.log(`   • Runs scraper: ${scraperRuns.length}`);
    
    // Créer aussi un script SQL pour l'import
    console.log('\n📝 Génération du script SQL...');
    const sqlScript = generateSQLScript(exportData);
    const sqlPath = path.join(__dirname, '..', `rodcoloc_import_${timestamp}.sql`);
    fs.writeFileSync(sqlPath, sqlScript);
    console.log(`📁 Script SQL: ${sqlPath}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'export:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function generateSQLScript(data) {
  let sql = `-- Script d'import pour rodcoloc_dev
-- Généré le: ${new Date().toISOString()}
-- Source: rodcoloc

SET FOREIGN_KEY_CHECKS = 0;

    -- Nettoyer les tables existantes
    DELETE FROM \`ScraperRun\`;
    DELETE FROM \`ScraperSetting\`;
    DELETE FROM \`Message\`;
    DELETE FROM \`AnnonceImage\`;
    DELETE FROM \`Annonce\`;
    DELETE FROM \`ColocImage\`;
    DELETE FROM \`ColocProfile\`;
    DELETE FROM \`User\`;

SET FOREIGN_KEY_CHECKS = 1;

`;

  // Insérer les utilisateurs
  if (data.tables.users && data.tables.users.length > 0) {
    sql += `-- Insertion des utilisateurs\n`;
    data.tables.users.forEach(user => {
      const createdAt = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = user.updatedAt ? new Date(user.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : createdAt;
      sql += `INSERT INTO \`User\` (\`id\`, \`email\`, \`name\`, \`role\`, \`providerId\`, \`displayName\`, \`createdAt\`, \`updatedAt\`) VALUES `;
      sql += `('${user.id}', '${user.email || ''}', '${user.name || ''}', '${user.role || 'user'}', '${user.providerId || ''}', '${user.displayName || ''}', '${createdAt}', '${updatedAt}');\n`;
    });
    sql += '\n';
  }

  // Insérer les annonces
  if (data.tables.annonces && data.tables.annonces.length > 0) {
    sql += `-- Insertion des annonces\n`;
    data.tables.annonces.forEach(annonce => {
      const createdAt = annonce.createdAt ? new Date(annonce.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = annonce.updatedAt ? new Date(annonce.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : createdAt;
      sql += `INSERT INTO \`Annonce\` (\`id\`, \`title\`, \`description\`, \`prix\`, \`surface\`, \`nbPieces\`, \`typeBien\`, \`meuble\`, \`ville\`, \`userId\`, \`photos\`, \`createdAt\`, \`updatedAt\`) VALUES `;
      sql += `('${annonce.id}', '${annonce.titre || ''}', '${annonce.description || ''}', ${annonce.prix || 0}, ${annonce.surface || 0}, ${annonce.nbPieces || 0}, '${annonce.typeBien || ''}', ${annonce.meuble ? 1 : 0}, '${annonce.commune || ''}', '${annonce.userId || ''}', '${JSON.stringify(annonce.photos || []).replace(/'/g, "''")}', '${createdAt}', '${updatedAt}');\n`;
    });
    sql += '\n';
  }

  // Insérer les profils de colocation
  if (data.tables.colocProfiles && data.tables.colocProfiles.length > 0) {
    sql += `-- Insertion des profils de colocation\n`;
    data.tables.colocProfiles.forEach(coloc => {
      const createdAt = coloc.createdAt ? new Date(coloc.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = coloc.updatedAt ? new Date(coloc.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : createdAt;
      sql += `INSERT INTO \`ColocProfile\` (\`id\`, \`title\`, \`description\`, \`budget\`, \`ville\`, \`userId\`, \`photos\`, \`createdAt\`, \`updatedAt\`) VALUES `;
      sql += `('${coloc.id}', '${coloc.titre || ''}', '${coloc.description || ''}', ${coloc.prix || 0}, '${coloc.commune || ''}', '${coloc.userId || ''}', '${JSON.stringify(coloc.photos || []).replace(/'/g, "''")}', '${createdAt}', '${updatedAt}');\n`;
    });
    sql += '\n';
  }

  // Insérer les messages
  if (data.tables.messages && data.tables.messages.length > 0) {
    sql += `-- Insertion des messages\n`;
    data.tables.messages.forEach(message => {
      const createdAt = message.createdAt ? new Date(message.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = message.updatedAt ? new Date(message.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : createdAt;
      sql += `INSERT INTO \`Message\` (\`id\`, \`content\`, \`userId\`, \`annonceId\`, \`createdAt\`, \`updatedAt\`) VALUES `;
      sql += `('${message.id}', '${message.content || ''}', '${message.userId || ''}', '${message.annonceId || ''}', '${createdAt}', '${updatedAt}');\n`;
    });
    sql += '\n';
  }

  // Insérer les paramètres du scraper
  if (data.tables.scraperSettings && data.tables.scraperSettings.length > 0) {
    sql += `-- Insertion des paramètres du scraper\n`;
    data.tables.scraperSettings.forEach(setting => {
      const updatedAt = setting.updatedAt ? new Date(setting.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      sql += `INSERT INTO \`ScraperSetting\` (\`key\`, \`value\`, \`updatedAt\`) VALUES `;
      sql += `('${setting.key}', '${setting.value || ''}', '${updatedAt}');\n`;
    });
    sql += '\n';
  }

  // Insérer les runs du scraper
  if (data.tables.scraperRuns && data.tables.scraperRuns.length > 0) {
    sql += `-- Insertion des runs du scraper\n`;
    data.tables.scraperRuns.forEach(run => {
      const startedAt = run.startedAt ? new Date(run.startedAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const finishedAt = run.finishedAt ? new Date(run.finishedAt).toISOString().slice(0, 19).replace('T', ' ') : null;
      const createdAt = run.createdAt ? new Date(run.createdAt).toISOString().slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ');
      const updatedAt = run.updatedAt ? new Date(run.updatedAt).toISOString().slice(0, 19).replace('T', ' ') : null;
      sql += `INSERT INTO \`ScraperRun\` (\`id\`, \`startedAt\`, \`finishedAt\`, \`status\`, \`totalCollected\`, \`totalUpserts\`, \`detailLimit\`, \`rawLog\`, \`errorMessage\`, \`createdCount\`, \`updatedCount\`, \`skippedRecentCount\`, \`cooldownHours\`, \`progress\`, \`currentStep\`, \`currentMessage\`, \`childPid\`, \`createdAt\`, \`updatedAt\`) VALUES `;
      sql += `('${run.id}', '${startedAt}', ${finishedAt ? `'${finishedAt}'` : 'NULL'}, '${run.status || ''}', ${run.totalCollected || 0}, ${run.totalUpserts || 0}, ${run.detailLimit || 0}, ${run.rawLog ? `'${run.rawLog.replace(/'/g, "''")}'` : 'NULL'}, ${run.errorMessage ? `'${run.errorMessage.replace(/'/g, "''")}'` : 'NULL'}, ${run.createdCount || 0}, ${run.updatedCount || 0}, ${run.skippedRecentCount || 0}, ${run.cooldownHours || 0}, ${run.progress || 0}, ${run.currentStep ? `'${run.currentStep.replace(/'/g, "''")}'` : 'NULL'}, ${run.currentMessage ? `'${run.currentMessage.replace(/'/g, "''")}'` : 'NULL'}, ${run.childPid || 'NULL'}, '${createdAt}', ${updatedAt ? `'${updatedAt}'` : 'NULL'});\n`;
    });
    sql += '\n';
  }

  sql += `-- Import terminé\n`;
  return sql;
}

exportDatabase();
