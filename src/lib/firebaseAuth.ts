import { 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

// Interface pour l'utilisateur admin
interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
}

// ← ← ← ASSURE-TOI QUE TON EMAIL EST ICI ← ← ←
const AUTHORIZED_ADMIN_EMAILS = [
  'mvk512mvk@gmail.com',           // ← TON EMAIL
  'admin@beautydiscount.ma',
  'manager@beautydiscount.ma',
];

// Vérifier si l'email est autorisé comme admin
export const isAuthorizedAdmin = (email: string): boolean => {
  const isAuthorized = AUTHORIZED_ADMIN_EMAILS.includes(email.toLowerCase());
  console.log('🔐 Email check:', email, '→', isAuthorized ? '✅ AUTORISÉ' : '❌ REFUSÉ');
  return isAuthorized;
};

// Connexion admin avec Firebase + vérification email
export const signInAdmin = async (email: string, password: string): Promise<AdminUser | null> => {
  try {
    console.log('🔐 Firebase: Tentative connexion pour:', email);
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    console.log('🔐 Firebase: Connexion Firebase réussie pour:', user.email);
    
    // VÉRIFICATION CRITIQUE : Email autorisé ?
    if (!isAuthorizedAdmin(user.email || '')) {
      console.log('🔐 Firebase: EMAIL NON AUTORISÉ - Déconnexion forcée');
      await signOut(auth);
      throw new Error('Accès non autorisé - Email non administrateur');
    }
    
    console.log('🔐 Firebase: Email autorisé - Connexion acceptée');
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'Admin'
    };
  } catch (error) {
    console.error('🔐 Firebase: Erreur de connexion:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erreur de connexion inconnue');
  }
};

// Déconnexion
export const signOutAdmin = async (): Promise<void> => {
  try {
    console.log('🔐 Firebase: Déconnexion...');
    await signOut(auth);
    console.log('🔐 Firebase: Déconnexion réussie');
  } catch (error) {
    console.error('🔐 Firebase: Erreur déconnexion:', error);
    throw error;
  }
};

// Écouter les changements d'authentification avec vérification email
export const onAdminAuthStateChanged = (callback: (user: AdminUser | null) => void) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      console.log('🔐 Firebase: État changé - Utilisateur:', user.email);
      
      // Vérification de l'email autorisé
      if (isAuthorizedAdmin(user.email || '')) {
        console.log('🔐 Firebase: Email autorisé - Callback avec utilisateur');
        callback({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Admin'
        });
      } else {
        console.log('🔐 Firebase: Email NON autorisé - Callback avec null');
        // Déconnecter automatiquement si email non autorisé
        signOut(auth);
        callback(null);
      }
    } else {
      console.log('🔐 Firebase: État changé - Aucun utilisateur');
      callback(null);
    }
  });
};