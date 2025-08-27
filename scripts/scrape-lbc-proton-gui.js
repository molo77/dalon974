// Scraper Leboncoin avec ProtonVPN GUI
// Utilise l'interface graphique de ProtonVPN pour contourner les blocages

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
      
      return blockingIndicators.filter(indicator => bodyText.includes(indicator));
    });
    
    return blockingIndicators.length > 0;
  } catch (e) {
    return false;
  }
}

async function promptUserForProtonVPN() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n🔄 Changement d\'IP avec ProtonVPN GUI');
    console.log('📋 Instructions :');
    console.log('1. Ouvrez l\'application ProtonVPN');
    console.log('2. Déconnectez-vous si vous êtes connecté');
    console.log('3. Connectez-vous à un serveur français (FR) ou européen (NL, DE)');
    console.log('4. Vérifiez que l\'IP a changé sur https://whatismyipaddress.com/');
    console.log('5. Une fois connecté, appuyez sur Entrée pour continuer');
    
    rl.question('\n✅ Une fois ProtonVPN connecté, appuyez sur Entrée pour continuer...', () => {
      rl.close();
      resolve(true);
    });
  });
}

async function changeIPWithProtonVPN() {
  console.log('🔄 Changement d\'IP avec ProtonVPN GUI...');
  
  const oldIP = await getCurrentIP();
  console.log(`🌐 IP actuelle: ${oldIP || 'Inconnue'}`);
  
  await promptUserForProtonVPN();
  
  // Attendre que la connexion soit stable
  await sleep(5000);
  
  const newIP = await getCurrentIP();
  console.log(`🌐 Nouvelle IP: ${newIP || 'Inconnue'}`);
  
  if (oldIP && newIP && oldIP !== newIP) {
    console.log('✅ IP changée avec succès !');
    return true;
  } else {
    console.log('⚠️ IP non changée ou impossible à vérifier');
    console.log('💡 Vérifiez que ProtonVPN est bien connecté');
    return false;
  }
}

async function scrapeWithProtonVPN() {
  console.log('🔧 Démarrage du scraper Leboncoin avec ProtonVPN GUI...\n');
  
  console.log('📋 Informations importantes:');
  console.log('🔄 Le script détectera automatiquement les blocages');
  console.log('🌐 Utilisez ProtonVPN GUI pour changer d\'IP');
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
              console.log('💡 Vérifiez que ProtonVPN est bien connecté');
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
      console.log('1. Vérifiez que ProtonVPN est bien connecté');
      console.log('2. Essayez un autre serveur ProtonVPN');
      console.log('3. Attendez quelques heures');
      console.log('4. Contactez Leboncoin');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-proton-gui-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-proton-gui-result.png');
    
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

scrapeWithProtonVPN();
