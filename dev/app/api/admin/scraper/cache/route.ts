import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prismaClient';
import fs from 'fs';
import path from 'path';

// DELETE /api/admin/scraper/cache?annonces=1 pour aussi purger les annonces source lbc
export async function DELETE(req: Request) {
  const session: any = await auth();
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const purgeAnnonces = url.searchParams.get('annonces') === '1';
  const delRuns = await prisma.scraperRun.deleteMany({});
  let delAnnoncesCount: number | undefined;
  if (purgeAnnonces) {
  // Pas de champ "source" dans Annonce actuellement: on purge toutes les annonces
  const res = await prisma.annonce.deleteMany({});
    delAnnoncesCount = res.count;
  }
  // Efface éventuel fichier export JSON
  try { const p = path.join(process.cwd(),'lbc_output.json'); if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  return NextResponse.json({ runsDeleted: delRuns.count, annoncesDeleted: delAnnoncesCount });
}
