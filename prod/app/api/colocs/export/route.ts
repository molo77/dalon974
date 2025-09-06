import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/database/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const internal = await prisma.colocProfile.findMany();
    return NextResponse.json({ internal, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('[export-colocs]', e);
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }
}