import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Vérifier si l'utilisateur est authentifié pour les routes protégées
    const isAuthenticated = !!req.nextauth.token;
    const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');
    const isMaintenanceRoute = req.nextUrl.pathname === '/maintenance';
    const isHealthRoute = req.nextUrl.pathname === '/api/health';

    // Permettre l'accès à la page de maintenance et à l'API de santé
    if (isMaintenanceRoute || isHealthRoute) {
      return NextResponse.next();
    }

    // Rediriger vers la page de maintenance si la base de données n'est pas accessible
    // (cette vérification sera faite côté client par le DatabaseGuard)
    
    // Pour les routes admin, vérifier que l'utilisateur est admin
    if (isAdminRoute) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
      
      const isAdmin = req.nextauth.token?.role === 'admin';
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permettre l'accès à la page de maintenance et à l'API de santé
        if (req.nextUrl.pathname === '/maintenance' || req.nextUrl.pathname === '/api/health') {
          return true;
        }
        
        // Pour les routes admin, vérifier que l'utilisateur est connecté et admin
        if (req.nextUrl.pathname.startsWith('/admin')) {
          return !!token && token.role === 'admin';
        }
        
        // Pour les autres routes, permettre l'accès
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
    '/maintenance',
    '/api/health'
  ],
};