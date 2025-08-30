import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Vérification de la base de données
    const dbStartTime = Date.now();
    let dbStatus = 'error';
    let dbResponseTime = 0;
    let dbMessage = 'Database connection failed';

    try {
      // Test de connexion à la base de données
      await prisma.$queryRaw`SELECT 1`;
      dbStatus = 'connected';
      dbResponseTime = Date.now() - dbStartTime;
      dbMessage = 'Database connection successful';
    } catch (dbError) {
      dbStatus = 'error';
      dbResponseTime = Date.now() - dbStartTime;
      dbMessage = dbError instanceof Error ? dbError.message : 'Database connection failed';
    }

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        message: dbMessage
      },
      server: {
        status: 'running',
        port: 3001,
        environment: 'development'
      }
    }, {
      status: 200
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, {
      status: 500
    });
  } finally {
    await prisma.$disconnect();
  }
}
