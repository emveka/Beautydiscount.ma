// components/admin/FirebaseAuthGuard.tsx - VERSION SIMPLIFIÉE
'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface FirebaseAuthGuardProps {
  children: React.ReactNode;
}

const FirebaseAuthGuard: React.FC<FirebaseAuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const { user, isAuthenticated, loading, initialized, initializeAuth } = useAuthStore();
  const [redirecting, setRedirecting] = useState(false);

  // Initialiser Firebase Auth une seule fois
  useEffect(() => {
    console.log('🔐 AuthGuard: Initialisation...');
    const unsubscribe = initializeAuth();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  // Gérer la redirection après initialisation
  useEffect(() => {
    console.log('🔐 AuthGuard: État:', { 
      initialized, 
      loading, 
      isAuthenticated, 
      userEmail: user?.email,
      redirecting
    });
    
    // Attendre que Firebase soit initialisé
    if (!initialized) {
      console.log('🔐 AuthGuard: Firebase non initialisé, attente...');
      return;
    }
    
    // Attendre que le loading soit fini
    if (loading) {
      console.log('🔐 AuthGuard: Loading en cours, attente...');
      return;
    }
    
    // Vérifier l'authentification
    if (!isAuthenticated || !user) {
      console.log('🔐 AuthGuard: Non authentifié, redirection vers login');
      
      if (!redirecting) {
        setRedirecting(true);
        router.replace('/admin/login'); // Utilise replace au lieu de push
      }
      return;
    }
    
    console.log('🔐 AuthGuard: Utilisateur authentifié:', user.email);
    
  }, [initialized, loading, isAuthenticated, user, router, redirecting]);

  // Affichage pendant l'initialisation
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {!initialized ? 'Initialisation Firebase...' : 'Vérification...'}
            </h3>
            <div className="text-xs text-gray-400 grid grid-cols-2 gap-2">
              <div>Init: {initialized ? '✅' : '⏳'}</div>
              <div>Loading: {loading ? '⏳' : '✅'}</div>
              <div>Auth: {isAuthenticated ? '✅' : '❌'}</div>
              <div>User: {user ? '✅' : '❌'}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Affichage pendant la redirection
  if (!isAuthenticated || !user || redirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirection vers la connexion...</p>
        </div>
      </div>
    );
  }

  // Utilisateur authentifié - afficher le contenu
  console.log('🔐 AuthGuard: Affichage du contenu pour:', user.email);
  return <>{children}</>;
};

export default FirebaseAuthGuard;