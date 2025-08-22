import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import prisma from '@/lib/prismaClient';
import fs from 'fs';
import path from 'path';

// DELETE /api/admin/scraper/cache?annonces=1 pour aussi purger les annonces source lbc
export async function DELETE(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const url = new URL(req.url);
  const purgeAnnonces = url.searchParams.get('annonces') === '1';
  // @ts-expect-error post-migration
  const delRuns = await prisma.scraperRun.deleteMany({});
  let delAnnoncesCount: number | undefined;
  if (purgeAnnonces) {
    // @ts-expect-error post-migration
  const res = await prisma.annonce.deleteMany({ where: { source: 'lbc' } });
    delAnnoncesCount = res.count;
  }
  // Efface éventuel fichier export JSON
  try { const p = path.join(process.cwd(),'lbc_output.json'); if (fs.existsSync(p)) fs.unlinkSync(p); } catch {}
  return NextResponse.json({ runsDeleted: delRuns.count, annoncesDeleted: delAnnoncesCount });
}
