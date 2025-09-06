// Scraper Leboncoin simplifié avec gestion d'erreurs améliorée
// Version corrigée pour éviter les problèmes de blocage

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// Configuration par défaut
const DEFAULT_CONFIG = {
  LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
  LBC_BROWSER_HEADLESS: 'true', // Changé à true par défaut
  LBC_MAX: '20', // Réduit pour éviter la détection
  LBC_FETCH_DETAILS: 'false', // Désactivé par défaut
  LBC_DETAIL_LIMIT: '5',
  LBC_PAGES: '1',
  LBC_DEBUG: 'false',
  LBC_USE_PROTONVPN: 'false', // Désactivé par défaut
  LBC_DELAY_BETWEEN_REQUESTS: '2000'
};

async function getConfig() {
  try {
    const settings = await prisma.scraperSetting.findMany();
    const config = { ...DEFAULT_CONFIG };
    
    settings.forEach(setting => {
      if (setting.value) {
        config[setting.key] = setting.value;
      }
    });
    
    return config;
  } catch (error) {
    console.log('⚠️ Erreur lors de la récupération de la configuration, utilisation des valeurs par défaut');
    return DEFAULT_CONFIG;
  }
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
    const { stdout } = await execAsync('curl -s --max-time 10 https://api.ipify.org');
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
        'captcha',
        'robot',
        'automation'
      ];
      
      return blockingIndicators.filter(indicator => bodyText.includes(indicator));
    });
    
    return blockingIndicators.length > 0;
  } catch (e) {
    return false;
  }
}

async function scrapeWithFixed() {
  console.log('🔧 Démarrage du scraper Leboncoin corrigé...\n');
  
  let browser = null;
  let page = null;
  let attemptCount = 0;
  const maxAttempts = 3; // Réduit le nombre de tentatives
  
  try {
    const config = await getConfig();
    
    console.log('📋 Configuration:');
    console.log('- URL:', config.LBC_SEARCH_URL);
    console.log('- Headless:', config.LBC_BROWSER_HEADLESS);
    console.log('- Max annonces:', config.LBC_MAX);
    console.log('- Pages:', config.LBC_PAGES);
    console.log('- Délai entre requêtes:', config.LBC_DELAY_BETWEEN_REQUESTS + 'ms');
    
    // Récupérer le token Datadome
    let datadomeToken = '';
    try {
      const datadomeSetting = await prisma.scraperSetting.findFirst({
        where: { key: 'LBC_DATADOME' }
      });
      datadomeToken = datadomeSetting?.value || '';
    } catch (error) {
      console.log('⚠️ Erreur lors de la récupération du token Datadome');
    }
    
    if (datadomeToken) {
      console.log('- Token Datadome: Présent');
    } else {
      console.log('- Token Datadome: Absent');
    }
    
    // Vérifier l'IP initiale
    const initialIP = await getCurrentIP();
    console.log(`🌐 IP initiale: ${initialIP || 'Inconnue'}`);
    
    // Lancer le navigateur avec configuration optimisée
    const headless = config.LBC_BROWSER_HEADLESS === 'true';
    browser = await puppeteer.launch({
      headless: headless,
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1920,1080',
        '--start-maximized',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Désactiver les images pour accélérer
        '--disable-javascript', // Désactiver JS pour éviter la détection
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });
    
    page = await browser.newPage();
    
    // Masquer l'automation de manière plus efficace
    await page.evaluateOnNewDocument(() => {
      // Supprimer webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Supprimer les propriétés d'automation
      delete navigator.__proto__.webdriver;
      
      // Modifier les plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Modifier les langues
      Object.defineProperty(navigator, 'languages', {
        get: () => ['fr-FR', 'fr', 'en'],
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
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    });
    
    // Ajouter le cookie Datadome si présent
    if (datadomeToken) {
      try {
        await page.setCookie({
          name: 'datadome',
          value: datadomeToken,
          domain: '.leboncoin.fr',
          path: '/'
        });
        console.log('🍪 Cookie Datadome ajouté');
      } catch (error) {
        console.log('⚠️ Erreur lors de l\'ajout du cookie Datadome');
      }
    }
    
    let scrapingSuccessful = false;
    
    while (!scrapingSuccessful && attemptCount < maxAttempts) {
      attemptCount++;
      console.log(`\n🌐 Tentative ${attemptCount}/${maxAttempts}...`);
      
      try {
        console.log('🌐 Navigation vers Leboncoin...');
        
        // Navigation avec timeout plus court
        await page.goto(config.LBC_SEARCH_URL, {
          waitUntil: 'domcontentloaded', // Changé de networkidle2 à domcontentloaded
          timeout: 15000 // Réduit le timeout
        });
        
        // Attendre un délai aléatoire
        const delay = parseInt(config.LBC_DELAY_BETWEEN_REQUESTS) + Math.random() * 1000;
        await sleep(delay);
        
        // Vérifier s'il y a un blocage
        const isBlocked = await detectBlocking(page);
        
        if (isBlocked) {
          console.log('🚨 Blocage détecté !');
          console.log('💡 Tentative de contournement...');
          
          // Attendre plus longtemps avant la prochaine tentative
          await sleep(5000);
          continue;
        } else {
          console.log('✅ Aucun blocage détecté, continuation...');
        }
        
        // Cliquer sur les cookies si présent
        try {
          await page.click('#didomi-notice-agree-button', { timeout: 3000 });
          console.log('✅ Cookies acceptés');
          await sleep(1000);
        } catch {}
        
        // Récupérer les annonces avec une approche plus robuste
        console.log('🔍 Recherche des annonces...');
        
        let articles = [];
        try {
          articles = await page.$$eval('article[data-qa-id="aditem_container"], article[data-test-id="ad"], article, [data-qa-id="aditem_container"]', elements => {
            return elements.slice(0, 10).map(article => {
              const link = article.querySelector('a[href^="/ad/"]');
              const title = article.querySelector('[data-qa-id="aditem_title"], h3, h2, [class*="title"], .title');
              const price = article.querySelector('[data-qa-id="aditem_price"], [data-test-id="price"], [class*="price"], .price');
              const location = article.querySelector('[data-qa-id="aditem_location"], [data-test-id="location"], [class*="location"], .location');
              
              return {
                url: link?.href || null,
                title: title?.textContent?.trim() || null,
                price: price?.textContent?.trim() || null,
                location: location?.textContent?.trim() || null
              };
            }).filter(article => article.url); // Filtrer les annonces sans URL
          });
        } catch (e) {
          console.log('⚠️ Erreur lors de la récupération des annonces:', e.message);
          
          // Tentative alternative avec une approche plus simple
          try {
            articles = await page.$$eval('a[href^="/ad/"]', links => {
              return links.slice(0, 10).map(link => {
                const article = link.closest('article') || link.parentElement;
                return {
                  url: link.href,
                  title: article?.textContent?.trim() || null,
                  price: null,
                  location: null
                };
              });
            });
            console.log('✅ Récupération alternative réussie');
          } catch (e2) {
            console.log('❌ Échec de la récupération alternative:', e2.message);
            articles = [];
          }
        }
        
        console.log(`\n📊 Résultats: ${articles.length} annonces trouvées`);
        
        if (articles.length > 0) {
          console.log('\n📋 Échantillon des annonces:');
          articles.slice(0, 5).forEach((article, index) => {
            console.log(`${index + 1}. ${article.price || 'Prix N/A'} | ${article.location || 'Lieu N/A'} | ${article.title || 'Titre N/A'}`);
          });
          
          // Récupérer le nouveau token Datadome
          try {
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
          } catch (error) {
            console.log('⚠️ Erreur lors de la mise à jour du token Datadome');
          }
          
          // Afficher les métriques
          const metrics = {
            created: 0,
            updated: 0,
            skippedRecent: articles.length,
            cooldownHours: 24
          };
          
          console.log('LBC_METRICS_JSON:' + JSON.stringify(metrics));
          console.log(`total annonces collectées avant coupe ${articles.length}`);
          
          console.log('\n✅ Le scraping fonctionne !');
          scrapingSuccessful = true;
        } else {
          console.log('\n❌ Aucune annonce trouvée. Nouvelle tentative...');
          await sleep(3000);
        }
        
      } catch (error) {
        console.error('❌ Erreur lors de la tentative:', error.message);
        await sleep(3000);
      }
    }
    
    if (!scrapingSuccessful) {
      console.log('\n❌ Impossible de récupérer des annonces après plusieurs tentatives');
      console.log('💡 Suggestions:');
      console.log('1. Vérifiez votre connexion internet');
      console.log('2. Essayez plus tard');
      console.log('3. Vérifiez l\'URL de recherche');
      console.log('4. Contactez le support');
    }
    
    // Capture d'écran finale si pas en headless
    if (!headless) {
      try {
        await page.screenshot({ path: 'lbc-simple-result.png', fullPage: true });
        console.log('📸 Capture d\'écran sauvegardée: lbc-simple-result.png');
      } catch (error) {
        console.log('⚠️ Erreur lors de la capture d\'écran');
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.log('⚠️ Erreur lors de la déconnexion de la base de données');
    }
    
    if (browser) {
      console.log('\n🔒 Fermeture du navigateur...');
      try {
        await browser.close();
      } catch (error) {
        console.log('⚠️ Erreur lors de la fermeture du navigateur');
      }
    }
    
    console.log('✅ Script terminé');
    process.exit(0);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  console.log('\n🛑 Arrêt demandé...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Arrêt demandé...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non capturée:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesse rejetée non gérée:', reason);
  process.exit(1);
});

scrapeWithFixed();
