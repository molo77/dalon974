// Scraper Leboncoin avec détection automatique de CAPTCHA
// Si un CAPTCHA est détecté, ouvre le navigateur en mode visible pour résolution manuelle

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration par défaut
const DEFAULT_CONFIG = {
  LBC_SEARCH_URL: 'https://www.leboncoin.fr/recherche?category=11&locations=r_26',
  LBC_BROWSER_HEADLESS: 'true',
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

async function refreshDatadomeToken() {
  console.log('🔄 Actualisation du token Datadome...');
  
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Essayer d'abord la page d'accueil
    await page.goto('https://www.leboncoin.fr/', {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    await sleep(2000);
    
    let cookies = await page.cookies();
    let token = cookies.find(cookie => cookie.name === 'datadome')?.value;

    if (!token) {
      console.log('📄 Token non trouvé sur la page d\'accueil, essai sur la page de recherche...');
      await page.goto('https://www.leboncoin.fr/recherche?category=11&locations=r_26', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      await sleep(2000);
      
      const cookiesAfter = await page.cookies();
      token = cookiesAfter.find(cookie => cookie.name === 'datadome')?.value;
    }
    
    if (token) {
      // Sauvegarder le nouveau token
      await prisma.scraperSetting.upsert({
        where: { key: 'LBC_DATADOME' },
        update: { value: token },
        create: { key: 'LBC_DATADOME', value: token }
      });
      console.log('✅ Token Datadome actualisé et sauvegardé');
      return token;
    } else {
      console.log('⚠️ Aucun token Datadome trouvé lors de l\'actualisation');
      return null;
    }

  } catch (error) {
    console.error('❌ Erreur lors de l\'actualisation du token:', error.message);
    return null;
  } finally {
    if (browser) await browser.close();
  }
}

async function detectCaptcha(page) {
  try {
    const captchaIndicators = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      const indicators = [
        'captcha',
        'robot',
        'bot',
        'protection',
        'vérification',
        'sécurité',
        'accès refusé',
        'accès interdit',
        'blocked',
        'forbidden'
      ];
      
      return indicators.filter(indicator => bodyText.includes(indicator));
    });
    
    // Vérifier aussi s'il y a des éléments de CAPTCHA visibles
    const captchaElements = await page.$$eval('iframe[src*="captcha"], .captcha, [class*="captcha"], [id*="captcha"]', elements => elements.length);
    
    return captchaIndicators.length > 0 || captchaElements > 0;
  } catch (e) {
    return false;
  }
}

async function waitForUserResolution(page) {
  console.log('\n⚠️ CAPTCHA détecté !');
  console.log('🔄 Ouverture du navigateur en mode visible...');
  console.log('📝 Résolvez le CAPTCHA manuellement, puis appuyez sur Entrée dans ce terminal...');
  
  // Attendre l'entrée utilisateur
  await new Promise(resolve => {
    process.stdin.once('data', () => {
      console.log('✅ CAPTCHA résolu, continuation du scraping...');
      resolve();
    });
  });
  
  // Attendre un peu pour que la page se charge
  await sleep(3000);
}

async function scrapeWithCaptchaHandling() {
  console.log('🔧 Démarrage du scraper Leboncoin avec gestion automatique du CAPTCHA...\n');
  
  // Actualiser le token Datadome avant de commencer
  const freshToken = await refreshDatadomeToken();
  
  console.log('\n📋 Informations importantes:');
  console.log('⚠️  Leboncoin peut afficher un CAPTCHA pour vérifier que vous n\'êtes pas un robot');
  console.log('🔄  Si un CAPTCHA apparaît, le navigateur s\'ouvrira automatiquement en mode visible');
  console.log('📝  Vous devrez alors résoudre le CAPTCHA manuellement et appuyer sur Entrée');
  console.log('✅  Une fois résolu, le scraping continuera automatiquement\n');
  
  let browser = null;
  let page = null;
  
  try {
    const config = await getConfig();
    
    console.log('📋 Configuration:');
    console.log('- URL:', config.LBC_SEARCH_URL);
    console.log('- Headless:', config.LBC_BROWSER_HEADLESS);
    console.log('- Max annonces:', config.LBC_MAX);
    console.log('- Pages:', config.LBC_PAGES);
    
    // Utiliser le token fraîchement récupéré ou celui de la DB
    const datadomeToken = freshToken || (await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_DATADOME' }
    }))?.value || '';
    
    if (datadomeToken) {
      console.log('- Token Datadome: Présent (actualisé)');
    } else {
      console.log('- Token Datadome: Absent');
    }
    
    // Lancer le navigateur
    const isHeadless = config.LBC_BROWSER_HEADLESS === 'true';
    browser = await puppeteer.launch({
      headless: isHeadless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    
    page = await browser.newPage();
    
    // Configuration du user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
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
    
    // Attendre un peu
    await sleep(3000);
    
    // Vérifier s'il y a un CAPTCHA
    const hasCaptcha = await detectCaptcha(page);
    
    if (hasCaptcha) {
      console.log('🚨 CAPTCHA détecté !');
      
      // Si on est en mode headless, relancer en mode visible
      if (isHeadless) {
        console.log('🔄 Relancement en mode visible pour résolution du CAPTCHA...');
        await browser.close();
        
        browser = await puppeteer.launch({
          headless: false,
          defaultViewport: null,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--window-size=1920,1080'
          ]
        });
        
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        if (datadomeToken) {
          await page.setCookie({
            name: 'datadome',
            value: datadomeToken,
            domain: '.leboncoin.fr',
            path: '/'
          });
        }
        
        await page.goto(config.LBC_SEARCH_URL, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });
        
        await sleep(3000);
      }
      
      // Attendre la résolution manuelle du CAPTCHA
      await waitForUserResolution(page);
      
      // Vérifier à nouveau s'il y a encore un CAPTCHA
      const stillHasCaptcha = await detectCaptcha(page);
      if (stillHasCaptcha) {
        console.log('⚠️ CAPTCHA toujours présent, nouvelle tentative...');
        await waitForUserResolution(page);
      }
    } else {
      console.log('✅ Aucun CAPTCHA détecté, continuation du scraping...');
    }
    
    // Maintenant essayer de récupérer les annonces
    console.log('🔍 Recherche des annonces...');
    
    // Vérifier que la page est toujours valide
    try {
      await page.waitForTimeout(1000);
    } catch (e) {
      console.log('⚠️ Page fermée, tentative de rechargement...');
      await page.goto(config.LBC_SEARCH_URL, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      await sleep(3000);
    }
    
    // Scroll pour charger le contenu lazy
    for (let i = 0; i < 3; i++) {
      try {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.8));
        await sleep(1000);
      } catch (e) {
        console.log('⚠️ Erreur lors du scroll, continuation...');
        break;
      }
    }
    
    // Essayer de cliquer sur le bouton de cookies si présent
    try {
      await page.click('#didomi-notice-agree-button', { timeout: 3000 });
      console.log('✅ Cookies acceptés');
    } catch {}
    
    // Récupérer les annonces
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
      
      // Récupérer le nouveau token Datadome si disponible
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
      
      console.log('\n✅ Le scraping fonctionne ! Vous pouvez maintenant utiliser le scraper automatique.');
    } else {
      console.log('\n❌ Aucune annonce trouvée. Vérifiez que la page est bien chargée.');
    }
    
    // Capture d'écran finale
    await page.screenshot({ path: 'lbc-auto-captcha-result.png', fullPage: true });
    console.log('📸 Capture d\'écran sauvegardée: lbc-auto-captcha-result.png');
    
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

scrapeWithCaptchaHandling();
