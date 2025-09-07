import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { captchaType, captchaDetails, timestamp } = await req.json();

  try {
    console.log('[API][Captcha][Notify] Notification de captcha détecté:', {
      captchaType,
      captchaDetails,
      timestamp
    });

    // Créer une notification dans la base de données
    const notification = await prisma.scraperRun.create({
      data: {
        status: 'captcha_detected',
        startTime: new Date(timestamp || Date.now()),
        endTime: new Date(),
        metrics: JSON.stringify({
          captchaType,
          captchaDetails,
          message: 'Captcha détecté - Résolution manuelle requise'
        }),
        config: JSON.stringify({
          captchaDetected: true,
          captchaType,
          requiresManualResolution: true
        })
      }
    });

    console.log('[API][Captcha][Notify] Notification créée:', notification.id);

    return NextResponse.json({
      success: true,
      notificationId: notification.id,
      message: 'Notification de captcha créée'
    });

  } catch (error) {
    console.error('[API][Captcha][Notify] Erreur:', error);
    return NextResponse.json({
      error: 'Erreur lors de la création de la notification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
