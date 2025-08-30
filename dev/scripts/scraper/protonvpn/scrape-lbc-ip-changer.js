// Scraper Leboncoin avec changement d'IP automatique
// Utilise plusieurs méthodes pour contourner les blocages

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

// Méthodes de changement d'IP
const IP_CHANGE_METHODS = {
  ROUTER_RESTART: 'router_restart',
  VPN_MANUAL: 'vpn_manual',
  PROXY_ROTATION: 'proxy_rotation',
  WAIT_AND_RETRY: 'wait_and_retry'
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

async function promptUserForIPChange(method) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log(`\n🔄 Méthode de changement d'IP: ${method}`);
    
    switch (method) {
      case IP_CHANGE_METHODS.ROUTER_RESTART:
        console.log('📋 Instructions pour redémarrer le routeur:');
        console.log('1. Débranchez l\'alimentation du routeur');
        console.log('2. Attendez 30 secondes');
        console.log('3. Rebranchez l\'alimentation');
        console.log('4. Attendez que la connexion soit rétablie');
        break;
        
      case IP_CHANGE_METHODS.VPN_MANUAL:
        console.log('📋 Instructions pour VPN manuel:');
        console.log('1. Ouvrez votre client VPN (ProtonVPN, NordVPN, etc.)');
        console.log('2. Connectez-vous à un serveur français ou européen');
        console.log('3. Vérifiez que l\'IP a changé');
        break;
        
      case IP_CHANGE_METHODS.PROXY_ROTATION:
        console.log('📋 Instructions pour proxy:');
        console.log('1. Configurez un proxy français');
        console.log('2. Ou utilisez un service de rotation de proxy');
        break;
        
      case IP_CHANGE_METHODS.WAIT_AND_RETRY:
        console.log('📋 Attente automatique...');
        break;
    }
    
    if (method === IP_CHANGE_METHODS.WAIT_AND_RETRY) {
      console.log('⏰ Attente de 5 minutes avant nouvelle tentative...');
      setTimeout(() => {
        rl.close();
        resolve(true);
      }, 300000); // 5 minutes
    } else {
      rl.question('\n✅ Une fois le changement d\'IP effectué, appuyez sur Entrée pour continuer...', () => {
        rl.close();
        resolve(true);
      });
    }
  });
}

async function changeIP(method) {
  console.log(`🔄 Changement d'IP avec la méthode: ${method}`);
  
  const oldIP = await getCurrentIP();
  console.log(`🌐 IP actuelle: ${oldIP || 'Inconnue'}`);
  
  await promptUserForIPChange(method);
  
  // Attendre un peu après le changement
  await sleep(5000);
  
  const newIP = await getCurrentIP();
  console.log(`🌐 Nouvelle IP: ${newIP || 'Inconnue'}`);
  
  if (oldIP && newIP && oldIP !== newIP) {
    console.log('✅ IP changée avec succès !');
    return true;
  } else {
    console.log('⚠️ IP non changée ou impossible à vérifier');
    return false;
  }
}

async function scrapeWithIPChanger() {
  console.log('🔧 Démarrage du scraper Leboncoin avec changement d\'IP automatique...\n');
  
  console.log('📋 Informations importantes:');
  console.log('🔄 Le script détectera automatiquement les blocages');
  console.log('🌐 Plusieurs méthodes de changement d\'IP seront proposées');
  console.log('📝 Le navigateur s\'ouvrira en mode visible\n');
  
  let browser = null;
  let page = null;
  let attemptCount = 0;
  const maxAttempts = 5;
  const ipChangeMethods = Object.values(IP_CHANGE_METHODS);
  
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
            // Choisir la méthode de changement d'IP
            const methodIndex = (attemptCount - 1) % ipChangeMethods.length;
            const method = ipChangeMethods[methodIndex];
            
            const ipChanged = await changeIP(method);
            
            if (ipChanged) {
              console.log(`✅ IP changée (${attemptCount}/${maxAttempts})`);
              
              // Recharger la page avec la nouvelle IP
              await page.reload({ waitUntil: 'networkidle2' });
              await sleep(3000);
              continue;
            } else {
              console.log('❌ Échec du changement d\'IP');
              // Continuer quand même pour voir si ça fonctionne
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
      console.log('1. Attendez quelques heures');
      console.log('2. Utilisez un autre VPN');
      console.log('3. Contactez Leboncoin');
      console.log('4. Essayez depuis un autre réseau');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-ip-changer-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-ip-changer-result.png');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    
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

scrapeWithIPChanger();
