const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function scrapeLbcManual() {
  console.log('🔧 Scraping Leboncoin en mode manuel...\n');
  
  try {
    // Récupérer la configuration
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

    // Lancer le navigateur en mode visible
    const browser = await puppeteer.launch({
      headless: false, // Mode visible pour résoudre le CAPTCHA
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--window-size=1920,1080'
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
    console.log('⚠️ Si un CAPTCHA apparaît, résolvez-le manuellement puis appuyez sur Entrée dans ce terminal...');
    
    await page.goto(searchUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Attendre que l'utilisateur résolve le CAPTCHA
    console.log('\n⏳ En attente de résolution du CAPTCHA...');
    console.log('📝 Une fois le CAPTCHA résolu et la page chargée, appuyez sur Entrée pour continuer...');
    
    // Attendre l'entrée utilisateur
    await new Promise(resolve => {
      process.stdin.once('data', () => {
        console.log('✅ Continuation du scraping...');
        resolve();
      });
    });

    // Vérifier si on peut maintenant accéder aux annonces
    console.log('🔍 Vérification des annonces...');
    
    const articles = await page.$$eval('article[data-qa-id="aditem_container"], article[data-test-id="ad"], article', elements => {
      return elements.slice(0, 5).map(article => {
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

    console.log(`📊 ${articles.length} annonces trouvées:`);
    articles.forEach((article, index) => {
      console.log(`${index + 1}. ${article.price || 'Prix N/A'} | ${article.location || 'Lieu N/A'} | ${article.title || 'Titre N/A'}`);
    });

    if (articles.length > 0) {
      console.log('\n✅ Le scraping fonctionne ! Vous pouvez maintenant utiliser le scraper automatique.');
      
      // Récupérer le nouveau token Datadome si disponible
      const cookies = await page.cookies();
      const newDatadomeCookie = cookies.find(cookie => cookie.name === 'datadome');
      
      if (newDatadomeCookie && newDatadomeCookie.value !== datadomeToken) {
        console.log('🔄 Nouveau token Datadome détecté, mise à jour...');
        await prisma.scraperSetting.upsert({
          where: { key: 'LBC_DATADOME' },
          update: { value: newDatadomeCookie.value },
          create: { key: 'LBC_DATADOME', value: newDatadomeCookie.value }
        });
        console.log('✅ Token Datadome mis à jour dans la base de données');
      }
    } else {
      console.log('❌ Aucune annonce trouvée. Vérifiez que la page est bien chargée.');
    }

    console.log('\n📸 Capture d\'écran finale...');
    await page.screenshot({ path: 'lbc-manual-result.png', fullPage: true });
    console.log('✅ Capture d\'écran sauvegardée: lbc-manual-result.png');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔒 Fermeture du navigateur dans 5 secondes...');
    setTimeout(async () => {
      if (browser) await browser.close();
      process.exit(0);
    }, 5000);
  }
}

scrapeLbcManual();
