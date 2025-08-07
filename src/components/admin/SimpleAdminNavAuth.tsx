'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  Home, Package, Tag, Star, ShoppingBag, Sparkles,
  ArrowLeft, LogOut, User, ChevronDown
} from 'lucide-react';

const SimpleAdminNavAuth = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: Home, current: pathname === '/admin' },
    { name: 'Produits', href: '/admin/products', icon: Package, current: pathname.startsWith('/admin/products') },
    { name: 'Catégories', href: '/admin/categories', icon: Tag, current: pathname.startsWith('/admin/categories') },
    { name: 'Marques', href: '/admin/brands', icon: Star, current: pathname.startsWith('/admin/brands') },
    { name: 'Commandes', href: '/admin/orders', icon: ShoppingBag, current: pathname.startsWith('/admin/orders') },
    { name: 'Blog Beauté', href: '/admin/conseils-beaute', icon: Sparkles, current: pathname.startsWith('/admin/conseils-beaute') }
  ];

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link href="/admin" className="flex items-center space-x-2 text-xl font-bold text-pink-600">
            <span>BeautyDiscount</span>
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">Admin</span>
          </Link>

          {/* Navigation Desktop */}
          <nav className="hidden lg:flex space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    item.current ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Retour au site */}
            <Link href="/" className="hidden sm:flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Site</span>
            </Link>

            {/* Menu admin */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-600" />
                </div>
                <span className="hidden md:inline text-sm font-medium">Admin</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">Administrateur</p>
                    <p className="text-xs text-gray-500">BeautyDiscount.ma</p>
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

        {/* Navigation Mobile */}
        <div className="lg:hidden pb-4">
          <div className="flex space-x-1 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors min-w-max ${
                    item.current ? 'bg-pink-100 text-pink-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name === 'Blog Beauté' ? 'Blog' : item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      {showUserMenu && <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />}
    </div>
  );
};

export default SimpleAdminNavAuth;
