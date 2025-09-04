// Test de l'affichage des logs du scraper
const puppeteer = require('puppeteer');

async function testLogsDisplay() {
  console.log('🧪 Test de l\'affichage des logs du scraper...\n');
  
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
    
    // Afficher les logs
    console.log('📋 Affichage des logs...');
    const logsButton = await page.$('button:has-text("📋 Afficher logs")');
    if (logsButton) {
      await logsButton.click();
      await page.waitForSelector('h3:has-text("Logs du Scraper")', { timeout: 3000 });
      console.log('✅ Section des logs affichée');
    } else {
      console.log('❌ Bouton de logs non trouvé');
      return;
    }
    
    // Attendre que les logs se chargent
    console.log('⏳ Attente du chargement des logs...');
    await page.waitForTimeout(2000);
    
    // Lire le contenu des logs
    const logsContent = await page.$eval('pre', el => el.textContent);
    console.log('\n📄 Contenu des logs:');
    console.log('─'.repeat(50));
    console.log(logsContent);
    console.log('─'.repeat(50));
    
    // Analyser le contenu
    if (logsContent.includes('Aucun run de scraper trouvé')) {
      console.log('\n🔍 Diagnostic: Aucun run de scraper dans la base de données');
      console.log('💡 Solution: Lancer un scraper pour voir des logs');
    } else if (logsContent.includes('Aucun log détaillé disponible')) {
      console.log('\n🔍 Diagnostic: Runs trouvés mais pas de logs détaillés');
      console.log('💡 Solution: Les runs n\'ont pas de rawLog, lancer un nouveau scraper');
    } else if (logsContent.includes('ERREUR')) {
      console.log('\n🔍 Diagnostic: Erreur lors du chargement des logs');
      console.log('💡 Solution: Vérifier la console du navigateur pour plus de détails');
    } else if (logsContent.includes('Chargement des logs...')) {
      console.log('\n🔍 Diagnostic: Les logs sont encore en cours de chargement');
      console.log('💡 Solution: Attendre ou cliquer sur "Actualiser"');
    } else {
      console.log('\n✅ Diagnostic: Logs chargés avec succès');
    }
    
    // Tester le bouton Actualiser
    console.log('\n🔄 Test du bouton Actualiser...');
    const refreshButton = await page.$('button:has-text("🔄 Actualiser")');
    if (refreshButton) {
      await refreshButton.click();
      console.log('✅ Bouton Actualiser cliqué');
      
      // Attendre le rechargement
      await page.waitForTimeout(1000);
      
      // Lire le nouveau contenu
      const newLogsContent = await page.$eval('pre', el => el.textContent);
      console.log('\n📄 Nouveau contenu après actualisation:');
      console.log('─'.repeat(30));
      console.log(newLogsContent.substring(0, 200) + '...');
      console.log('─'.repeat(30));
    } else {
      console.log('❌ Bouton Actualiser non trouvé');
    }
    
    // Vérifier les runs disponibles
    console.log('\n📊 Vérification des runs disponibles...');
    const runsTable = await page.$('table');
    if (runsTable) {
      const runsCount = await page.$$eval('table tbody tr', rows => rows.length);
      console.log(`   • ${runsCount} runs dans le tableau`);
      
      if (runsCount > 0) {
        const firstRun = await page.$eval('table tbody tr:first-child', row => {
          const cells = row.querySelectorAll('td');
          return {
            status: cells[2]?.textContent?.trim(),
            startedAt: cells[0]?.textContent?.trim()
          };
        });
        console.log(`   • Premier run: ${firstRun.status} (${firstRun.startedAt})`);
      }
    } else {
      console.log('   • Aucun tableau de runs trouvé');
    }
    
    console.log('\n🎉 Test terminé !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

testLogsDisplay();
