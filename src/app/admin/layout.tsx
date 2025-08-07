'use client'
import { usePathname } from 'next/navigation';
import FirebaseAuthGuard from '@/components/admin/FirebaseAuthGuard';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  console.log('🔐 AdminLayout (Next.js): Route demandée:', pathname);
  
  // SEULE page sans protection : login
  if (pathname === '/admin/login') {
    console.log('🔐 AdminLayout: Page login - Pas de protection');
    return <>{children}</>;
  }

  // TOUTES les autres routes admin sont STRICTEMENT protégées
  console.log('🔐 AdminLayout: Page protégée - Application FirebaseAuthGuard');
  return (
    <FirebaseAuthGuard>
      {children}
    </FirebaseAuthGuard>
  );
}