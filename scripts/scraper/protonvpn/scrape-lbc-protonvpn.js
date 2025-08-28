// Scraper Leboncoin avec intégration ProtonVPN
// Change automatiquement d'IP quand un blocage est détecté

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

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
  // Chemins possibles pour ProtonVPN CLI
  cliPaths: [
    'protonvpn-cli',
    'protonvpn',
    'C:\\Program Files\\ProtonVPN\\protonvpn-cli.exe',
    'C:\\Program Files (x86)\\ProtonVPN\\protonvpn-cli.exe'
  ],
  // Serveurs recommandés pour la France
  recommendedServers: [
    'FR#1', 'FR#2', 'FR#3', 'FR#4', 'FR#5',
    'NL#1', 'NL#2', 'NL#3', // Pays-Bas (proche)
    'DE#1', 'DE#2', 'DE#3'  // Allemagne (proche)
  ]
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

async function findProtonVPNCLI() {
  for (const path of PROTONVPN_CONFIG.cliPaths) {
    try {
      await execAsync(`${path} --version`);
      console.log(`✅ ProtonVPN CLI trouvé: ${path}`);
      return path;
    } catch (error) {
      // Continue to next path
    }
  }
  return null;
}

async function checkProtonVPNStatus(cliPath) {
  try {
    const { stdout } = await execAsync(`${cliPath} status`);
    return stdout.includes('Connected');
  } catch (error) {
    return false;
  }
}

async function connectProtonVPN(cliPath, server = null) {
  try {
    console.log('🔌 Connexion ProtonVPN...');
    
    let command;
    if (server) {
      command = `${cliPath} connect --server ${server}`;
    } else {
      // Connexion automatique au serveur le plus rapide
      command = `${cliPath} connect --fastest`;
    }
    
    const { stdout } = await execAsync(command);
    console.log('✅ ProtonVPN connecté');
    console.log('📊 Sortie:', stdout);
    
    // Attendre que la connexion soit stable
    await sleep(5000);
    
    // Vérifier la nouvelle IP
    const { stdout: ipOutput } = await execAsync('curl -s https://api.ipify.org');
    console.log('🌐 Nouvelle IP:', ipOutput.trim());
    
    return true;
  } catch (error) {
    console.error('❌ Erreur connexion ProtonVPN:', error.message);
    return false;
  }
}

async function disconnectProtonVPN(cliPath) {
  try {
    console.log('🔌 Déconnexion ProtonVPN...');
    await execAsync(`${cliPath} disconnect`);
    console.log('✅ ProtonVPN déconnecté');
    await sleep(3000);
  } catch (error) {
    console.error('❌ Erreur déconnexion ProtonVPN:', error.message);
  }
}

async function changeIPWithProtonVPN(cliPath) {
  console.log('🔄 Changement d\'IP avec ProtonVPN...');
  
  // Déconnecter d'abord
  await disconnectProtonVPN(cliPath);
  await sleep(2000);
  
  // Choisir un serveur aléatoire
  const randomServer = PROTONVPN_CONFIG.recommendedServers[
    Math.floor(Math.random() * PROTONVPN_CONFIG.recommendedServers.length)
  ];
  
  console.log(`🎯 Connexion au serveur: ${randomServer}`);
  
  // Se reconnecter
  const success = await connectProtonVPN(cliPath, randomServer);
  
  if (success) {
    console.log('✅ IP changée avec succès');
    return true;
  } else {
    console.log('❌ Échec du changement d\'IP');
    return false;
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
      
      return indicators.filter(indicator => bodyText.includes(indicator));
    });
    
    return blockingIndicators.length > 0;
  } catch (e) {
    return false;
  }
}

async function scrapeWithProtonVPN() {
  console.log('🔧 Démarrage du scraper Leboncoin avec ProtonVPN...\n');
  
  // Vérifier si ProtonVPN CLI est installé
  const cliPath = await findProtonVPNCLI();
  if (!cliPath) {
    console.log('❌ ProtonVPN CLI non trouvé !');
    console.log('📥 Installez ProtonVPN CLI :');
    console.log('   https://protonvpn.com/support/command-line-tool/');
    console.log('   ou utilisez : pip install protonvpn-cli');
    return;
  }
  
  console.log('📋 Informations importantes:');
  console.log('🔄 Le script changera automatiquement d\'IP si un blocage est détecté');
  console.log('🌐 Utilisez ProtonVPN pour contourner les blocages');
  console.log('📝 Le navigateur s\'ouvrira en mode visible si nécessaire\n');
  
  let browser = null;
  let page = null;
  let ipChangeCount = 0;
  const maxIPChanges = 5;
  
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
    
    // Se connecter à ProtonVPN
    console.log('\n🔌 Connexion initiale à ProtonVPN...');
    const vpnConnected = await connectProtonVPN(cliPath);
    
    if (!vpnConnected) {
      console.log('⚠️ Impossible de se connecter à ProtonVPN, continuation sans VPN...');
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
    
    while (!scrapingSuccessful && ipChangeCount < maxIPChanges) {
      console.log(`\n🌐 Tentative ${ipChangeCount + 1}/${maxIPChanges}...`);
      
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
          
          if (ipChangeCount < maxIPChanges - 1) {
            console.log('🔄 Changement d\'IP avec ProtonVPN...');
            const ipChanged = await changeIPWithProtonVPN(cliPath);
            
            if (ipChanged) {
              ipChangeCount++;
              console.log(`✅ IP changée (${ipChangeCount}/${maxIPChanges})`);
              
              // Recharger la page avec la nouvelle IP
              await page.reload({ waitUntil: 'networkidle2' });
              await sleep(3000);
              continue;
            } else {
              console.log('❌ Échec du changement d\'IP');
              break;
            }
          } else {
            console.log('⚠️ Nombre maximum de changements d\'IP atteint');
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
          ipChangeCount++;
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la tentative:', error.message);
        ipChangeCount++;
      }
    }
    
    if (!scrapingSuccessful) {
      console.log('\n❌ Impossible de contourner le blocage après plusieurs tentatives');
      console.log('💡 Suggestions:');
      console.log('1. Attendez quelques heures');
      console.log('2. Utilisez un autre VPN');
      console.log('3. Contactez Leboncoin');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-protonvpn-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-protonvpn-result.png');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    
    // Déconnecter ProtonVPN
    if (cliPath) {
      await disconnectProtonVPN(cliPath);
    }
    
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
  process.exit(0);
});

scrapeWithProtonVPN();
