import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import puppeteer from 'puppeteer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST() {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    console.log('[API][Datadome] Démarrage récupération token...');
    
    // Lancer un navigateur headless
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Configuration du user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Aller sur Leboncoin
    console.log('[API][Datadome] Navigation vers Leboncoin...');
    await page.goto('https://www.leboncoin.fr/recherche?category=11&locations=r_26', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Récupérer tous les cookies
    const cookies = await page.cookies();
    const datadomeCookie = cookies.find(cookie => cookie.name === 'datadome');
    
    let token = null;
    if (datadomeCookie) {
      token = datadomeCookie.value;
      console.log('[API][Datadome] Token trouvé:', token.substring(0, 20) + '...');
    } else {
      console.log('[API][Datadome] Aucun cookie datadome trouvé');
      
      // Essayer de déclencher Datadome en naviguant
      try {
        await page.goto('https://www.leboncoin.fr/', {
          waitUntil: 'networkidle2',
          timeout: 15000
        });
        
        // Attendre un peu pour que les cookies se chargent
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const cookiesAfter = await page.cookies();
        const datadomeCookieAfter = cookiesAfter.find(cookie => cookie.name === 'datadome');
        if (datadomeCookieAfter) {
          token = datadomeCookieAfter.value;
          console.log('[API][Datadome] Token trouvé après navigation:', token.substring(0, 20) + '...');
        }
      } catch (e) {
        console.log('[API][Datadome] Erreur navigation secondaire:', e);
      }
    }

    await browser.close();
    
    if (token) {
      // Sauvegarder le token dans la base de données
      try {
        await prisma.scraperSetting.upsert({
          where: { key: 'LBC_DATADOME' },
          update: { value: token },
          create: { key: 'LBC_DATADOME', value: token }
        });
        console.log('[API][Datadome] Token sauvegardé dans la base de données');
      } catch (dbError) {
        console.error('[API][Datadome] Erreur sauvegarde DB:', dbError);
      }

      return NextResponse.json({ 
        success: true, 
        token,
        message: 'Token Datadome récupéré et sauvegardé avec succès'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Aucun token Datadome trouvé'
      }, { status: 404 });
    }

     } catch (error) {
     console.error('[API][Datadome] Erreur:', error);
     return NextResponse.json({ 
       error: 'Erreur lors de la récupération du token',
       details: error instanceof Error ? error.message : 'Unknown error'
     }, { status: 500 });
   } finally {
     await prisma.$disconnect();
   }
}
