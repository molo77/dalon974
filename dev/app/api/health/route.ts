import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: 'not_configured',
        responseTime: 0,
        message: 'Database not configured for development'
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
  }
}
