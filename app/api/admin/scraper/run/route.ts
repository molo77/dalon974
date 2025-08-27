import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import prisma from '@/lib/prismaClient';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true';
  const running = await prisma.scraperRun.findFirst({ where: { status: 'running' }, orderBy: { startedAt: 'desc' } });
  if (running && !force) return NextResponse.json({ error: 'Déjà en cours', runId: running.id }, { status: 409 });
  if (running && force) {
    await prisma.scraperRun.update({ where: { id: running.id }, data: { status: 'aborted', finishedAt: new Date(), errorMessage: 'Abandonné par force run' } });
  }
  // Charge les settings DB pour construire l'env du scraper
  const settings = await prisma.scraperSetting.findMany();
  const settingsMap: Record<string,string> = {};
  for (const s of settings) { if (s.value) settingsMap[s.key] = s.value; }
  // Sync auto: si pas de row LBC_DATADOME mais variable process présente -> persister
  if (!settingsMap['LBC_DATADOME'] && process.env.LBC_DATADOME) {
    try {
      await prisma.scraperSetting.upsert({ where: { key: 'LBC_DATADOME' }, update: { value: process.env.LBC_DATADOME }, create: { key: 'LBC_DATADOME', value: process.env.LBC_DATADOME } });
      settingsMap['LBC_DATADOME'] = process.env.LBC_DATADOME as string;
    } catch {}
  }
  const childEnv = { ...process.env, ...settingsMap };
  
  // Crée un ScraperRun status=running
  const run = await prisma.scraperRun.create({ data: { status: 'running' } });
  
      console.log('[API][scraper][run] Démarrage du scraper avec ProtonVPN manuel');
    console.log('[API][scraper][run] Connexion manuelle à ProtonVPN au démarrage');
    console.log('[API][scraper][run] Suivez les instructions pour vous connecter à ProtonVPN');
    const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-lbc-simple.js');
  const child = spawn(process.execPath, [scriptPath], {
    env: childEnv,
    stdio: ['pipe','pipe','pipe'] // Permettre l'interaction avec stdin pour le CAPTCHA
  });
  // Sauvegarde PID enfant
  try { await prisma.scraperRun.update({ where: { id: run.id }, data: { childPid: child.pid || null } }); } catch {}
  let buffer = '';
  child.stdout.on('data', d => { buffer += d.toString(); });
  child.stderr.on('data', d => { buffer += d.toString(); });
  child.on('close', async (code) => {
    try {
      // Analyse simple des métriques
      const mCollected = buffer.match(/total annonces collectées avant coupe (\d+)/);
      const totalCollected = mCollected ? Number(mCollected[1]) : null;
      let createdCount: number|undefined, updatedCount: number|undefined, skippedRecentCount: number|undefined, cooldownHours: number|undefined;
      const jsonLine = buffer.split(/\n/).find(l=>l.startsWith('LBC_METRICS_JSON:'));
      if (jsonLine) {
        try {
          const parsed = JSON.parse(jsonLine.replace('LBC_METRICS_JSON:',''));
          createdCount = parsed.created;
          updatedCount = parsed.updated;
          skippedRecentCount = parsed.skippedRecent;
          cooldownHours = parsed.cooldownHours;
        } catch {}
      }
      await prisma.scraperRun.update({
        where: { id: run.id },
        data: {
          status: code === 0 ? 'success' : 'error',
          finishedAt: new Date(),
          totalCollected,
          createdCount,
          updatedCount,
          skippedRecentCount,
          cooldownHours,
      totalUpserts: (createdCount ?? 0) + (updatedCount ?? 0),
          rawLog: buffer.slice(-20000), // garde fin du log
          errorMessage: code === 0 ? null : `Exit code ${code}`
        }
      });
    } catch (e:any) {
      console.error('[scraperRun][close] update fail', e?.message || e);
    }
  });
  // Tick de progression toutes les 2s pendant exécution
  const progressTimer = setInterval(async () => {
    const lines = buffer.split(/\n/).slice(-300);
    let progress: number|undefined;
    let currentStep: string|undefined;
    let currentMessage: string|undefined;
    
    // Cherche dernière ligne JSON de progression
    for (let i=lines.length-1;i>=0;i--) {
      const line = lines[i];
      if (line.startsWith('LBC_PROGRESS_JSON:')) {
        try {
          const obj = JSON.parse(line.replace('LBC_PROGRESS_JSON:',''));
          
          // Nouveau format avec étapes
          if (obj.step && obj.totalSteps) {
            progress = Math.min(1, obj.step / obj.totalSteps);
            currentStep = `Étape ${obj.step}/${obj.totalSteps}`;
            currentMessage = obj.message || '';
            break;
          }
          
          // Ancien format (rétrocompatibilité)
          if (obj.phase==='list' && obj.totalPages) {
            progress = Math.min(1, obj.page/obj.totalPages * 0.3); // 30% phase listing
            currentStep = 'Collecte des annonces';
            currentMessage = `Page ${obj.page}/${obj.totalPages}`;
            break;
          } else if (obj.phase==='detail' && obj.total) {
            progress = 0.3 + Math.min(1, obj.index/obj.total) * 0.7; // 70% phase détails
            currentStep = 'Récupération des détails';
            currentMessage = `Annonce ${obj.index}/${obj.total}`;
            break;
          }
        } catch {}
      }
    }
    
    if (progress !== undefined) {
      try { 
        await prisma.scraperRun.update({ 
          where: { id: run.id }, 
          data: { 
            progress,
            currentStep: currentStep || undefined,
            currentMessage: currentMessage || undefined
          } 
        }); 
      } catch {}
    }
  }, 2000);
  child.on('exit', ()=>{ clearInterval(progressTimer); });
  return NextResponse.json({ runId: run.id });
}

export async function DELETE() {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const running = await prisma.scraperRun.findFirst({ where: { status: 'running' }, orderBy: { startedAt: 'desc' } });
  if (!running) return NextResponse.json({ message: 'Aucun run actif' });
  const pid = running.childPid;
  let killed = false;
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
      killed = true;
    } catch {}
  }
  await prisma.scraperRun.update({ where: { id: running.id }, data: { status: 'aborted', finishedAt: new Date(), errorMessage: 'Annulé manuellement' } });
  return NextResponse.json({ aborted: true, killed });
}

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const runs = await prisma.scraperRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
  return NextResponse.json(runs);
}
