// Scraper Leboncoin simplifié avec gestion d'erreurs améliorée
// Version corrigée pour éviter les problèmes de blocage

const puppeteer = require('puppeteer');
const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const ScraperLogger = require('/data/rodcoloc/logs/scraper/logger');

const execAsync = promisify(exec);
const prisma = new PrismaClient();
const logger = new ScraperLogger();

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

async function detectCaptcha(page) {
  try {
    const captchaInfo = await page.evaluate(() => {
      // Chercher différents types de captchas
      const captchaSelectors = [
        'iframe[src*="recaptcha"]',
        'iframe[src*="hcaptcha"]',
        '.g-recaptcha',
        '.h-captcha',
        '[data-sitekey]',
        'img[src*="captcha"]',
        'img[alt*="captcha" i]',
        'img[alt*="verification" i]',
        '.captcha',
        '#captcha',
        '[class*="captcha" i]',
        '[id*="captcha" i]'
      ];

      let captchaElement = null;
      let captchaType = 'unknown';

      for (const selector of captchaSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          captchaElement = element;
          
          if (selector.includes('recaptcha')) {
            captchaType = 'recaptcha';
          } else if (selector.includes('hcaptcha')) {
            captchaType = 'hcaptcha';
          } else if (selector.includes('img')) {
            captchaType = 'image';
          } else {
            captchaType = 'other';
          }
          break;
        }
      }

      // Vérifier aussi dans le texte de la page (mais ignorer le code JavaScript)
      const bodyText = document.body.textContent?.toLowerCase() || '';
      
      // Ignorer les faux positifs dans le code JavaScript
      const isJavaScriptCode = bodyText.includes('var dd=') || 
                              bodyText.includes('function(') ||
                              bodyText.includes('document.') ||
                              bodyText.includes('window.');
      
      const captchaKeywords = [
        'captcha',
        'verification',
        'robot',
        'automation',
        'prove you are human',
        'vérifiez que vous êtes humain',
        'anti-robot'
      ];

      // Ne détecter le captcha par texte que si ce n'est pas du code JavaScript
      const hasCaptchaText = !isJavaScriptCode && captchaKeywords.some(keyword => bodyText.includes(keyword));

      return {
        hasCaptcha: !!(captchaElement || hasCaptchaText),
        captchaType,
        captchaElement: captchaElement ? captchaElement.outerHTML.substring(0, 200) : null,
        hasCaptchaText,
        bodyTextSnippet: bodyText.substring(0, 500)
      };
    });

    return captchaInfo;
  } catch (e) {
    logger.error(`Erreur lors de la détection de captcha: ${e.message}`);
    return { hasCaptcha: false, captchaType: 'unknown', error: e.message };
  }
}

async function scrapeWithFixed() {
  // Initialiser le système de logs
  logger.initialize();
  logger.start('Démarrage du scraper Leboncoin corrigé');
  
  let browser = null;
  let page = null;
  let attemptCount = 0;
  const maxAttempts = 3; // Réduit le nombre de tentatives
  
  try {
    const config = await getConfig();
    
    logger.info('Configuration du scraper:');
    logger.info(`- URL: ${config.LBC_SEARCH_URL}`);
    logger.info(`- Headless: ${config.LBC_BROWSER_HEADLESS}`);
    logger.info(`- Max annonces: ${config.LBC_MAX}`);
    logger.info(`- Pages: ${config.LBC_PAGES}`);
    logger.info(`- Délai entre requêtes: ${config.LBC_DELAY_BETWEEN_REQUESTS}ms`);
    
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
      logger.info('- Token Datadome: Présent');
    } else {
      logger.warning('- Token Datadome: Absent');
    }
    
    // Vérifier l'IP initiale
    const initialIP = await getCurrentIP();
    logger.info(`IP initiale: ${initialIP || 'Inconnue'}`);
    
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
        //'--disable-images', // Désactiver les images pour accélérer
        // '--disable-javascript', // JavaScript nécessaire pour Leboncoin
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
    logger.info(`User Agent: ${userAgent}`);
    
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
        logger.success('Cookie Datadome ajouté');
      } catch (error) {
        logger.error('Erreur lors de l\'ajout du cookie Datadome');
      }
    }
    
    let scrapingSuccessful = false;
    
    while (!scrapingSuccessful && attemptCount < maxAttempts) {
      attemptCount++;
      logger.info(`Tentative ${attemptCount}/${maxAttempts}`);
      
      try {
        logger.info('Navigation vers Leboncoin');
        
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
          logger.warning('Blocage détecté !');
          logger.info('Tentative de contournement...');
          
          // Attendre plus longtemps avant la prochaine tentative
          await sleep(5000);
          continue;
        } else {
          logger.success('Aucun blocage détecté, continuation...');
        }
        
        // Détecter les captchas
        const captchaInfo = await detectCaptcha(page);
        
        if (captchaInfo.hasCaptcha) {
          logger.warning(`🚨 CAPTCHA DÉTECTÉ ! Type: ${captchaInfo.captchaType}`);
          logger.warning('Le scraper est bloqué par un captcha.');
          logger.info('💡 Ouverture automatique du modal de résolution...');
          logger.info('📋 Détails du captcha:');
          if (captchaInfo.captchaElement) {
            logger.info(`- Élément HTML: ${captchaInfo.captchaElement}`);
          }
          if (captchaInfo.hasCaptchaText) {
            logger.info('- Texte de captcha détecté dans la page');
          }
          logger.info(`- Extrait de la page: ${captchaInfo.bodyTextSnippet}`);
          
          // Capturer l'image du captcha
          let captchaImageBase64 = null;
          try {
            logger.info('📸 Capture de l\'image du captcha...');
            
            // Chercher l'élément de captcha et le capturer
            const captchaImageData = await page.evaluate(() => {
              // Chercher différents types d'images de captcha
              const captchaSelectors = [
                'img[src*="captcha"]',
                'img[alt*="captcha"]',
                'img[alt*="Captcha"]',
                'img[alt*="CAPTCHA"]',
                '.captcha img',
                '#captcha img',
                'img[src*="recaptcha"]',
                'img[src*="hcaptcha"]'
              ];
              
              for (const selector of captchaSelectors) {
                const img = document.querySelector(selector);
                if (img && img.src) {
                  return {
                    src: img.src,
                    alt: img.alt || '',
                    width: img.width || img.naturalWidth,
                    height: img.height || img.naturalHeight
                  };
                }
              }
              
              return null;
            });
            
            if (captchaImageData && captchaImageData.src) {
              // Capturer l'image en base64
              const imageBuffer = await page.screenshot({
                clip: {
                  x: 0,
                  y: 0,
                  width: await page.viewport().width,
                  height: await page.viewport().height
                }
              });
              
              captchaImageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
              logger.success('✅ Image du captcha capturée');
            } else {
              logger.warning('⚠️ Impossible de trouver l\'image du captcha');
            }
          } catch (error) {
            logger.warning(`⚠️ Erreur lors de la capture du captcha: ${error.message}`);
          }
          
          // Créer d'abord le fichier de notification et mettre en pause
          const currentUrl = page.url();
          
          // Créer le fichier de notification pour l'admin
          try {
            const notificationData = {
              captchaDetected: true,
              captchaType: captchaInfo.captchaType,
              captchaUrl: currentUrl,
              captchaDetails: {
                captchaElement: captchaInfo.captchaElement,
                hasCaptchaText: captchaInfo.hasCaptchaText,
                bodyTextSnippet: captchaInfo.bodyTextSnippet,
                captchaImage: captchaImageBase64
              },
              timestamp: new Date().toISOString(),
              message: 'Captcha détecté - Résolution manuelle requise dans le navigateur'
            };
            
            const fs = require('fs');
            const path = require('path');
            const notificationDir = path.join(__dirname, '../../../../logs/scraper');
            const notificationFile = path.join(notificationDir, 'captcha-notification.json');
            
            // Créer le répertoire s'il n'existe pas
            if (!fs.existsSync(notificationDir)) {
              fs.mkdirSync(notificationDir, { recursive: true });
            }
            
            fs.writeFileSync(notificationFile, JSON.stringify(notificationData, null, 2));
            logger.success('✅ Fichier de notification créé');
          } catch (error) {
            logger.warning(`⚠️ Erreur lors de la création de la notification: ${error.message}`);
          }
          
          // Mettre le statut du scraper en pause
          try {
            logger.info('⏸️ Mise en pause du scraper...');
            
            // Mettre à jour le statut du scraper en base de données
            const latestRun = await prisma.scraperRun.findFirst({
              where: { status: 'running' },
              orderBy: { startedAt: 'desc' }
            });
            
            if (latestRun) {
              await prisma.scraperRun.update({
                where: { id: latestRun.id },
                data: { 
                  status: 'paused',
                  finishedAt: new Date(),
                  errorMessage: 'Captcha détecté - Résolution manuelle requise'
                }
              });
              logger.success('✅ Statut du scraper mis en pause');
            }
          } catch (error) {
            logger.warning(`⚠️ Erreur lors de la mise en pause: ${error.message}`);
          }
          
          // Maintenant ouvrir le navigateur et attendre
          let captchaResolved = false;
          
          try {
            logger.info('🌐 Ouverture de l\'URL dans le navigateur par défaut...');
            logger.info(`📍 URL du captcha: ${currentUrl}`);
            
            // Ouvrir dans le navigateur par défaut
            const { exec } = require('child_process');
            const openCommand = process.platform === 'win32' ? 'start' : 
                              process.platform === 'darwin' ? 'open' : 'xdg-open';
            
            exec(`${openCommand} "${currentUrl}"`, (error, stdout, stderr) => {
              if (error) {
                logger.warning(`⚠️ Erreur lors de l'ouverture du navigateur: ${error.message}`);
                logger.info('💡 Ouvrez manuellement cette URL dans votre navigateur:');
                logger.info(`   ${currentUrl}`);
              } else {
                logger.success('✅ Nouvel onglet ouvert dans le navigateur');
                logger.info('💡 Résolvez le captcha dans l\'onglet ouvert');
                logger.info('🔄 Une fois résolu, appuyez sur Entrée dans ce terminal pour continuer');
              }
            });
            
            // Attendre que le navigateur s'ouvre
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Attendre que l'utilisateur appuie sur Entrée
            logger.info('⏳ Appuyez sur Entrée une fois que vous avez résolu le captcha...');
            await new Promise((resolve) => {
              const readline = require('readline');
              const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
              });
              
              rl.question('', () => {
                rl.close();
                resolve();
              });
            });
            
            logger.info('✅ Captcha résolu, continuation du scraper...');
            
            // Rafraîchir la page pour vérifier que le captcha est résolu
            await page.reload({ waitUntil: 'domcontentloaded' });
            
            // Vérifier à nouveau s'il y a un captcha
            const captchaInfoAfter = await detectCaptcha(page);
            if (captchaInfoAfter.hasCaptcha) {
              logger.warning('⚠️ Captcha toujours présent, nouvelle tentative...');
              throw new Error('Captcha non résolu');
            } else {
              logger.success('✅ Captcha résolu avec succès !');
              logger.info('🔄 Continuation du scraping...');
              captchaResolved = true;
            }
            
          } catch (error) {
            logger.warning(`⚠️ Erreur lors de la résolution du captcha: ${error.message}`);
            logger.info('💡 Le scraper va s\'arrêter. Relancez-le après avoir résolu le captcha.');
          }
          
          // Si le captcha a été résolu, continuer le scraping
          if (captchaResolved) {
            logger.info('🚀 Reprise du scraping après résolution du captcha...');
            // Continuer avec la boucle principale du scraping
            continue; // Continuer la boucle principale
          }
          
          // Attendre que l'utilisateur résolve le captcha
          logger.info('⏳ Scraper en pause - Attente de la résolution du captcha...');
          logger.info('💡 Résolvez le captcha dans l\'onglet ouvert, puis relancez le scraper');
          
          // Fermer le navigateur mais garder le processus en vie
          if (browser) {
            await browser.close();
          }
          await prisma.$disconnect();
          
          // Sortir avec un code spécial pour indiquer qu'un captcha a été détecté
          logger.info('🏁 Scraper en pause - Captcha détecté');
          process.exit(2); // Code 2 pour captcha détecté
        } else {
          logger.success('Aucun captcha détecté, continuation...');
        }
        
        // Cliquer sur les cookies si présent
        try {
          await page.click('#didomi-notice-agree-button', { timeout: 3000 });
          logger.success('Cookies acceptés');
          await sleep(1000);
        } catch {}
        
        // Récupérer les annonces avec une approche plus robuste
        logger.info('Recherche des annonces...');
        
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
        
        logger.info(`Résultats: ${articles.length} annonces trouvées`);
        
        if (articles.length > 0) {
          logger.info('Échantillon des annonces:');
          articles.slice(0, 5).forEach((article, index) => {
            logger.info(`${index + 1}. ${article.price || 'Prix N/A'} | ${article.location || 'Lieu N/A'} | ${article.title || 'Titre N/A'}`);
          });
          
          // Récupérer le nouveau token Datadome
          try {
            const cookies = await page.cookies();
            const newDatadomeCookie = cookies.find(cookie => cookie.name === 'datadome');
            
            if (newDatadomeCookie && newDatadomeCookie.value !== datadomeToken) {
              logger.info('Nouveau token Datadome détecté, mise à jour...');
              await prisma.scraperSetting.upsert({
                where: { key: 'LBC_DATADOME' },
                update: { value: newDatadomeCookie.value },
                create: { key: 'LBC_DATADOME', value: newDatadomeCookie.value }
              });
              logger.success('Token Datadome mis à jour dans la base de données');
            }
          } catch (error) {
            logger.error('Erreur lors de la mise à jour du token Datadome');
          }
          
          // Sauvegarder les annonces dans la base de données
          logger.info('Sauvegarde des annonces dans la base de données...');
          
          let created = 0;
          let updated = 0;
          let skippedRecent = 0;
          
          // Récupérer l'utilisateur admin par défaut
          const adminUser = await prisma.user.findFirst({
            where: { role: 'admin' }
          });
          
          if (!adminUser) {
            logger.error('Aucun utilisateur admin trouvé pour sauvegarder les annonces');
            return;
          }
          
          for (const article of articles) {
            try {
              // Extraire l'ID de l'annonce depuis l'URL
              const urlMatch = article.url?.match(/\/ad\/([^\/]+)/);
              const lbcId = urlMatch ? urlMatch[1] : null;
              
              if (!lbcId) {
                logger.warning(`Impossible d'extraire l'ID de l'annonce: ${article.url}`);
                continue;
              }
              
              // Vérifier si l'annonce existe déjà
              const existingAnnonce = await prisma.annonce.findFirst({
                where: { 
                  id: lbcId
                }
              });
              
              // Extraire le prix
              let prix = null;
              if (article.price) {
                const priceMatch = article.price.match(/(\d+)/);
                if (priceMatch) {
                  prix = parseInt(priceMatch[1], 10);
                }
              }
              
              // Extraire la ville
              const ville = article.location || 'La Réunion';
              
              const annonceData = {
                id: lbcId,
                title: article.title || 'Annonce Leboncoin',
                description: `Annonce collectée depuis Leboncoin\nURL: ${article.url}`,
                ville: ville,
                prix: prix,
                source: 'lbc',
                userId: adminUser.id,
                createdAt: new Date(),
                updatedAt: new Date()
              };
              
              if (existingAnnonce) {
                // Mettre à jour l'annonce existante
                await prisma.annonce.update({
                  where: { id: existingAnnonce.id },
                  data: {
                    ...annonceData,
                    updatedAt: new Date()
                  }
                });
                updated++;
                logger.info(`Annonce mise à jour: ${article.title}`);
              } else {
                // Créer une nouvelle annonce
                await prisma.annonce.create({
                  data: annonceData
                });
                created++;
                logger.success(`Nouvelle annonce créée: ${article.title}`);
              }
              
            } catch (error) {
              logger.error(`Erreur lors de la sauvegarde de l'annonce ${article.title}: ${error.message}`);
            }
          }
          
          // Afficher les métriques
          const metrics = {
            created: created,
            updated: updated,
            skippedRecent: skippedRecent,
            cooldownHours: 24
          };
          
          logger.metrics(metrics);
          console.log('LBC_METRICS_JSON:' + JSON.stringify(metrics));
          console.log(`total annonces collectées avant coupe ${articles.length}`);
          logger.info(`Résumé: ${created} créées, ${updated} mises à jour`);
          
          logger.success('Le scraping et la sauvegarde fonctionnent !');
          scrapingSuccessful = true;
        } else {
          logger.warning('Aucune annonce trouvée. Nouvelle tentative...');
          await sleep(3000);
        }
        
      } catch (error) {
        logger.error(`Erreur lors de la tentative: ${error.message}`);
        await sleep(3000);
      }
    }
    
    if (!scrapingSuccessful) {
      logger.error('Impossible de récupérer des annonces après plusieurs tentatives');
      logger.info('Suggestions:');
      logger.info('1. Vérifiez votre connexion internet');
      logger.info('2. Essayez plus tard');
      logger.info('3. Vérifiez l\'URL de recherche');
      logger.info('4. Contactez le support');
    }
    
    // Capture d'écran finale si pas en headless
    if (!headless) {
      try {
        await page.screenshot({ path: 'lbc-simple-result.png', fullPage: true });
        logger.info('Capture d\'écran sauvegardée: lbc-simple-result.png');
      } catch (error) {
        logger.error('Erreur lors de la capture d\'écran');
      }
    }
    
  } catch (error) {
    logger.error(`Erreur fatale: ${error.message}`);
  } finally {
    try {
      await prisma.$disconnect();
    } catch (error) {
      logger.error('Erreur lors de la déconnexion de la base de données');
    }
    
    if (browser) {
      logger.info('Fermeture du navigateur...');
      try {
        await browser.close();
      } catch (error) {
        logger.error('Erreur lors de la fermeture du navigateur');
      }
    }
    
    logger.end('Script terminé');
    logger.showStats();
    process.exit(0);
  }
}

// Gestion de l'arrêt propre
process.on('SIGINT', async () => {
  logger.warning('Arrêt demandé...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warning('Arrêt demandé...');
  process.exit(0);
});

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.error(`Erreur non capturée: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Promesse rejetée non gérée: ${reason}`);
  process.exit(1);
});

scrapeWithFixed();
