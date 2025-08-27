import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/authOptions';
import prisma from '@/lib/prismaClient';

const ALLOWED_KEYS = [
  'LBC_SEARCH_URL','LBC_BROWSER_HEADLESS','LBC_MAX','LBC_FETCH_DETAILS','LBC_DETAIL_LIMIT',
  'LBC_DETAIL_SLEEP','LBC_PAGES','LBC_VERBOSE_LIST','LBC_EXPORT_JSON','LBC_NO_DB',
  'LBC_UPDATE_COOLDOWN_HOURS','LBC_EXTRA_SLEEP','LBC_COOKIES','LBC_DATADOME','DATADOME_TOKEN','LBC_DEBUG'
];

export async function GET() {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const rows = await prisma.scraperSetting.findMany({ orderBy: { key: 'asc' } });
  const map: Record<string,string|null> = {};
  for (const r of rows) map[r.key] = r.value ?? null;
  return NextResponse.json(map);
}

export async function POST(req: Request) {
  const session: any = await getServerSession(authOptions as any);
  if ((session?.user as any)?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json().catch(()=>({}));
  if (typeof body !== 'object' || !body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.includes(k));
  for (const [k,v] of entries) {
  await prisma.scraperSetting.upsert({
      where: { key: k },
      update: { value: v == null ? null : String(v) },
      create: { key: k, value: v == null ? null : String(v) }
    });
  }
  return NextResponse.json({ updated: entries.map(e=>e[0]) });
}
