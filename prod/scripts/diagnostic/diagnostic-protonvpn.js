// Diagnostic ProtonVPN - Trouver l'installation
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

async function findProtonVPN() {
  console.log('🔍 Diagnostic ProtonVPN...\n');
  
  const platform = process.platform;
  console.log(`📋 Plateforme détectée: ${platform}`);
  
  // Chemins possibles pour ProtonVPN
  const possiblePaths = {
    win32: [
      'C:\\Program Files\\Proton Technologies\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Program Files (x86)\\Proton Technologies\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Roaming\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Program Files\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Program Files (x86)\\ProtonVPN\\ProtonVPN.exe'
    ],
    darwin: [
      '/Applications/ProtonVPN.app/Contents/MacOS/ProtonVPN',
      '/Applications/ProtonVPN.app/Contents/Resources/ProtonVPN',
      '/usr/local/bin/protonvpn',
      '/opt/homebrew/bin/protonvpn'
    ],
    linux: [
      '/usr/bin/protonvpn',
      '/usr/local/bin/protonvpn',
      '/opt/protonvpn/bin/protonvpn',
      '/snap/bin/protonvpn'
    ]
  };
  
  const paths = possiblePaths[platform] || [];
  console.log(`🔍 Recherche dans ${paths.length} emplacements possibles...\n`);
  
  for (const checkPath of paths) {
    try {
      const expandedPath = checkPath.replace('%USERNAME%', process.env.USERNAME || process.env.USER);
      console.log(`📍 Test: ${expandedPath}`);
      
      // Vérifier si le fichier existe
      if (fs.existsSync(expandedPath)) {
        console.log(`✅ Fichier trouvé: ${expandedPath}`);
        
        // Essayer d'exécuter avec --version
        try {
          const { stdout } = await execAsync(`"${expandedPath}" --version`);
          console.log(`📋 Version: ${stdout.trim()}`);
        } catch (versionError) {
          console.log(`⚠️ Impossible d'obtenir la version: ${versionError.message}`);
        }
        
        return expandedPath;
      } else {
        console.log(`❌ Fichier non trouvé`);
      }
    } catch (error) {
      console.log(`❌ Erreur: ${error.message}`);
    }
  }
  
  // Recherche alternative avec where/which
  console.log('\n🔍 Recherche alternative avec where/which...');
  try {
    const command = platform === 'win32' ? 'where protonvpn' : 'which protonvpn';
    const { stdout } = await execAsync(command);
    if (stdout.trim()) {
      console.log(`✅ Trouvé avec ${command}: ${stdout.trim()}`);
      return stdout.trim();
    }
  } catch (error) {
    console.log(`❌ Aucun résultat avec ${platform === 'win32' ? 'where' : 'which'}`);
  }
  
  // Recherche dans le registre Windows
  if (platform === 'win32') {
    console.log('\n🔍 Recherche dans le registre Windows...');
    try {
      const { stdout } = await execAsync('reg query "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /f "ProtonVPN"');
      if (stdout.includes('ProtonVPN')) {
        console.log('✅ ProtonVPN trouvé dans le registre Windows');
        console.log(stdout);
      }
    } catch (error) {
      console.log('❌ Erreur lors de la recherche dans le registre');
    }
  }
  
  // Recherche dans les processus en cours
  console.log('\n🔍 Recherche dans les processus en cours...');
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq *proton*" /FO CSV');
    if (stdout.includes('proton')) {
      console.log('✅ Processus ProtonVPN trouvé:');
      console.log(stdout);
    } else {
      console.log('❌ Aucun processus ProtonVPN trouvé');
    }
  } catch (error) {
    console.log('❌ Erreur lors de la recherche des processus');
  }
  
  return null;
}

async function checkProtonVPNInstallation() {
  console.log('📋 Vérification de l\'installation ProtonVPN...\n');
  
  const protonPath = await findProtonVPN();
  
  if (protonPath) {
    console.log(`\n✅ ProtonVPN trouvé: ${protonPath}`);
    console.log('💡 Utilisez ce chemin dans le script de scraping');
    return protonPath;
  } else {
    console.log('\n❌ ProtonVPN non trouvé !');
    console.log('\n📥 Solutions:');
    console.log('1. Téléchargez ProtonVPN depuis: https://protonvpn.com/download');
    console.log('2. Installez l\'application');
    console.log('3. Lancez ProtonVPN au moins une fois');
    console.log('4. Relancez ce diagnostic');
    return null;
  }
}

// Fonction pour tester la connexion manuelle
async function testManualConnection() {
  console.log('\n🔌 Test de connexion manuelle...');
  console.log('📋 Instructions:');
  console.log('1. Ouvrez ProtonVPN manuellement');
  console.log('2. Connectez-vous à un serveur');
  console.log('3. Vérifiez votre IP sur https://whatismyipaddress.com/');
  console.log('4. Notez le chemin de l\'exécutable ProtonVPN');
}

// Exécution du diagnostic
async function runDiagnostic() {
  console.log('🚀 Diagnostic ProtonVPN\n');
  console.log('=' * 50);
  
  const path = await checkProtonVPNInstallation();
  
  if (!path) {
    await testManualConnection();
  }
  
  console.log('\n' + '=' * 50);
  console.log('🏁 Diagnostic terminé');
}

runDiagnostic().catch(console.error);
