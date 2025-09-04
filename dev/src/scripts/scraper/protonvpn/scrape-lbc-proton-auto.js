// Scraper Leboncoin avec connexion automatique ProtonVPN
// Automatise la connexion ProtonVPN via l'interface graphique

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuration par défaut
const DEFAULT_CONFIG = {
  LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
  LBC_BROWSER_HEADLESS: 'false',
  LBC_MAX: '40',
  LBC_FETCH_DETAILS: 'true',
  LBC_DETAIL_LIMIT: '12',
  LBC_PAGES: '1',
  LBC_DEBUG: 'false'
};

// Configuration ProtonVPN
const PROTONVPN_CONFIG = {
  // Chemins possibles pour ProtonVPN
  appPaths: {
    windows: [
      'C:\\Users\\%USERNAME%\\AppData\\Roaming\\Python\\Python313\\Scripts\\protonvpn.exe',
      'C:\\Program Files\\Proton Technologies\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Program Files (x86)\\Proton Technologies\\ProtonVPN\\ProtonVPN.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\ProtonVPN\\ProtonVPN.exe'
    ],
    mac: [
      '/Applications/ProtonVPN.app/Contents/MacOS/ProtonVPN'
    ],
    linux: [
      '/usr/bin/protonvpn',
      '/usr/local/bin/protonvpn'
    ]
  },
  // Serveurs recommandés
  servers: ['FR#1', 'NL#1', 'DE#1', 'FR#2', 'NL#2', 'DE#2']
};

async function getConfig() {
  const settings = await prisma.scraperSetting.findMany();
  const config = { ...DEFAULT_CONFIG };
  
  settings.forEach(setting => {
    config[setting.key] = setting.value;
  });
  
  return config;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// User agents alternatifs
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function getCurrentIP() {
  try {
    const { stdout } = await execAsync('curl -s https://api.ipify.org');
    return stdout.trim();
  } catch (error) {
    console.log('⚠️ Impossible de récupérer l\'IP actuelle');
    return null;
  }
}

async function findProtonVPNPath() {
  const platform = process.platform;
  let paths = [];
  
  if (platform === 'win32') {
    paths = PROTONVPN_CONFIG.appPaths.windows;
  } else if (platform === 'darwin') {
    paths = PROTONVPN_CONFIG.appPaths.mac;
  } else {
    paths = PROTONVPN_CONFIG.appPaths.linux;
  }
  
  for (const path of paths) {
    try {
      const expandedPath = path.replace('%USERNAME%', process.env.USERNAME || process.env.USER);
      await execAsync(`"${expandedPath}" --version`);
      console.log(`✅ ProtonVPN trouvé: ${expandedPath}`);
      return expandedPath;
    } catch (error) {
      // Continue to next path
    }
  }
  
  return null;
}

async function launchProtonVPN() {
  const protonPath = await findProtonVPNPath();
  if (!protonPath) {
    console.log('❌ ProtonVPN non trouvé !');
    console.log('📥 Installez ProtonVPN depuis: https://protonvpn.com/download');
    return null;
  }
  
  try {
    console.log('🚀 Lancement de ProtonVPN...');
    const child = exec(protonPath);
    
    // Attendre que l'application se lance
    await sleep(5000);
    
    console.log('✅ ProtonVPN lancé');
    return child;
  } catch (error) {
    console.error('❌ Erreur lors du lancement de ProtonVPN:', error.message);
    return null;
  }
}

async function connectToProtonVPN(server = null) {
  console.log('🔌 Connexion automatique à ProtonVPN...');
  
  // Lancer ProtonVPN
  const protonProcess = await launchProtonVPN();
  if (!protonProcess) {
    return false;
  }
  
  // Attendre que l'interface soit prête
  await sleep(3000);
  
  try {
    // Utiliser PowerShell pour automatiser l'interface ProtonVPN sur Windows
    if (process.platform === 'win32') {
      const selectedServer = server || PROTONVPN_CONFIG.servers[Math.floor(Math.random() * PROTONVPN_CONFIG.servers.length)];
      console.log(`🎯 Connexion au serveur: ${selectedServer}`);
      
      // Script PowerShell pour automatiser ProtonVPN
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        Add-Type -AssemblyName System.Drawing
        
        # Attendre que ProtonVPN soit visible
        Start-Sleep -Seconds 3
        
        # Chercher la fenêtre ProtonVPN
        $protonWindow = Get-Process | Where-Object {$_.ProcessName -like "*ProtonVPN*"} | Select-Object -First 1
        
        if ($protonWindow) {
          # Activer la fenêtre ProtonVPN
          $shell = New-Object -ComObject WScript.Shell
          $shell.AppActivate($protonWindow.ProcessName)
          Start-Sleep -Seconds 2
          
          # Simuler la connexion (Ctrl+Shift+C pour connexion rapide)
          [System.Windows.Forms.SendKeys]::SendWait("^+C")
          Start-Sleep -Seconds 5
          
          Write-Host "Connexion ProtonVPN initiée"
        } else {
          Write-Host "Fenêtre ProtonVPN non trouvée"
        }
      `;
      
      await execAsync(`powershell -Command "${psScript}"`);
      
    } else {
      // Sur macOS/Linux, utiliser des commandes système
      console.log('⚠️ Automatisation limitée sur cette plateforme');
      console.log('📋 Veuillez vous connecter manuellement à ProtonVPN');
      
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise((resolve) => {
        rl.question('✅ Une fois connecté à ProtonVPN, appuyez sur Entrée...', () => {
          rl.close();
          resolve(true);
        });
      });
    }
    
    // Attendre que la connexion soit établie
    await sleep(10000);
    
    // Vérifier la nouvelle IP
    const newIP = await getCurrentIP();
    console.log(`🌐 Nouvelle IP: ${newIP || 'Inconnue'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Erreur lors de la connexion ProtonVPN:', error.message);
    return false;
  }
}

async function disconnectProtonVPN() {
  try {
    console.log('🔌 Déconnexion ProtonVPN...');
    
    if (process.platform === 'win32') {
      // Utiliser PowerShell pour déconnecter
      const psScript = `
        Add-Type -AssemblyName System.Windows.Forms
        
        # Chercher la fenêtre ProtonVPN
        $protonWindow = Get-Process | Where-Object {$_.ProcessName -like "*ProtonVPN*"} | Select-Object -First 1
        
        if ($protonWindow) {
          # Activer la fenêtre ProtonVPN
          $shell = New-Object -ComObject WScript.Shell
          $shell.AppActivate($protonWindow.ProcessName)
          Start-Sleep -Seconds 1
          
          # Simuler la déconnexion (Ctrl+Shift+D)
          [System.Windows.Forms.SendKeys]::SendWait("^+D")
          Start-Sleep -Seconds 3
          
          Write-Host "Déconnexion ProtonVPN initiée"
        }
      `;
      
      await execAsync(`powershell -Command "${psScript}"`);
    }
    
    await sleep(5000);
    console.log('✅ ProtonVPN déconnecté');
    
  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion ProtonVPN:', error.message);
  }
}

async function detectBlocking(page) {
  try {
    const blockingIndicators = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      const indicators = [
        'vous avez été bloqué',
        'vous avez été bloquée',
        'accès refusé',
        'accès interdit',
        'blocked',
        'forbidden',
        'trop de requêtes',
        'rate limit',
        'temporarily blocked',
        'suspicious activity',
        'captcha'
      ];
      
      return blockingIndicators.filter(indicator => bodyText.includes(indicator));
    });
    
    return blockingIndicators.length > 0;
  } catch (e) {
    return false;
  }
}

async function changeIPWithProtonVPN() {
  console.log('🔄 Changement d\'IP avec ProtonVPN automatique...');
  
  const oldIP = await getCurrentIP();
  console.log(`🌐 IP actuelle: ${oldIP || 'Inconnue'}`);
  
  // Déconnecter d'abord
  await disconnectProtonVPN();
  await sleep(3000);
  
  // Se reconnecter
  const connected = await connectToProtonVPN();
  
  if (connected) {
    const newIP = await getCurrentIP();
    console.log(`🌐 Nouvelle IP: ${newIP || 'Inconnue'}`);
    
    if (oldIP && newIP && oldIP !== newIP) {
      console.log('✅ IP changée avec succès !');
      return true;
    } else {
      console.log('⚠️ IP non changée ou impossible à vérifier');
      return false;
    }
  } else {
    console.log('❌ Échec de la connexion ProtonVPN');
    return false;
  }
}

async function scrapeWithProtonAuto() {
  console.log('🔧 Démarrage du scraper Leboncoin avec ProtonVPN automatique...\n');
  
  console.log('📋 Informations importantes:');
  console.log('🔄 Le script détectera automatiquement les blocages');
  console.log('🌐 Connexion automatique à ProtonVPN');
  console.log('📝 Le navigateur s\'ouvrira en mode visible\n');
  
  console.log('⚠️ Prérequis :');
  console.log('- ProtonVPN doit être installé sur votre machine');
  console.log('- Vous devez avoir un compte ProtonVPN actif');
  console.log('- L\'application ProtonVPN doit être accessible\n');
  
  let browser = null;
  let page = null;
  let attemptCount = 0;
  const maxAttempts = 5;
  
  try {
    const config = await getConfig();
    
    console.log('📋 Configuration:');
    console.log('- URL:', config.LBC_SEARCH_URL);
    console.log('- Headless: false (pour éviter la détection)');
    console.log('- Max annonces:', config.LBC_MAX);
    console.log('- Pages:', config.LBC_PAGES);
    
    // Récupérer le token Datadome
    const datadomeSetting = await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_DATADOME' }
    });
    const datadomeToken = datadomeSetting?.value || '';
    
    if (datadomeToken) {
      console.log('- Token Datadome: Présent');
    } else {
      console.log('- Token Datadome: Absent');
    }
    
    // Vérifier l'IP initiale
    const initialIP = await getCurrentIP();
    console.log(`🌐 IP initiale: ${initialIP || 'Inconnue'}`);
    
    // 🔌 CONNEXION AUTOMATIQUE À PROTONVPN AU DÉMARRAGE
    console.log('\n🔌 Connexion automatique à ProtonVPN au démarrage...');
    const connected = await connectToProtonVPN();
    
    if (connected) {
      const newIP = await getCurrentIP();
      console.log(`🌐 IP après connexion ProtonVPN: ${newIP || 'Inconnue'}`);
      if (initialIP && newIP && initialIP !== newIP) {
        console.log('✅ Connexion ProtonVPN réussie - IP changée !');
      } else {
        console.log('⚠️ Connexion ProtonVPN effectuée mais IP non vérifiée');
      }
    } else {
      console.log('❌ Échec de la connexion ProtonVPN au démarrage');
      console.log('💡 Le script continuera sans VPN');
    }
    
    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920,1080',
        '--start-maximized'
      ]
    });
    
    page = await browser.newPage();
    
    // Masquer l'automation
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });
    
    // Configuration du user agent aléatoire
    const userAgent = getRandomUserAgent();
    await page.setUserAgent(userAgent);
    console.log('🤖 User Agent:', userAgent);
    
    // Headers réalistes
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Ajouter le cookie Datadome si présent
    if (datadomeToken) {
      await page.setCookie({
        name: 'datadome',
        value: datadomeToken,
        domain: '.leboncoin.fr',
        path: '/'
      });
      console.log('🍪 Cookie Datadome ajouté');
    }
    
    let scrapingSuccessful = false;
    
    while (!scrapingSuccessful && attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`\n🌐 Tentative ${attemptCount}/${maxAttempts}...`);
      
      try {
        console.log('🌐 Navigation vers Leboncoin...');
        await page.goto(config.LBC_SEARCH_URL, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        await sleep(3000);
        
        // Vérifier s'il y a un blocage
        const isBlocked = await detectBlocking(page);
        
        if (isBlocked) {
          console.log('🚨 Blocage détecté !');
          
          if (attemptCount < maxAttempts) {
            const ipChanged = await changeIPWithProtonVPN();
            
            if (ipChanged) {
              console.log(`✅ IP changée (${attemptCount}/${maxAttempts})`);
              
              // Recharger la page avec la nouvelle IP
              await page.reload({ waitUntil: 'networkidle2' });
              await sleep(3000);
              continue;
            } else {
              console.log('❌ Échec du changement d\'IP');
              console.log('💡 Vérifiez que ProtonVPN est bien configuré');
              break;
            }
          } else {
            console.log('⚠️ Nombre maximum de tentatives atteint');
            break;
          }
        } else {
          console.log('✅ Aucun blocage détecté, continuation...');
        }
        
        // Simuler un comportement humain
        console.log('🤖 Simulation d\'un comportement humain...');
        
        // Scroll progressif
        for (let i = 0; i < 5; i++) {
          await page.evaluate(() => {
            window.scrollBy(0, Math.random() * 300 + 200);
          });
          await sleep(Math.random() * 1000 + 500);
        }
        
        // Cliquer sur les cookies si présent
        try {
          await page.click('#didomi-notice-agree-button', { timeout: 3000 });
          console.log('✅ Cookies acceptés');
        } catch {}
        
        // Récupérer les annonces
        console.log('🔍 Recherche des annonces...');
        
        let articles = [];
        try {
          articles = await page.$$eval('article[data-qa-id="aditem_container"], article[data-test-id="ad"], article', elements => {
            return elements.slice(0, 10).map(article => {
              const link = article.querySelector('a[href^="/ad/"]');
              const title = article.querySelector('[data-qa-id="aditem_title"], h3, h2, [class*="title"]');
              const price = article.querySelector('[data-qa-id="aditem_price"], [data-test-id="price"], [class*="price"]');
              const location = article.querySelector('[data-qa-id="aditem_location"], [data-test-id="location"], [class*="location"]');
              
              return {
                url: link?.href || null,
                title: title?.textContent?.trim() || null,
                price: price?.textContent?.trim() || null,
                location: location?.textContent?.trim() || null
              };
            });
          });
        } catch (e) {
          console.log('⚠️ Erreur lors de la récupération des annonces:', e.message);
          articles = [];
        }
        
        console.log(`\n📊 Résultats: ${articles.length} annonces trouvées`);
        
        if (articles.length > 0) {
          console.log('\n📋 Échantillon des annonces:');
          articles.slice(0, 5).forEach((article, index) => {
            console.log(`${index + 1}. ${article.price || 'Prix N/A'} | ${article.location || 'Lieu N/A'} | ${article.title || 'Titre N/A'}`);
          });
          
          // Récupérer le nouveau token Datadome
          const cookies = await page.cookies();
          const newDatadomeCookie = cookies.find(cookie => cookie.name === 'datadome');
          
          if (newDatadomeCookie && newDatadomeCookie.value !== datadomeToken) {
            console.log('\n🔄 Nouveau token Datadome détecté, mise à jour...');
            await prisma.scraperSetting.upsert({
              where: { key: 'LBC_DATADOME' },
              update: { value: newDatadomeCookie.value },
              create: { key: 'LBC_DATADOME', value: newDatadomeCookie.value }
            });
            console.log('✅ Token Datadome mis à jour dans la base de données');
          }
          
          console.log('\n✅ Le scraping fonctionne !');
          scrapingSuccessful = true;
        } else {
          console.log('\n❌ Aucune annonce trouvée. Nouvelle tentative...');
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la tentative:', error.message);
      }
    }
    
    if (!scrapingSuccessful) {
      console.log('\n❌ Impossible de contourner le blocage après plusieurs tentatives');
      console.log('💡 Suggestions:');
      console.log('1. Vérifiez que ProtonVPN est bien configuré');
      console.log('2. Essayez un autre serveur ProtonVPN');
      console.log('3. Attendez quelques heures');
      console.log('4. Contactez Leboncoin');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-proton-auto-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-proton-auto-result.png');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    
    // Déconnecter ProtonVPN
    await disconnectProtonVPN();
    
    if (browser) {
      console.log('\n🔒 Fermeture du navigateur dans 10 secondes...');
      setTimeout(async () => {
        await browser.close();
        process.exit(0);
      }, 10000);
    }
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt demandé...');
  await disconnectProtonVPN();
  process.exit(0);
});

scrapeWithProtonAuto();
