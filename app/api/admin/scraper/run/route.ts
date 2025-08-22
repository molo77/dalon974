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
  // @ts-expect-error post-migration
  const running = await prisma.scraperRun.findFirst({ where: { status: 'running' }, orderBy: { startedAt: 'desc' } });
  if (running && !force) return NextResponse.json({ error: 'Déjà en cours', runId: running.id }, { status: 409 });
  if (running && force) {
    // @ts-expect-error post-migration
    await prisma.scraperRun.update({ where: { id: running.id }, data: { status: 'aborted', finishedAt: new Date(), errorMessage: 'Abandonné par force run' } });
  }
  // Charge les settings DB pour construire l'env du scraper
  // @ts-expect-error post-migration
  const settings = await prisma.scraperSetting.findMany();
  const settingsMap: Record<string,string> = {};
  for (const s of settings) { if (s.value) settingsMap[s.key] = s.value; }
  // Sync auto: si pas de row LBC_DATADOME mais variable process présente -> persister
  if (!settingsMap['LBC_DATADOME'] && process.env.LBC_DATADOME) {
    try {
      // @ts-expect-error post-migration
      await prisma.scraperSetting.upsert({ where: { key: 'LBC_DATADOME' }, update: { value: process.env.LBC_DATADOME }, create: { key: 'LBC_DATADOME', value: process.env.LBC_DATADOME } });
      settingsMap['LBC_DATADOME'] = process.env.LBC_DATADOME as string;
    } catch {}
  }
  const childEnv = { ...process.env, ...settingsMap };
  // Crée un ScraperRun status=running
  // @ts-expect-error modèle post-migration
  const run = await prisma.scraperRun.create({ data: { status: 'running' } });
  const scriptPath = path.join(process.cwd(), 'scripts', 'scrape-leboncoin-colocation.cjs');
  const child = spawn(process.execPath, [scriptPath], {
    env: childEnv,
    stdio: ['ignore','pipe','pipe']
  });
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
      // @ts-expect-error modèle post-migration
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
  return NextResponse.json({ runId: run.id });
}

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  // @ts-expect-error modèle post-migration
  const runs = await prisma.scraperRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
  return NextResponse.json(runs);
}
