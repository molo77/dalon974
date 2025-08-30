// Diagnostic complet de Leboncoin
// Analyse pourquoi aucune annonce n'est trouvée

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function diagnosticLbc() {
  console.log('🔍 Diagnostic complet de Leboncoin...\n');
  
  let browser = null;
  
  try {
    // Récupérer la configuration
    const settings = await prisma.scraperSetting.findMany();
    const config = {};
    settings.forEach(s => config[s.key] = s.value);
    
    const searchUrl = config.LBC_SEARCH_URL || 'https://www.leboncoin.fr/recherche?category=11&locations=r_26';
    const datadomeToken = config.LBC_DATADOME || '';
    
    console.log('📋 Configuration:');
    console.log('- URL:', searchUrl);
    console.log('- Token Datadome:', datadomeToken ? 'Présent' : 'Absent');
    
    // Lancer le navigateur
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
    
    const page = await browser.newPage();
    
    // Configuration réaliste
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
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
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await sleep(3000);
    
    // Analyse de la page
    console.log('\n📊 Analyse de la page...');
    
    // 1. Titre de la page
    const title = await page.title();
    console.log('📄 Titre:', title);
    
    // 2. URL actuelle
    const currentUrl = page.url();
    console.log('🔗 URL actuelle:', currentUrl);
    
    // 3. Vérifier les erreurs
    const errorTexts = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      const errors = [
        'accès refusé', 'accès interdit', 'blocked', 'forbidden',
        'captcha', 'robot', 'bot', 'protection', 'vérification',
        'aucun résultat', 'pas de résultat', 'no results',
        'maintenance', 'erreur', 'error', 'temporaire', 'temporary'
      ];
      return errors.filter(error => bodyText.includes(error));
    });
    
    if (errorTexts.length > 0) {
      console.log('⚠️ Erreurs détectées:', errorTexts);
    } else {
      console.log('✅ Aucune erreur détectée');
    }
    
    // 4. Test des sélecteurs
    console.log('\n🔍 Test des sélecteurs d\'annonces:');
    
    const selectors = [
      'article[data-qa-id="aditem_container"]',
      'article[data-test-id="ad"]',
      'article',
      '[data-qa-id="aditem_container"]',
      '[data-test-id="ad"]',
      '.ad-list-item',
      '.listing-item',
      '.search-result-item'
    ];
    
    for (const selector of selectors) {
      try {
        const count = await page.$$eval(selector, elements => elements.length);
        console.log(`- ${selector}: ${count} éléments`);
        
        if (count > 0) {
          // Analyser le premier élément
          const sample = await page.$$eval(selector, (elements, sel) => {
            const element = elements[0];
            const link = element.querySelector('a[href^="/ad/"]');
            const title = element.querySelector('[data-qa-id="aditem_title"], h3, h2, [class*="title"]');
            const price = element.querySelector('[data-qa-id="aditem_price"], [data-test-id="price"], [class*="price"]');
            
            return {
              hasLink: !!link,
              linkUrl: link?.href || null,
              title: title?.textContent?.trim() || null,
              price: price?.textContent?.trim() || null
            };
          }, selector);
          
          console.log(`  📝 Échantillon:`, sample);
        }
      } catch (e) {
        console.log(`- ${selector}: Erreur - ${e.message}`);
      }
    }
    
    // 5. Vérifier la structure HTML
    console.log('\n🏗️ Analyse de la structure HTML:');
    
    const structure = await page.evaluate(() => {
      const body = document.body;
      const articles = body.querySelectorAll('article');
      const divs = body.querySelectorAll('div');
      const links = body.querySelectorAll('a[href*="/ad/"]');
      
      return {
        totalArticles: articles.length,
        totalDivs: divs.length,
        adLinks: links.length,
        bodyTextLength: body.textContent.length,
        hasMainContent: !!body.querySelector('main'),
        hasSearchResults: !!body.querySelector('[class*="search"], [class*="result"], [class*="listing"]')
      };
    });
    
    console.log('📊 Structure:', structure);
    
    // 6. Vérifier les cookies
    const cookies = await page.cookies();
    const datadomeCookie = cookies.find(c => c.name === 'datadome');
    console.log('\n🍪 Cookies:');
    console.log('- Total cookies:', cookies.length);
    console.log('- Datadome cookie:', datadomeCookie ? 'Présent' : 'Absent');
    
    // 7. Vérifier les requêtes réseau
    console.log('\n🌐 Requêtes réseau récentes:');
    const requests = await page.evaluate(() => {
      if (window.performance && window.performance.getEntriesByType) {
        return window.performance.getEntriesByType('resource')
          .filter(r => r.name.includes('leboncoin'))
          .slice(0, 5)
          .map(r => ({
            url: r.name,
            type: r.initiatorType,
            duration: r.duration
          }));
      }
      return [];
    });
    
    requests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.url} (${req.type}) - ${req.duration}ms`);
    });
    
    // 8. Test de scroll et chargement
    console.log('\n📜 Test de scroll et chargement...');
    
    // Scroll progressif
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 500));
      await sleep(1000);
      
      // Vérifier si de nouveaux éléments apparaissent
      const newCount = await page.$$eval('article', elements => elements.length);
      console.log(`- Après scroll ${i + 1}: ${newCount} articles`);
    }
    
    // 9. Vérifier les messages d'erreur dans la console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await sleep(2000);
    
    if (consoleErrors.length > 0) {
      console.log('\n❌ Erreurs console:');
      consoleErrors.slice(0, 5).forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
    }
    
    // 10. Capture d'écran finale
    await page.screenshot({ path: 'lbc-diagnostic.png', fullPage: true });
    console.log('\n📸 Capture d\'écran sauvegardée: lbc-diagnostic.png');
    
    // 11. Recommandations
    console.log('\n💡 Recommandations:');
    
    const articleCount = await page.$$eval('article', elements => elements.length);
    if (articleCount === 0) {
      console.log('❌ Aucune annonce trouvée. Causes possibles:');
      console.log('1. Blocage IP (utilisez un VPN)');
      console.log('2. CAPTCHA non résolu');
      console.log('3. Sélecteurs obsolètes');
      console.log('4. Page en maintenance');
      console.log('5. Aucun résultat pour cette recherche');
    } else {
      console.log(`✅ ${articleCount} annonces trouvées`);
      console.log('Le scraping devrait fonctionner correctement');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
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

diagnosticLbc();
