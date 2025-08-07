'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Home, Package, Tag, Star, ShoppingBag, Sparkles,
  ArrowLeft, LogOut, User, ChevronDown, Shield
} from 'lucide-react';

const SimpleAdminNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: pathname === '/admin' },
    { name: 'Produits', href: '/admin/products', icon: Package, current: pathname.startsWith('/admin/products') },
    { name: 'Catégories', href: '/admin/categories', icon: Tag, current: pathname.startsWith('/admin/categories') },
    { name: 'Marques', href: '/admin/brands', icon: Star, current: pathname.startsWith('/admin/brands') },
    { name: 'Commandes', href: '/admin/orders', icon: ShoppingBag, current: pathname.startsWith('/admin/orders') },
    { name: 'Conseils Beauté', href: '/admin/conseils-beaute', icon: Sparkles, current: pathname.startsWith('/admin/conseils-beaute') }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/admin/login');
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 w-full">
      {/* Container pleine largeur */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo et titre */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            <Link href="/admin" className="flex items-center space-x-2 text-xl font-bold text-pink-600">
              <span>BeautyDiscount</span>
              <div className="flex items-center space-x-1">
                <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">Admin</span>
                <div title="Système sécurisé">
                  <Shield className="w-3 h-3 text-green-600" />
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Desktop - Utilise l'espace maximum disponible */}
          <nav className="hidden lg:flex space-x-2 xl:space-x-4 flex-grow justify-center max-w-4xl mx-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 xl:px-6 py-2 rounded-lg text-sm font-medium transition-colors min-w-max ${
                    item.current ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Navigation Medium screens - Plus d'espace */}
          <nav className="hidden md:flex lg:hidden space-x-2 flex-grow justify-center max-w-2xl mx-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const shortName = item.name === 'Conseils Beauté' ? 'Blog' : 
                              item.name === 'Catégories' ? 'Catég.' :
                              item.name === 'Commandes' ? 'Orders' :
                              item.name;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-w-max ${
                    item.current ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={item.name}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs whitespace-nowrap">{shortName}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions - Partie droite */}
          <div className="flex items-center space-x-3 xl:space-x-4 flex-shrink-0">
            {/* Retour au site */}
            <Link
              href="/"
              className="hidden sm:flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Site</span>
            </Link>

            {/* Menu utilisateur */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-600" />
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-sm font-medium text-gray-900">{user?.displayName || 'Admin'}</div>
                  <div className="text-xs text-gray-500 truncate max-w-32">{user?.email}</div>
                </div>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="text-sm font-medium text-gray-900">{user?.displayName || 'Administrateur'}</p>
                    <p className="text-xs text-gray-500 break-words">{user?.email}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Shield className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600">Système sécurisé</span>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation mobile - Pleine largeur avec scroll horizontal */}
        <div className="md:hidden pb-4">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const Icon = item.icon;
              const mobileText = item.name === 'Conseils Beauté' ? 'Blog' : 
                               item.name === 'Dashboard' ? 'Home' :
                               item.name === 'Catégories' ? 'Catég' :
                               item.name === 'Commandes' ? 'Orders' :
                               item.name === 'Produits' ? 'Prod.' :
                               item.name;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 px-4 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-w-max ${
                    item.current ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{mobileText}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
      
      {/* Style pour cacher la scrollbar sur mobile */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default SimpleAdminNav;