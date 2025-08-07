// components/admin/AdminLayout.tsx - Version avec Conseils Beauté intégrés
'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3,
  Package, 
  ShoppingBag, 
  Menu as MenuIcon,
  Star,
  Users,
  Settings,
  Bell,
  X,
  Home,
  ChevronDown,
  Search,
  Plus,
  Sparkles,    // 🆕 Icône pour conseils beauté
  Edit,        // 🆕 Icône pour écriture
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
  current?: boolean;
  badge?: number;
  badgeColor?: string;
  disabled?: boolean;
  children?: Array<{
    name: string;
    href: string;
    current?: boolean;
  }>;
}

/**
 * Layout principal pour toutes les pages d'administration
 * Maintenant avec la section Conseils Beauté complètement intégrée
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    pendingOrders: 0,
    totalProducts: 0,
    totalBrands: 0,
    totalCategories: 0,
    totalArticles: 0,        // 🆕 Compteur d'articles
    draftArticles: 0,        // 🆕 Articles en brouillon
    publishedArticles: 0     // 🆕 Articles publiés
  });

  // Charger les statistiques de base pour les badges
  useEffect(() => {
    loadBasicStats();
  }, []);

  const loadBasicStats = async () => {
    try {
      // Ici vous pouvez charger les stats depuis Firebase
      // Incluant maintenant les statistiques des articles de blog
      setStats({
        pendingOrders: 3,
        totalProducts: 156,
        totalBrands: 12,
        totalCategories: 8,
        totalArticles: 25,      // 🆕 Total articles blog
        draftArticles: 4,       // 🆕 Brouillons
        publishedArticles: 21   // 🆕 Articles publiés
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  // Configuration de la navigation avec Conseils Beauté
  const navigation: NavigationItem[] = [
    {
      name: 'Tableau de bord',
      href: '/admin',
      icon: BarChart3,
      current: pathname === '/admin'
    },
    {
      name: 'Produits',
      href: '/admin/products',
      icon: Package,
      current: pathname.startsWith('/admin/products'),
      badge: stats.totalProducts,
      children: [
        { name: 'Tous les produits', href: '/admin/products', current: pathname === '/admin/products' },
        { name: 'Ajouter un produit', href: '/admin/products/new', current: pathname === '/admin/products/new' },
        { name: 'Produits vedettes', href: '/admin/products?featured=true', current: false },
        { name: 'Produits en rupture', href: '/admin/products?stock=out', current: false }
      ]
    },
    {
      name: 'Commandes',
      href: '/admin/orders',
      icon: ShoppingBag,
      current: pathname.startsWith('/admin/orders'),
      badge: stats.pendingOrders,
      badgeColor: 'bg-yellow-500 text-white',
      children: [
        { name: 'Toutes les commandes', href: '/admin/orders', current: pathname === '/admin/orders' },
        { name: 'En attente', href: '/admin/orders?status=pending', current: false },
        { name: 'Expédiées', href: '/admin/orders?status=shipped', current: false },
        { name: 'Livrées', href: '/admin/orders?status=delivered', current: false }
      ]
    },
    // 🆕 NOUVELLE SECTION - Conseils Beauté
    {
      name: 'Conseils Beauté',
      href: '/admin/conseils-beaute',
      icon: Sparkles,
      current: pathname.startsWith('/admin/conseils-beaute'),
      badge: stats.totalArticles,
      badgeColor: 'bg-purple-500 text-white',
      children: [
        { 
          name: 'Tous les articles', 
          href: '/admin/conseils-beaute', 
          current: pathname === '/admin/conseils-beaute' 
        },
        { 
          name: 'Nouvel article', 
          href: '/admin/conseils-beaute/nouveau', 
          current: pathname === '/admin/conseils-beaute/nouveau' 
        },
        { 
          name: 'Articles publiés', 
          href: '/admin/conseils-beaute?status=published', 
          current: false 
        },
        { 
          name: 'Brouillons', 
          href: '/admin/conseils-beaute?status=draft', 
          current: false 
        },
        { 
          name: 'Articles vedettes', 
          href: '/admin/conseils-beaute?featured=true', 
          current: false 
        }
      ]
    },
    {
      name: 'Catégories',
      href: '/admin/categories',
      icon: MenuIcon,
      current: pathname.startsWith('/admin/categories'),
      badge: stats.totalCategories,
      children: [
        { name: 'Toutes les catégories', href: '/admin/categories', current: pathname === '/admin/categories' },
        { name: 'Sous-catégories', href: '/admin/categories?tab=subcategories', current: false }
      ]
    },
    {
      name: 'Marques',
      href: '/admin/brands',
      icon: Star,
      current: pathname.startsWith('/admin/brands'),
      badge: stats.totalBrands
    },
    {
      name: 'Clients',
      href: '/admin/customers',
      icon: Users,
      current: pathname.startsWith('/admin/customers'),
      disabled: true
    },
    {
      name: 'Paramètres',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings'),
      disabled: true,
      children: [
        { name: 'Configuration', href: '/admin/settings/config', current: false },
        { name: 'Utilisateurs', href: '/admin/settings/users', current: false },
        { name: 'Sauvegardes', href: '/admin/settings/backups', current: false }
      ]
    }
  ];

  // Actions rapides dans la barre supérieure - avec nouvel article
  const quickActions = [
    { name: 'Nouveau produit', href: '/admin/products/new', icon: Plus },
    { name: 'Nouvel article', href: '/admin/conseils-beaute/nouveau', icon: Edit }, // 🆕
    { name: 'Voir commandes', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Accueil site', href: '/', icon: Home }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar mobile */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div 
          className="fixed inset-0 bg-black bg-opacity-50" 
          onClick={() => setSidebarOpen(false)}
        />
        
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
          {/* Header mobile */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-pink-600">BeautyDiscount</h1>
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                Admin
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Navigation mobile */}
          <nav className="p-4 space-y-1 overflow-y-auto h-full pb-20">
            {navigation.map((item) => (
              <NavigationItem 
                key={item.name} 
                item={item} 
                onItemClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:bg-white lg:border-r lg:border-gray-200 lg:shadow-sm">
        {/* Header desktop */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <Link href="/admin" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-pink-600">BeautyDiscount</h1>
            <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
              Admin
            </span>
          </Link>
        </div>
        
        {/* Navigation desktop */}
        <nav className="p-4 space-y-1 overflow-y-auto h-full pb-20">
          {navigation.map((item) => (
            <NavigationItem key={item.name} item={item} />
          ))}
        </nav>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Barre supérieure */}
        <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            {/* Gauche - Menu mobile + Breadcrumb */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 transition-colors"
              >
                <MenuIcon className="w-6 h-6" />
              </button>
              
              {/* Breadcrumb amélioré avec Conseils Beauté */}
              <nav className="hidden sm:flex" aria-label="Breadcrumb">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <Link href="/admin" className="text-gray-500 hover:text-gray-700">
                      Admin
                    </Link>
                  </li>
                  {pathname !== '/admin' && (
                    <>
                      <span className="text-gray-400">/</span>
                      <li className="text-gray-900 font-medium">
                        {getCurrentPageName(pathname)}
                      </li>
                    </>
                  )}
                </ol>
              </nav>
            </div>

            {/* Droite - Actions et notifications */}
            <div className="flex items-center space-x-3">
              {/* Barre de recherche rapide */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Recherche rapide..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent w-64"
                />
              </div>

              {/* Actions rapides - avec nouvelles actions blog */}
              <div className="hidden lg:flex items-center space-x-2">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    href={action.href}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title={action.name}
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{action.name}</span>
                  </Link>
                ))}
              </div>

              {/* Notifications avec badge pour brouillons */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
                {(stats.pendingOrders + stats.draftArticles) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {stats.pendingOrders + stats.draftArticles}
                  </span>
                )}
              </button>

              {/* Menu utilisateur */}
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-pink-600">A</span>
                  </div>
                  <ChevronDown className="w-4 h-4 hidden lg:block" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
};

/**
 * Composant individuel pour chaque élément de navigation
 * Gère l'affichage des sous-menus et des badges (inchangé mais compatible avec les nouveaux éléments)
 */
const NavigationItem: React.FC<{
  item: NavigationItem;
  onItemClick?: () => void;
}> = ({ item, onItemClick }) => {
  const [isExpanded, setIsExpanded] = useState(item.current || false);

  const handleClick = () => {
    if (item.children) {
      setIsExpanded(!isExpanded);
    }
    onItemClick?.();
  };

  if (item.disabled) {
    return (
      <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-400 cursor-not-allowed">
        <div className="flex items-center space-x-3">
          <item.icon className="w-5 h-5" />
          <span>{item.name}</span>
        </div>
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
          Bientôt
        </span>
      </div>
    );
  }

  return (
    <div>
      {/* Élément principal */}
      {item.children ? (
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            item.current
              ? 'bg-pink-100 text-pink-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            {item.badge && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                item.badgeColor || 'bg-gray-100 text-gray-800'
              }`}>
                {item.badge}
              </span>
            )}
            <ChevronDown className={`w-4 h-4 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`} />
          </div>
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onItemClick}
          className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            item.current
              ? 'bg-pink-100 text-pink-700'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center space-x-3">
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </div>
          {item.badge && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              item.badgeColor || 'bg-gray-100 text-gray-800'
            }`}>
              {item.badge}
            </span>
          )}
        </Link>
      )}

      {/* Sous-menu */}
      {item.children && isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {item.children.map((child) => (
            <Link
              key={child.name}
              href={child.href}
              onClick={onItemClick}
              className={`block px-3 py-2 text-sm rounded-lg transition-colors ${
                child.current
                  ? 'bg-pink-50 text-pink-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Utilitaire pour obtenir le nom de la page actuelle
 * Maintenant avec support pour "Conseils Beauté"
 */
const getCurrentPageName = (pathname: string): string => {
  const pathSegments = pathname.split('/').filter(Boolean);
  
  // Gestion spéciale pour les conseils beauté
  if (pathname.includes('/conseils-beaute')) {
    if (pathname.includes('/nouveau')) {
      return 'Conseils Beauté › Nouvel Article';
    }
    return 'Conseils Beauté';
  }
  
  const lastSegment = pathSegments[pathSegments.length - 1];
  
  const pageNames: Record<string, string> = {
    'products': 'Produits',
    'orders': 'Commandes',
    'categories': 'Catégories',
    'brands': 'Marques',
    'customers': 'Clients',
    'settings': 'Paramètres'
  };
  
  return pageNames[lastSegment] || 'Page';
};

export default AdminLayout;