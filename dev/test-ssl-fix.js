#!/usr/bin/env node

/**
 * Script de test pour vérifier la configuration SSL NextAuth
 * Usage: node test-ssl-fix.js
 */

console.log('🔒 Test de configuration SSL NextAuth');
console.log('=====================================\n');

// Vérifier les variables d'environnement
const envVars = [
  'NODE_ENV',
  'EMAIL_SERVER_HOST',
  'EMAIL_SERVER_PORT',
  'NEXTAUTH_DEBUG'
];

console.log('📋 Variables d\'environnement :');
envVars.forEach(varName => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value || 'non définie'}`);
});

console.log('\n🔧 Configuration recommandée pour résoudre l\'erreur SSL :');
console.log('1. Désactiver temporairement le provider Email :');
console.log('   EMAIL_SERVER_HOST=disabled');
console.log('\n2. Ou ignorer les certificats SSL auto-signés :');
console.log('   NODE_TLS_REJECT_UNAUTHORIZED=0');
console.log('\n3. Activer le débogage NextAuth :');
console.log('   NEXTAUTH_DEBUG=true');

console.log('\n✅ Script de test terminé');
console.log('📖 Consultez SSL_TROUBLESHOOTING.md pour plus de détails');
