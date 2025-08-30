// Scraper Leboncoin avec gestion du blocage IP
// Utilise des techniques pour contourner les blocages

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration par défaut
const DEFAULT_CONFIG = {
  LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
  LBC_BROWSER_HEADLESS: 'false', // Mode visible par défaut pour éviter la détection
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

// User agents alternatifs pour éviter la détection
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
        'suspicious activity'
      ];
      
      return indicators.filter(indicator => bodyText.includes(indicator));
    });
    
    return blockingIndicators.length > 0;
  } catch (e) {
    return false;
  }
}

async function waitForUserUnblock(page) {
  console.log('\n🚨 Blocage détecté !');
  console.log('🔄 Solutions possibles :');
  console.log('1. Changez votre adresse IP (VPN, proxy, redémarrage routeur)');
  console.log('2. Attendez quelques heures que le blocage expire');
  console.log('3. Utilisez un autre navigateur ou mode navigation privée');
  console.log('4. Contactez Leboncoin pour débloquer votre IP');
  console.log('\n📝 Une fois débloqué, appuyez sur Entrée pour continuer...');
  
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      console.log('✅ Continuation après déblocage...');
      resolve();
    });
  });
  
  await sleep(3000);
}

async function scrapeWithBlockingHandling() {
  console.log('🔧 Démarrage du scraper Leboncoin avec gestion du blocage...\n');
  
  console.log('📋 Informations importantes:');
  console.log('⚠️  Si vous êtes bloqué, le script vous guidera pour débloquer');
  console.log('🔄  Utilisez un VPN ou changez d\'IP si nécessaire');
  console.log('📝  Le navigateur s\'ouvrira en mode visible pour éviter la détection\n');
  
  let browser = null;
  let page = null;
  
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
    
    // Lancer le navigateur en mode visible pour éviter la détection
    browser = await puppeteer.launch({
      headless: false, // Mode visible pour éviter la détection
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled', // Masquer l'automation
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
    
    // Ajouter des headers pour paraître plus humain
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
    
    console.log('\n🌐 Navigation vers Leboncoin...');
    await page.goto(config.LBC_SEARCH_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await sleep(3000);
    
    // Vérifier s'il y a un blocage
    const isBlocked = await detectBlocking(page);
    
    if (isBlocked) {
      console.log('🚨 Blocage détecté !');
      await waitForUserUnblock(page);
      
      // Recharger la page après déblocage
      await page.reload({ waitUntil: 'networkidle2' });
      await sleep(3000);
      
      // Vérifier à nouveau
      const stillBlocked = await detectBlocking(page);
      if (stillBlocked) {
        console.log('⚠️ Blocage toujours présent, nouvelle tentative...');
        await waitForUserUnblock(page);
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
    } else {
      console.log('\n❌ Aucune annonce trouvée. Vérifiez que la page est bien chargée.');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-vpn-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-vpn-result.png');
    
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

scrapeWithBlockingHandling();
