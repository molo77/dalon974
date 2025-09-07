import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { solution } = await req.json();

  if (!solution || typeof solution !== 'string') {
    return NextResponse.json({
      error: 'Solution du captcha requise'
    }, { status: 400 });
  }

  let browser = null;
  let page = null;

  try {
    console.log('[API][Captcha][Solve] Résolution du captcha avec solution:', solution);
    
    // Récupérer la configuration du scraper
    const settings = await prisma.scraperSetting.findMany();
    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      if (s.value) settingsMap[s.key] = s.value;
    }

    const searchUrl = settingsMap['LBC_SEARCH_URL'] || 'https://www.leboncoin.fr/recherche?category=11&locations=r_26';
    const datadomeToken = settingsMap['LBC_DATADOME'] || '';

    // Lancer le navigateur
    browser = await puppeteer.launch({
      headless: false, // Mode non-headless pour l'interaction
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--window-size=1920,1080'
      ]
    });

    page = await browser.newPage();

    // Configuration anti-détection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      delete navigator.__proto__.webdriver;
    });

    // User agent réaliste
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Ajouter le cookie Datadome si présent
    if (datadomeToken) {
      await page.setCookie({
        name: 'datadome',
        value: datadomeToken,
        domain: '.leboncoin.fr',
        path: '/'
      });
    }

    // Naviguer vers la page
    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Attendre un peu pour que la page se charge
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Chercher et remplir le champ de captcha
    const captchaSolved = await page.evaluate((captchaSolution) => {
      // Chercher différents types de champs de captcha
      const captchaInputSelectors = [
        'input[name*="captcha" i]',
        'input[id*="captcha" i]',
        'input[placeholder*="captcha" i]',
        'input[placeholder*="verification" i]',
        'input[class*="captcha" i]',
        '#captcha',
        '.captcha input',
        'input[type="text"][maxlength="10"]', // Souvent les captchas ont une longueur limitée
        'input[type="text"][size="10"]'
      ];

      let captchaInput = null;
      let captchaType = 'unknown';

      for (const selector of captchaInputSelectors) {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input && input.offsetParent !== null) { // Vérifier que l'élément est visible
          captchaInput = input;
          captchaType = 'text';
          break;
        }
      }

      if (captchaInput) {
        // Remplir le champ
        captchaInput.value = captchaSolution;
        captchaInput.dispatchEvent(new Event('input', { bubbles: true }));
        captchaInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        return {
          success: true,
          captchaType,
          message: 'Champ de captcha rempli'
        };
      }

      // Chercher des boutons de soumission de captcha
      const submitSelectors = [
        'button[type="submit"]',
        'input[type="submit"]',
        'button:contains("Submit")',
        'button:contains("Vérifier")',
        'button:contains("Valider")',
        '.captcha button',
        '#captcha + button'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        const button = document.querySelector(selector) as HTMLButtonElement;
        if (button && button.offsetParent !== null) {
          submitButton = button;
          break;
        }
      }

      if (submitButton) {
        submitButton.click();
        return {
          success: true,
          captchaType: 'button',
          message: 'Bouton de captcha cliqué'
        };
      }

      return {
        success: false,
        message: 'Aucun champ de captcha trouvé'
      };
    }, solution);

    console.log('[API][Captcha][Solve] Résultat de la résolution:', captchaSolved);

    if (captchaSolved.success) {
      // Attendre un peu pour voir si la page change
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Vérifier si le captcha a été résolu
      const stillHasCaptcha = await page.evaluate(() => {
        const bodyText = document.body.textContent?.toLowerCase() || '';
        const captchaKeywords = [
          'captcha',
          'verification',
          'robot',
          'automation',
          'prove you are human',
          'vérifiez que vous êtes humain',
          'anti-robot',
          'incorrect',
          'wrong',
          'erreur'
        ];

        return captchaKeywords.some(keyword => bodyText.includes(keyword));
      });

      if (!stillHasCaptcha) {
        // Récupérer le nouveau token Datadome si disponible
        try {
          const cookies = await page.cookies();
          const newDatadomeCookie = cookies.find(cookie => cookie.name === 'datadome');
          
          if (newDatadomeCookie && newDatadomeCookie.value !== datadomeToken) {
            await prisma.scraperSetting.upsert({
              where: { key: 'LBC_DATADOME' },
              update: { value: newDatadomeCookie.value },
              create: { key: 'LBC_DATADOME', value: newDatadomeCookie.value }
            });
            console.log('[API][Captcha][Solve] Token Datadome mis à jour');
          }
        } catch (error) {
          console.log('[API][Captcha][Solve] Erreur lors de la mise à jour du token:', error);
        }

        return NextResponse.json({
          success: true,
          message: 'Captcha résolu avec succès'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Solution du captcha incorrecte'
        });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: captchaSolved.message || 'Impossible de résoudre le captcha'
      });
    }

  } catch (error) {
    console.error('[API][Captcha][Solve] Erreur:', error);
    return NextResponse.json({
      error: 'Erreur lors de la résolution du captcha',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
