import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let browser = null;
  let page = null;

  try {
    console.log('[API][Captcha][Detect] Démarrage de la détection de captcha...');
    
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
      headless: true,
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

    // Détecter les captchas
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

      // Vérifier aussi dans le texte de la page
      const bodyText = document.body.textContent?.toLowerCase() || '';
      const captchaKeywords = [
        'captcha',
        'verification',
        'robot',
        'automation',
        'prove you are human',
        'vérifiez que vous êtes humain',
        'anti-robot'
      ];

      const hasCaptchaText = captchaKeywords.some(keyword => bodyText.includes(keyword));

      return {
        hasCaptcha: !!(captchaElement || hasCaptchaText),
        captchaType,
        captchaElement: captchaElement ? captchaElement.outerHTML.substring(0, 200) : null,
        hasCaptchaText,
        bodyTextSnippet: bodyText.substring(0, 500)
      };
    });

    console.log('[API][Captcha][Detect] Résultat de la détection:', captchaInfo);

    if (captchaInfo.hasCaptcha) {
      // Si c'est un captcha d'image, essayer de capturer l'image
      let captchaImage = null;
      
      if (captchaInfo.captchaType === 'image') {
        try {
          const imageElement = await page.$('img[src*="captcha"], img[alt*="captcha" i], img[alt*="verification" i]');
          if (imageElement) {
            const imageData = await imageElement.screenshot({ encoding: 'base64' });
            captchaImage = imageData;
          }
        } catch (error) {
          console.log('[API][Captcha][Detect] Erreur lors de la capture d\'image:', error);
        }
      }

      return NextResponse.json({
        hasCaptcha: true,
        captchaType: captchaInfo.captchaType,
        captchaImage,
        message: `Captcha de type ${captchaInfo.captchaType} détecté`
      });
    } else {
      return NextResponse.json({
        hasCaptcha: false,
        message: 'Aucun captcha détecté'
      });
    }

  } catch (error) {
    console.error('[API][Captcha][Detect] Erreur:', error);
    return NextResponse.json({
      error: 'Erreur lors de la détection du captcha',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
