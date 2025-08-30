#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Test de lecture de la version depuis package.json
function testVersionReading() {
  console.log('🧪 Test de lecture de la version...');
  
  // Test depuis le répertoire racine
  try {
    const rootPackagePath = path.join(process.cwd(), 'package.json');
    const rootPackageContent = fs.readFileSync(rootPackagePath, 'utf8');
    const rootPackageData = JSON.parse(rootPackageContent);
    console.log(`✅ Version depuis racine: ${rootPackageData.version}`);
  } catch (error) {
    console.log(`❌ Erreur lecture racine: ${error.message}`);
  }
  
  // Test depuis le répertoire dev
  try {
    const devPackagePath = path.join(process.cwd(), 'dev', 'package.json');
    const devPackageContent = fs.readFileSync(devPackagePath, 'utf8');
    const devPackageData = JSON.parse(devPackageContent);
    console.log(`✅ Version depuis dev: ${devPackageData.version}`);
  } catch (error) {
    console.log(`❌ Erreur lecture dev: ${error.message}`);
  }
  
  // Test depuis le répertoire prod
  try {
    const prodPackagePath = path.join(process.cwd(), 'prod', 'package.json');
    const prodPackageContent = fs.readFileSync(prodPackagePath, 'utf8');
    const prodPackageData = JSON.parse(prodPackageContent);
    console.log(`✅ Version depuis prod: ${prodPackageData.version}`);
  } catch (error) {
    console.log(`❌ Erreur lecture prod: ${error.message}`);
  }
}

// Test de l'API (sans authentification)
async function testVersionAPI() {
  console.log('\n🌐 Test de l\'API de version...');
  
  try {
    const response = await fetch('http://localhost:3001/api/admin/version');
    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${data}`);
  } catch (error) {
    console.log(`❌ Erreur API: ${error.message}`);
  }
}

// Test de l'API de santé
async function testHealthAPI() {
  console.log('\n🏥 Test de l\'API de santé...');
  
  try {
    const response = await fetch('http://localhost:3001/api/health');
    const data = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${data.substring(0, 100)}...`);
  } catch (error) {
    console.log(`❌ Erreur API santé: ${error.message}`);
  }
}

// Fonction principale
async function main() {
  console.log('🔍 Diagnostic de l\'API de version\n');
  
  testVersionReading();
  await testHealthAPI();
  await testVersionAPI();
  
  console.log('\n📋 Résumé:');
  console.log('- L\'API de version nécessite une authentification admin');
  console.log('- Pour tester, connectez-vous en tant qu\'admin sur http://localhost:3001/admin');
  console.log('- Puis allez dans l\'onglet Maintenance pour voir les informations de version');
}

main().catch(console.error);
