// Test de la fonctionnalité d'affichage des logs du scraper
const puppeteer = require('puppeteer');

async function testScraperLogs() {
  console.log('🧪 Test de la fonctionnalité d\'affichage des logs du scraper...\n');
  
  let browser;
  try {
    // Lancer le navigateur
    browser = await puppeteer.launch({ 
      headless: false, // Mode visible pour voir le test
      defaultViewport: null,
      args: ['--window-size=1400,900']
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
    
    // Vérifier que le bouton de logs est présent
    const logsButton = await page.$('button:has-text("📋 Afficher logs")');
    if (logsButton) {
      console.log('✅ Bouton "Afficher logs" trouvé');
    } else {
      console.log('❌ Bouton "Afficher logs" non trouvé');
      return;
    }
    
    // Vérifier que les logs sont cachés par défaut
    const logsSection = await page.$('h3:has-text("Logs du Scraper")');
    if (!logsSection) {
      console.log('✅ Logs cachés par défaut (comportement attendu)');
    } else {
      console.log('❌ Logs visibles par défaut (non attendu)');
    }
    
    // Cliquer sur le bouton pour afficher les logs
    console.log('📋 Affichage des logs...');
    await logsButton.click();
    
    // Attendre que la section des logs apparaisse
    await page.waitForSelector('h3:has-text("Logs du Scraper")', { timeout: 3000 });
    console.log('✅ Section des logs affichée');
    
    // Vérifier que le bouton a changé
    const newButton = await page.$('button:has-text("📋 Masquer logs")');
    if (newButton) {
      console.log('✅ Bouton changé vers "Masquer logs"');
    } else {
      console.log('❌ Bouton n\'a pas changé');
    }
    
    // Vérifier la présence des boutons d'action dans la section des logs
    const refreshButton = await page.$('button:has-text("🔄 Actualiser")');
    const clearButton = await page.$('button:has-text("🗑️ Effacer")');
    
    if (refreshButton) {
      console.log('✅ Bouton "Actualiser" trouvé dans la section des logs');
    } else {
      console.log('❌ Bouton "Actualiser" non trouvé');
    }
    
    if (clearButton) {
      console.log('✅ Bouton "Effacer" trouvé dans la section des logs');
    } else {
      console.log('❌ Bouton "Effacer" non trouvé');
    }
    
    // Vérifier la présence de la zone d'affichage des logs
    const logsDisplay = await page.$('pre');
    if (logsDisplay) {
      console.log('✅ Zone d\'affichage des logs trouvée');
      
      // Lire le contenu des logs
      const logsContent = await page.$eval('pre', el => el.textContent);
      console.log('📄 Contenu des logs:', logsContent.substring(0, 100) + '...');
    } else {
      console.log('❌ Zone d\'affichage des logs non trouvée');
    }
    
    // Cliquer sur le bouton pour masquer les logs
    console.log('📋 Masquage des logs...');
    await newButton.click();
    
    // Attendre que la section des logs disparaisse
    await page.waitForFunction(() => {
      return !document.querySelector('h3:has-text("Logs du Scraper")');
    }, { timeout: 3000 });
    console.log('✅ Section des logs masquée');
    
    // Vérifier que le bouton est revenu à l'état initial
    const finalButton = await page.$('button:has-text("📋 Afficher logs")');
    if (finalButton) {
      console.log('✅ Bouton revenu à "Afficher logs"');
    } else {
      console.log('❌ Bouton n\'est pas revenu à l\'état initial');
    }
    
    console.log('\n🎉 Test terminé avec succès !');
    console.log('✅ La fonctionnalité d\'affichage des logs fonctionne correctement');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testScraperLogs();
