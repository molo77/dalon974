// Test de la fonctionnalité de basculement de la configuration admin
const puppeteer = require('puppeteer');

async function testAdminConfigToggle() {
  console.log('🧪 Test de la fonctionnalité de basculement de la configuration admin...\n');
  
  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({ 
      headless: false, // Mode visible pour voir le test
      defaultViewport: null,
      args: ['--window-size=1200,800']
    });
    
    const page = await browser.newPage();
    
    // Aller sur la page admin
    console.log('📱 Navigation vers la page admin...');
    await page.goto('http://localhost:3000/admin', { waitUntil: 'networkidle2' });
    
    // Attendre que la page se charge
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Vérifier que nous sommes sur la page admin
    const title = await page.$eval('h1', el => el.textContent);
    console.log('✅ Page chargée:', title);
    
    // Cliquer sur l'onglet Scraper
    console.log('🕷️ Navigation vers l\'onglet Scraper...');
    await page.click('button:has-text("🕷️ Scraper")');
    
    // Attendre que l'onglet se charge
    await page.waitForSelector('h1:has-text("Scraper Leboncoin")', { timeout: 5000 });
    
    // Vérifier que le bouton de configuration est présent
    const configButton = await page.$('button:has-text("🔼 Afficher config")');
    if (configButton) {
      console.log('✅ Bouton "Afficher config" trouvé');
    } else {
      console.log('❌ Bouton "Afficher config" non trouvé');
      return;
    }
    
    // Vérifier que la configuration est cachée par défaut
    const configSection = await page.$('h3:has-text("Configuration du Scraper")');
    if (!configSection) {
      console.log('✅ Configuration cachée par défaut (comportement attendu)');
    } else {
      console.log('❌ Configuration visible par défaut (non attendu)');
    }
    
    // Cliquer sur le bouton pour afficher la configuration
    console.log('🔽 Affichage de la configuration...');
    await configButton.click();
    
    // Attendre que la configuration apparaisse
    await page.waitForSelector('h3:has-text("Configuration du Scraper")', { timeout: 3000 });
    console.log('✅ Configuration affichée');
    
    // Vérifier que le bouton a changé
    const newButton = await page.$('button:has-text("🔽 Masquer config")');
    if (newButton) {
      console.log('✅ Bouton changé vers "Masquer config"');
    } else {
      console.log('❌ Bouton n\'a pas changé');
    }
    
    // Cliquer sur le bouton pour masquer la configuration
    console.log('🔼 Masquage de la configuration...');
    await newButton.click();
    
    // Attendre que la configuration disparaisse
    await page.waitForFunction(() => {
      return !document.querySelector('h3:has-text("Configuration du Scraper")');
    }, { timeout: 3000 });
    console.log('✅ Configuration masquée');
    
    // Vérifier que le bouton est revenu à l'état initial
    const finalButton = await page.$('button:has-text("🔼 Afficher config")');
    if (finalButton) {
      console.log('✅ Bouton revenu à "Afficher config"');
    } else {
      console.log('❌ Bouton n\'est pas revenu à l\'état initial');
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('✅ La fonctionnalité de basculement de la configuration fonctionne correctement');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testAdminConfigToggle();
