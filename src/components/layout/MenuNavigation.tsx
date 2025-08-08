'use client'
// components/layout/MenuNavigation.tsx - Version avec menu fixe (sans Firebase)
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  subItems?: MenuItem[];
}

/**
 * Menu fixe - Plus rapide, pas de chargement Firebase
 */
const MENU_ITEMS: MenuItem[] = [
  {
    label: 'Lissages',
    href: '/lissages',
    subItems: [
      { label: 'Lissage Brésilien', href: '/lissages/lissage-bresilien' },
      { label: 'Lissage Tanin', href: '/lissages/lissage-tanin' },
      { label: 'Kits Mini Lissage', href: '/lissages/kits-mini-lissages' },
      { label: 'Botox Capillaire', href: '/lissages/botox-capillaire' },
      { label: 'Packs Lissages', href: '/lissages/pack-lissages' },
      { label: 'Lisseurs', href: '/lissages/lisseurs' }
    ]
  },
  {
    label: 'Soins Capillaires',
    href: '/soins-capillaires',
    subItems: [
      { label: 'Shampooings', href: '/soins-capillaires/shampooings' },
      { label: 'Masques Capillaires', href: '/soins-capillaires/masques' },
      { label: 'Huiles Capillaires', href: '/soins-capillaires/huiles' },
      { label: 'Sérums', href: '/soins-capillaires/serums' },
      { label: 'Sprays Protecteurs', href: '/soins-capillaires/sprays' }
    ]
  },
  {
    label: 'Parfums',
    href: '/parfums',
    subItems: [
      { label: 'Parfums Femme', href: '/parfums/femme' },
      { label: 'Parfums Homme', href: '/parfums/homme' },
      { label: 'Parfums Unisexe', href: '/parfums/unisexe' },
      { label: 'Eaux de Toilette', href: '/parfums/eau-de-toilette' },
      { label: 'Eaux de Parfum', href: '/parfums/eau-de-parfum' }
    ]
  },
  {
    label: 'Maquillage',
    href: '/maquillage',
    subItems: [
      { label: 'Fond de Teint', href: '/maquillage/fond-de-teint' },
      { label: 'Rouge à Lèvres', href: '/maquillage/rouge-a-levres' },
      { label: 'Mascara', href: '/maquillage/mascara' },
      { label: 'Fards à Paupières', href: '/maquillage/fards-paupieres' },
      { label: 'Blush', href: '/maquillage/blush' },
      { label: 'Eyeliner', href: '/maquillage/eyeliner' }
    ]
  },
  {
    label: 'Soins Visage',
    href: '/soins-visage',
    subItems: [
      { label: 'Crèmes Hydratantes', href: '/soins-visage/cremes-hydratantes' },
      { label: 'Sérums Anti-âge', href: '/soins-visage/serums-anti-age' },
      { label: 'Nettoyants', href: '/soins-visage/nettoyants' },
      { label: 'Masques Visage', href: '/soins-visage/masques' },
      { label: 'Contour des Yeux', href: '/soins-visage/contour-yeux' }
    ]
  },
  {
    label: 'Cosmétique Coréen',
    href: '/cosmetique-coreen',
    subItems: [
      { label: 'K-Beauty Routine', href: '/cosmetique-coreen/k-beauty-routine' },
      { label: 'Masques Coréens', href: '/cosmetique-coreen/masques' },
      { label: 'Sérums K-Beauty', href: '/cosmetique-coreen/serums' },
      { label: 'BB & CC Creams', href: '/cosmetique-coreen/bb-cc-creams' }
    ]
  },
  {
    label: 'Onglerie',
    href: '/onglerie',
    subItems: [
      { label: 'Vernis à Ongles', href: '/onglerie/vernis-ongles' },
      { label: 'Base & Top Coat', href: '/onglerie/base-top-coat' },
      { label: 'Soins des Ongles', href: '/onglerie/soins-ongles' },
      { label: 'Accessoires Nail Art', href: '/onglerie/accessoires-nail-art' }
    ]
  },
  {
    label: 'Accessoires',
    href: '/accessoires',
    subItems: [
      { label: 'Pinceaux Maquillage', href: '/accessoires/pinceaux-maquillage' },
      { label: 'Éponges & Blenders', href: '/accessoires/eponges-blenders' },
      { label: 'Miroirs', href: '/accessoires/miroirs' },
      { label: 'Trousses Beauté', href: '/accessoires/trousses-beaute' }
    ]
  }
];

/**
 * MenuNavigation - Version fixe sans chargement
 */
const MenuNavigation: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const handleMouseEnter = (label: string) => {
    setActiveDropdown(label);
  };

  const handleMouseLeave = () => {
    setActiveDropdown(null);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        
        {/* Menu Desktop uniquement */}
        <div className="hidden lg:flex items-center justify-between">
          
          {/* Menu principal - Catégories à gauche */}
          <div className="flex-1">
            <ul className="flex items-center">
              {MENU_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className="flex items-center px-3 lg:px-4 py-4 text-gray-700 hover:text-rose-400 font-semibold transition-colors duration-200 border-b-2 border-transparent hover:border-pink-300"
                  >
                    <span className="text-sm lg:text-base">
                      {item.label}
                    </span>
                    {item.subItems && item.subItems.length > 0 && (
                      <ChevronDown className="w-4 h-4 ml-1" />
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.subItems && item.subItems.length > 0 && activeDropdown === item.label && (
                    <div className="absolute left-0 top-full bg-white border border-gray-200 shadow-xl rounded-b-lg min-w-[500px] max-w-[600px] py-6 px-8 z-50">
                      
                      {/* Titre du dropdown */}
                      <div className="border-b border-rose-200 pb-3 mb-4">
                        <h3 className="font-bold text-rose-400 text-lg">
                          {item.label}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.subItems.length} sous-catégories disponibles
                        </p>
                      </div>

                      {/* Liste des sous-éléments en grid */}
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                        {item.subItems.map((subItem) => (
                          <Link
                            key={subItem.label}
                            href={subItem.href}
                            className="block px-3 py-2 text-sm text-gray-700 hover:text-rose-500 hover:bg-pink-50 rounded-md transition-all duration-200 font-medium"
                          >
                            • {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Liens secondaires à droite */}
          <div className="flex items-center space-x-6 flex-shrink-0">
            <Link 
              href="/promotions" 
              className="text-sm font-semibold text-rose-600 hover:text-rose-700 transition-colors duration-200 bg-red-50 px-3 py-2 rounded-md hover:bg-red-100"
            >
              🔥 Promotions
            </Link>
            <Link 
              href="/conseils-beaute" 
              className="text-sm font-semibold text-gray-600 hover:text-rose-400 transition-colors duration-200"
            >
              Conseils Beauté
            </Link>
          </div>
        </div>

      </div>
    </nav>
  );
};

export default MenuNavigation;