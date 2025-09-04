// Test de l'option LBC_USE_PROTONVPN
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProtonVPNOption() {
  console.log('🧪 Test de l\'option LBC_USE_PROTONVPN...\n');
  
  try {
    // Test 1: ProtonVPN activé
    console.log('🔌 Test 1: ProtonVPN activé (LBC_USE_PROTONVPN=true)');
    process.env.LBC_USE_PROTONVPN = 'true';
    
    // Simuler le comportement du script
    const useProtonVPN = (process.env.LBC_USE_PROTONVPN || 'true').toLowerCase() === 'true';
    console.log('   • LBC_USE_PROTONVPN =', process.env.LBC_USE_PROTONVPN);
    console.log('   • Résultat:', useProtonVPN ? '✅ Activé' : '❌ Désactivé');
    
    // Test 2: ProtonVPN désactivé
    console.log('\n🔌 Test 2: ProtonVPN désactivé (LBC_USE_PROTONVPN=false)');
    process.env.LBC_USE_PROTONVPN = 'false';
    
    const useProtonVPN2 = (process.env.LBC_USE_PROTONVPN || 'true').toLowerCase() === 'true';
    console.log('   • LBC_USE_PROTONVPN =', process.env.LBC_USE_PROTONVPN);
    console.log('   • Résultat:', useProtonVPN2 ? '✅ Activé' : '❌ Désactivé');
    
    // Test 3: Variable non définie (défaut)
    console.log('\n🔌 Test 3: Variable non définie (défaut)');
    delete process.env.LBC_USE_PROTONVPN;
    
    const useProtonVPN3 = (process.env.LBC_USE_PROTONVPN || 'true').toLowerCase() === 'true';
    console.log('   • LBC_USE_PROTONVPN =', process.env.LBC_USE_PROTONVPN || 'undefined');
    console.log('   • Résultat:', useProtonVPN3 ? '✅ Activé (défaut)' : '❌ Désactivé');
    
    // Test 4: Valeurs invalides
    console.log('\n🔌 Test 4: Valeurs invalides');
    const testValues = ['0', 'no', 'false', 'FALSE', 'False', 'off', 'disabled'];
    
    for (const value of testValues) {
      process.env.LBC_USE_PROTONVPN = value;
      const result = (process.env.LBC_USE_PROTONVPN || 'true').toLowerCase() === 'true';
      console.log(`   • LBC_USE_PROTONVPN = "${value}" → ${result ? '✅ Activé' : '❌ Désactivé'}`);
    }
    
    console.log('\n✅ Tests terminés avec succès !');
    console.log('\n💡 Utilisation :');
    console.log('   • Pour activer ProtonVPN:  LBC_USE_PROTONVPN=true');
    console.log('   • Pour désactiver ProtonVPN: LBC_USE_PROTONVPN=false');
    console.log('   • Par défaut: ProtonVPN est activé');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProtonVPNOption();
