'use client'
// components/layout/MenuNavigation.tsx - Desktop seulement avec tailles dégressives
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
 * MenuNavigation - Menu horizontal DESKTOP UNIQUEMENT avec tailles dégressives
 * LE MENU MOBILE EST COMPLÈTEMENT GÉRÉ PAR LE HEADER
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
        <div className="container mx-auto px-4">
          <div className="h-16"></div> {/* Espace réservé pour éviter le saut */}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 relative z-40">
      <div className="container mx-auto px-4">
        
        {/* 🎯 Menu Desktop UNIQUEMENT - Tailles dégressives à partir de LG (1024px+) */}
        <div className="hidden lg:flex items-center justify-between">
          
          {/* Menu principal avec overflow pour écrans moyens */}
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
                    className="flex items-center space-x-1 px-3 lg:px-4 py-4 text-gray-700 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200 border-b-2 border-transparent hover:border-pink-300"
                  >
                    {/* 🎯 Tailles dégressives : petit sur écrans moyens, normal sur grands */}
                    <span className="font-semibold text-sm lg:text-base">
                      {item.label}
                    </span>
                    {item.subItems && (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Link>

                  {/* Dropdown Menu */}
                  {item.subItems && activeDropdown === item.label && (
                    <div className="absolute top-full left-0 bg-white shadow-xl border border-gray-200 z-50 py-6 px-8 rounded-b-lg"
                         style={{ width: '600px', maxWidth: '90vw' }}>
                      
                      <h3 className="text-lg font-poppins font-semibold text-pink-600 mb-4 border-b border-pink-200 pb-2">
                        {item.label}
                      </h3>

                      <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block py-2 text-gray-700 hover:text-pink-600 transition-colors duration-200 text-sm font-poppins font-semibold"
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

          {/* Liens secondaires */}
          <div className="flex items-center space-x-6">
          
            <Link 
              href="/conseils-beaute" 
              className="text-sm text-gray-600 hover:text-pink-600 font-poppins font-semibold transition-colors duration-200"
            >
              Conseils Beauté
            </Link>
          </div>
        </div>

        {/* 🚫 AUCUN MENU MOBILE - Le Header s'en charge complètement */}
      </div>
    </nav>
  );
};

export default MenuNavigation;