// Test simple pour vérifier si le header s'affiche
const puppeteer = require('puppeteer');

async function testHeader() {
  console.log('🧪 Test de l\'affichage du header...\n');
  
  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({ 
      headless: false, // Mode visible pour voir le test
      defaultViewport: null,
      args: ['--window-size=1400,900']
    });
    
    const page = await browser.newPage();
    
    // Aller sur la page d'accueil
    console.log('📱 Navigation vers la page d\'accueil...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
    
    // Attendre que la page se charge
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Vérifier si le header est présent
    console.log('🔍 Vérification de la présence du header...');
    
    // Chercher le header par différentes méthodes
    const headerSelectors = [
      'header',
      '[class*="header"]',
      'a[href="/"]',
      '.text-xl.font-bold.text-blue-600'
    ];
    
    let headerFound = false;
    for (const selector of headerSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          console.log(`✅ Header trouvé avec le sélecteur: ${selector}`);
          headerFound = true;
          break;
        }
      } catch (e) {
        // Ignorer les erreurs de sélecteur
      }
    }
    
    if (!headerFound) {
      console.log('❌ Header non trouvé avec les sélecteurs de base');
      
      // Vérifier le contenu de la page
      const bodyText = await page.$eval('body', el => el.textContent);
      console.log('\n📄 Contenu de la page (premiers 500 caractères):');
      console.log(bodyText.substring(0, 500));
      
      // Vérifier s'il y a des erreurs dans la console
      const logs = await page.evaluate(() => {
        return window.console.logs || [];
      });
      
      if (logs.length > 0) {
        console.log('\n⚠️ Logs de la console:');
        logs.forEach(log => console.log(log));
      }
    }
    
    // Vérifier la structure HTML
    const html = await page.evaluate(() => document.documentElement.outerHTML);
    console.log('\n🔍 Structure HTML (premiers 1000 caractères):');
    console.log(html.substring(0, 1000));
    
    console.log('\n🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testHeader();
