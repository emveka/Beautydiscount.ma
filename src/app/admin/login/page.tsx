// app/admin/login/page.tsx - VERSION CORRIGÉE
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  AlertCircle,
  Sparkles,
  CheckCircle
} from 'lucide-react';

const AdminLoginPage = () => {
  const router = useRouter();
  const { 
    user, 
    isAuthenticated, 
    loading, 
    initialized,
    error, 
    login, 
    clearError,
    initializeAuth
  } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiser Firebase Auth
  useEffect(() => {
    console.log('🔐 Login: Initialisation Firebase Auth...');
    const unsubscribe = initializeAuth();
    
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [initializeAuth]);

  // Rediriger si déjà connecté (après initialisation complète)
  useEffect(() => {
    if (initialized && !loading && isAuthenticated && user) {
      console.log('🔐 Login: Utilisateur déjà connecté, redirection...');
      router.replace('/admin');
    }
  }, [initialized, loading, isAuthenticated, user, router]);

  // Nettoyer les erreurs
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.trim() || !formData.password.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    clearError();
    
    try {
      console.log('🔐 Login: Tentative de connexion...');
      const success = await login(formData.email, formData.password);
      
      if (success) {
        console.log('🔐 Login: Connexion réussie, redirection...');
        // La redirection se fera automatiquement via useEffect
        router.replace('/admin');
      }
    } catch (err) {
      console.error('🔐 Login: Erreur:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Affichage pendant l'initialisation
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initialisation Firebase...</p>
        </div>
      </div>
    );
  }

  // Si déjà connecté, afficher message de redirection
  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Déjà connecté !
          </h2>
          <p className="text-gray-600 mb-4">
            Connecté en tant qu&apos;administrateur
          </p>
          <button 
            onClick={() => router.replace('/admin')}
            className="bg-pink-500 text-white px-6 py-2 rounded-lg hover:bg-pink-700 transition-colors"
          >
            Accéder au dashboard →
          </button>
        </div>
      </div>
    );
  }

  const isFormValid = formData.email.trim() && formData.password.trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        
        {/* Logo et titre */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BeautyDiscount.ma
          </h1>
          <p className="text-gray-600">
            Administration
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Connexion
            </h2>
            <p className="text-sm text-gray-600">
              Accès réservé aux administrateurs
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">Erreur de connexion</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Votre email"
                  required
                  autoComplete="email"
                  disabled={isSubmitting || loading}
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  placeholder="Votre mot de passe"
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting || loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting || loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Connexion...</span>
                </div>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;