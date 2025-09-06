import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();
  
  try {
    // Test de connexion simple
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: true,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      responseTime
    };
  } finally {
    await prisma.$disconnect();
  }
}

export async function isDatabaseAccessible(): Promise<boolean> {
  const health = await checkDatabaseHealth();
  return health.isHealthy;
}
