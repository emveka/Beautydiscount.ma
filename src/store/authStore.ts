// store/authStore.ts - VERSION SIMPLIFIÉE ET CORRIGÉE
import { create } from 'zustand';
import { signInAdmin, signOutAdmin, onAdminAuthStateChanged } from '@/lib/firebaseAuth';

interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialized: boolean;  // 🆕 Nouvel état
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
  initializeAuth: () => (() => void) | undefined;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  initialized: false,  // 🆕 Initialement false
  error: null,

  // Connexion simplifiée
  login: async (email: string, password: string) => {
    console.log('🔐 Store: Tentative connexion:', email);
    
    try {
      set({ loading: true, error: null });
      
      const user = await signInAdmin(email, password);
      
      if (user) {
        console.log('🔐 Store: Connexion RÉUSSIE:', user.email);
        set({ 
          user, 
          isAuthenticated: true, 
          loading: false,
          error: null 
        });
        return true;
      } else {
        throw new Error('Connexion échouée');
      }
      
    } catch (error) {
      console.error('🔐 Store: ERREUR login:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion';
      
      set({ 
        loading: false, 
        error: errorMessage,
        user: null,
        isAuthenticated: false
      });
      
      return false;
    }
  },

  // Déconnexion simple
  logout: async () => {
    console.log('🔐 Store: Déconnexion...');
    
    try {
      await signOutAdmin();
      
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: null 
      });
      
      console.log('🔐 Store: Déconnexion réussie');
      
    } catch (error) {
      console.error('🔐 Store: Erreur déconnexion:', error);
      // Force la déconnexion locale même en cas d'erreur
      set({ 
        user: null, 
        isAuthenticated: false, 
        loading: false,
        error: null
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  // Initialisation Firebase simplifiée
  initializeAuth: () => {
    console.log('🔐 Store: Initialisation Firebase Auth...');
    
    try {
      const unsubscribe = onAdminAuthStateChanged((user) => {
        console.log('🔐 Store: État Firebase changé:', user?.email || 'null');
        
        // Marquer comme initialisé dès le premier callback
        if (!get().initialized) {
          console.log('🔐 Store: Firebase initialisé');
          set({ initialized: true });
        }
        
        if (user) {
          console.log('🔐 Store: Utilisateur connecté et autorisé');
          set({
            user,
            isAuthenticated: true,
            loading: false,
            error: null
          });
        } else {
          console.log('🔐 Store: Aucun utilisateur ou non autorisé');
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
            error: null
          });
        }
      });

      return unsubscribe;
      
    } catch (error) {
      console.error('🔐 Store: Erreur init Firebase:', error);
      set({ 
        loading: false, 
        initialized: true,
        error: 'Erreur d\'initialisation Firebase',
        user: null,
        isAuthenticated: false 
      });
      return undefined;
    }
  }
}));