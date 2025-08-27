const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLbcUrl() {
  console.log('🔧 Test de l\'URL de recherche Leboncoin...\n');
  
  try {
    // Récupérer la configuration depuis la DB
    const searchUrlSetting = await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_SEARCH_URL' }
    });
    
    const datadomeSetting = await prisma.scraperSetting.findFirst({
      where: { key: 'LBC_DATADOME' }
    });

    const searchUrl = searchUrlSetting?.value || 'https://www.leboncoin.fr/recherche?category=11&locations=r_26';
    const datadomeToken = datadomeSetting?.value || '';

    console.log('📋 URL de recherche:', searchUrl);
    console.log('🔑 Token Datadome:', datadomeToken ? 'Présent' : 'Absent');

    // Lancer le navigateur
    const browser = await puppeteer.launch({
      headless: false, // Mode visible pour debug
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    
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

    console.log('🌐 Navigation vers Leboncoin...');
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Vérifier si on est bloqué par Datadome
    const pageTitle = await page.title();
    console.log('📄 Titre de la page:', pageTitle);

    // Vérifier les sélecteurs d'annonces
    const selectors = [
      'article[data-qa-id="aditem_container"]',
      'article[data-test-id="ad"]',
      'article',
      '[data-qa-id="aditem_container"]',
      '[data-test-id="ad"]'
    ];

    console.log('\n🔍 Test des sélecteurs d\'annonces:');
    
    for (const selector of selectors) {
      try {
        const count = await page.$$eval(selector, elements => elements.length);
        console.log(`- ${selector}: ${count} éléments trouvés`);
        
        if (count > 0) {
          // Essayer d'extraire des infos de base
          const sample = await page.$$eval(selector, (elements, sel) => {
            const element = elements[0];
            const link = element.querySelector('a[href^="/ad/"]');
            const title = element.querySelector('[data-qa-id="aditem_title"], h3, h2, [class*="title"]');
            const price = element.querySelector('[data-qa-id="aditem_price"], [data-test-id="price"], [class*="price"]');
            const location = element.querySelector('[data-qa-id="aditem_location"], [data-test-id="location"], [class*="location"]');
            
            return {
              hasLink: !!link,
              linkUrl: link?.href || null,
              title: title?.textContent?.trim() || null,
              price: price?.textContent?.trim() || null,
              location: location?.textContent?.trim() || null
            };
          }, selector);
          
          console.log(`  📝 Échantillon:`, sample);
        }
      } catch (e) {
        console.log(`- ${selector}: Erreur - ${e.message}`);
      }
    }

    // Vérifier s'il y a des messages d'erreur ou de blocage
    const errorTexts = await page.evaluate(() => {
      const bodyText = document.body.textContent.toLowerCase();
      const errorIndicators = [
        'accès refusé',
        'accès interdit',
        'blocked',
        'forbidden',
        'captcha',
        'robot',
        'bot',
        'datadome',
        'protection'
      ];
      
      return errorIndicators.filter(indicator => bodyText.includes(indicator));
    });

    if (errorTexts.length > 0) {
      console.log('\n⚠️ Indicateurs d\'erreur détectés:', errorTexts);
    }

    // Prendre une capture d'écran pour debug
    await page.screenshot({ path: 'lbc-test-screenshot.png', fullPage: true });
    console.log('\n📸 Capture d\'écran sauvegardée: lbc-test-screenshot.png');

    console.log('\n✅ Test terminé. Vérifiez la capture d\'écran pour plus de détails.');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
    if (browser) await browser.close();
  }
}

testLbcUrl();
