import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log('🛡️ Middleware: Route demandée:', pathname);
  
  // Si c'est une route admin
  if (pathname.startsWith('/admin')) {
    // EXCEPTION: Toujours autoriser la page de login
    if (pathname === '/admin/login') {
      console.log('🛡️ Middleware: Page login - AUTORISÉE');
      return NextResponse.next();
    }

    // Pour toutes les autres routes admin, on laisse passer
    // La vérification auth se fera côté client avec FirebaseAuthGuard
    console.log('🛡️ Middleware: Route admin - PASSÉE au client');
    return NextResponse.next();
  }

  // Routes non-admin: laisser passer
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Exclure les fichiers statiques et API
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ]
};