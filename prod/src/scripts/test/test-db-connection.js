// Test de connexion à la base de données MySQL
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  console.log('🔍 Test de connexion à la base de données...\n');
  
  // Configuration de la base de données
  const config = {
    host: 'mysql-molo.alwaysdata.net',
    port: 3306,
    user: 'molo',
    password: 'Bulgroz@1977',
    database: 'molo_rodcoloc',
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000,
    reconnect: true
  };
  
  console.log('📋 Configuration:');
  console.log(`Host: ${config.host}`);
  console.log(`Port: ${config.port}`);
  console.log(`User: ${config.user}`);
  console.log(`Database: ${config.database}`);
  console.log('');
  
  let connection;
  
  try {
    console.log('1️⃣ Tentative de connexion...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connexion réussie !');
    
    console.log('\n2️⃣ Test de requête simple...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Requête réussie !');
    console.log(`📋 Résultat: ${JSON.stringify(rows)}`);
    
    console.log('\n3️⃣ Test de requête sur la base de données...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('✅ Tables trouvées !');
    console.log(`📋 Nombre de tables: ${tables.length}`);
    tables.forEach((table, index) => {
      console.log(`   ${index + 1}. ${Object.values(table)[0]}`);
    });
    
    console.log('\n4️⃣ Test de requête sur les utilisateurs...');
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM User');
    console.log('✅ Requête utilisateurs réussie !');
    console.log(`📋 Nombre d'utilisateurs: ${users[0].count}`);
    
    console.log('\n🎉 Base de données opérationnelle !');
    
  } catch (error) {
    console.log('❌ Erreur de connexion:');
    console.log(`Code: ${error.code}`);
    console.log(`Message: ${error.message}`);
    console.log(`SQL State: ${error.sqlState}`);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Problème d\'authentification - vérifiez les identifiants');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Connexion refusée - vérifiez que le serveur MySQL est actif');
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n💡 Serveur introuvable - vérifiez l\'adresse du serveur');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('\n💡 Timeout - vérifiez la connectivité réseau');
    }
  } finally {
    if (connection) {
      try {
        await connection.end();
        console.log('\n🔌 Connexion fermée');
      } catch (error) {
        console.log('⚠️ Erreur lors de la fermeture de la connexion:', error.message);
      }
    }
  }
}

// Test avec Prisma aussi
async function testPrismaConnection() {
  console.log('\n🔍 Test de connexion Prisma...\n');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    console.log('1️⃣ Test de connexion Prisma...');
    await prisma.$connect();
    console.log('✅ Connexion Prisma réussie !');
    
    console.log('\n2️⃣ Test de requête Prisma...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Requête Prisma réussie !');
    console.log(`📋 Résultat: ${JSON.stringify(result)}`);
    
    console.log('\n3️⃣ Test de requête sur les utilisateurs...');
    const userCount = await prisma.user.count();
    console.log('✅ Requête utilisateurs réussie !');
    console.log(`📋 Nombre d'utilisateurs: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('\n🔌 Connexion Prisma fermée');
    
  } catch (error) {
    console.log('❌ Erreur Prisma:');
    console.log(`Message: ${error.message}`);
  }
}

async function runTests() {
  await testDatabaseConnection();
  await testPrismaConnection();
}

runTests().catch(console.error);
