'use client'
// components/layout/MenuNavigation.tsx - Adapté pour petits écrans
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour les catégories Firebase
 */
interface Category {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  subcategories?: string[];
}

interface Subcategory {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  parentCategory: string;
}

interface MenuItem {
  label: string;
  href: string;
  subItems?: MenuItem[];
}

/**
 * MenuNavigation - Menu horizontal adapté pour tous les écrans
 * Fonts rétrécies sur les petits écrans pour rester sur une ligne
 */
const MenuNavigation: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Charger les données Firebase
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesSnapshot, subcategoriesSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'categories'), orderBy('name'))),
          getDocs(query(collection(db, 'subcategories'), orderBy('name')))
        ]);
        
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Subcategory[];

        // Générer le menu
        const items: MenuItem[] = [];

        categoriesData.forEach(category => {
          const categorySubcategories = subcategoriesData.filter(
            sub => sub.parentCategory === category.slug
          );

          const subItems = categorySubcategories.map(sub => ({
            label: sub.name,
            href: `/${category.slug}/${sub.slug}`
          }));

          items.push({
            label: category.name,
            href: `/${category.slug}`,
            subItems: subItems.length > 0 ? subItems : undefined
          });
        });

        // Ajouter les liens fixes
        items.push({ label: 'Promotions', href: '/promotions' });

        setMenuItems(items);
        setIsLoaded(true);
      } catch (error) {
        console.error('Erreur lors du chargement des catégories:', error);
        // Même en cas d'erreur, afficher le menu (vide)
        setIsLoaded(true);
      }
    };

    loadData();
  }, []);

  const handleMouseEnter = (label: string) => {
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  // Ne pas rendre le menu tant que les données ne sont pas chargées
  if (!isLoaded) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200 relative z-40">
        <div className="container mx-auto px-2 md:px-4">
          <div className="h-12 md:h-16"></div> {/* Espace réservé adaptatif */}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-40">
      <div className="container mx-auto px-2 sm:px-4">
        
        {/* 🎯 Menu responsive - Visible sur tous les écrans avec fonts adaptatives */}
        <div className="hidden sm:flex items-center justify-between">
          
          {/* Menu principal avec overflow horizontal si nécessaire */}
          <div className="flex-1 overflow-x-auto">
            <ul className="flex items-center whitespace-nowrap">
              {menuItems.map((item) => (
                <li
                  key={item.label}
                  className="relative flex-shrink-0"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className="flex items-center space-x-1 px-2 sm:px-3 lg:px-4 py-3 sm:py-4 text-gray-700 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200 border-b-2 border-transparent hover:border-pink-300"
                  >
                    {/* 🎯 Texte adaptatif selon la taille d'écran */}
                    <span className="font-semibold text-xs sm:text-sm lg:text-base">
                      {item.label}
                    </span>
                    {item.subItems && (
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.subItems && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 bg-white shadow-xl border border-gray-200 z-50 py-4 sm:py-6 px-4 sm:px-8 rounded-b-lg"
                         style={{ width: '400px', maxWidth: '90vw' }}>
                      
                      <h3 className="text-sm sm:text-lg font-poppins font-semibold text-pink-600 mb-3 sm:mb-4 border-b border-pink-200 pb-2">
                        {item.label}
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 sm:gap-y-2">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block py-1.5 sm:py-2 text-gray-700 hover:text-pink-600 transition-colors duration-200 text-xs sm:text-sm font-poppins font-semibold"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* 🎯 Liens secondaires - Adaptés pour petits écrans */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 ml-2 sm:ml-4">
            
            <Link 
              href="/conseils-beaute" 
              className="text-xs sm:text-sm text-gray-600 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200 whitespace-nowrap"
            >
              <span className="hidden lg:inline">Conseils Beauté</span>
              <span className="lg:hidden">Conseils</span>
            </Link>
          </div>
        </div>

        {/* 🎯 Menu ultra-compact pour très petits écrans (xs) */}
        <div className="flex sm:hidden items-center">
          <div className="w-full overflow-x-auto">
            <ul className="flex items-center space-x-1 whitespace-nowrap py-2">
              {menuItems.slice(0, 6).map((item) => (
                <li key={item.label} className="flex-shrink-0">
                  <Link
                    href={item.href}
                    className="block px-2 py-2 text-gray-700 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200 text-xs border-b-2 border-transparent hover:border-pink-300"
                  >
                    {/* Raccourcir les noms sur très petits écrans */}
                    {item.label.length > 8 ? item.label.slice(0, 8) + '.' : item.label}
                  </Link>
                </li>
              ))}
              {/* Lien "Plus" si trop d'éléments */}
              {menuItems.length > 6 && (
                <li className="flex-shrink-0">
                  <Link
                    href="/categories"
                    className="block px-2 py-2 text-gray-600 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200 text-xs"
                  >
                    Plus...
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MenuNavigation;