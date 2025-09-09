import { NextResponse } from 'next/server';
import { auth } from '@/config/auth';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const notificationFile = path.join(process.cwd(), '..', 'logs', 'scraper', 'captcha-notification.json');
    
    // Vérifier si le fichier existe
    if (!fs.existsSync(notificationFile)) {
      return NextResponse.json({
        hasNotification: false,
        message: 'Aucune notification de captcha'
      });
    }
    
    // Lire le fichier de notification
    const notificationData = JSON.parse(fs.readFileSync(notificationFile, 'utf8'));
    
    // Vérifier si la notification est récente (moins de 10 minutes)
    const notificationTime = new Date(notificationData.timestamp);
    const isRecent = (Date.now() - notificationTime.getTime()) < 10 * 60 * 1000; // 10 minutes
    
    if (!isRecent) {
      // Supprimer l'ancienne notification
      fs.unlinkSync(notificationFile);
      return NextResponse.json({
        hasNotification: false,
        message: 'Notification de captcha expirée'
      });
    }
    
    return NextResponse.json({
      hasNotification: true,
      notification: notificationData,
      message: 'Notification de captcha active'
    });
    
  } catch (error) {
    console.error('[API][Captcha][Check] Erreur:', error);
    return NextResponse.json({
      hasNotification: false,
      error: 'Erreur lors de la vérification de la notification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}

export async function DELETE() {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const notificationFile = path.join(process.cwd(), '..', 'logs', 'scraper', 'captcha-notification.json');
    
    if (fs.existsSync(notificationFile)) {
      fs.unlinkSync(notificationFile);
      return NextResponse.json({
        success: true,
        message: 'Notification de captcha supprimée'
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Aucune notification à supprimer'
    });
    
  } catch (error) {
    console.error('[API][Captcha][Delete] Erreur:', error);
    return NextResponse.json({
      error: 'Erreur lors de la suppression de la notification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}
