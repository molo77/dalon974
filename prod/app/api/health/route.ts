import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/databaseHealth';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    return NextResponse.json({
      status: health.isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        status: health.isHealthy ? 'connected' : 'disconnected',
        responseTime: health.responseTime,
        error: health.error
      }
    }, {
      status: health.isHealthy ? 200 : 503
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }, {
      status: 500
    });
  }
}
