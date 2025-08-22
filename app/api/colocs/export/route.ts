import { NextResponse } from 'next/server';
import prisma from '@/lib/prismaClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [internal, external] = await Promise.all([
      prisma.colocProfile.findMany(),
      prisma.externalColocListing.findMany({ take: 1000 }), // limite sécurité
    ]);
    return NextResponse.json({ internal, external, generatedAt: new Date().toISOString() });
  } catch (e: any) {
    console.error('[export-colocs]', e);
    return NextResponse.json({ error: 'export_failed' }, { status: 500 });
  }
}