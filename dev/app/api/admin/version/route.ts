import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Vérification des permissions admin
    const session: any = await getServerSession(authOptions as any);
    if ((session?.user as any)?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fonction pour lire la version depuis package.json
    function getPackageVersion(): string {
      try {
        // Lire depuis le package.json de dev (répertoire dev)
        const packagePath = path.join(process.cwd(), 'package.json');
        const packageContent = fs.readFileSync(packagePath, 'utf8');
        const packageData = JSON.parse(packageContent);
        return packageData.version || '0.2.0';
      } catch (error) {
        console.error('[API][admin][version] Erreur lecture package.json:', error);
        return '0.2.0';
      }
    }

    // Récupération des informations de version
    const versionInfo = {
      environment: process.env.NODE_ENV || 'unknown',
      version: getPackageVersion(),
      buildTime: new Date().toLocaleString('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      nodeVersion: process.version,
      nextVersion: process.env.npm_package_dependencies_next || 'unknown',
      uptime: formatUptime(process.uptime()),
      memory: formatMemory(process.memoryUsage())
    };

    return NextResponse.json(versionInfo);
  } catch (error) {
    console.error('[API][admin][version] Erreur:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des informations de version' },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}j ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatMemory(memoryUsage: NodeJS.MemoryUsage): string {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const used = formatBytes(memoryUsage.heapUsed);
  const total = formatBytes(memoryUsage.heapTotal);
  const external = formatBytes(memoryUsage.external);

  return `${used} / ${total} (ext: ${external})`;
}
