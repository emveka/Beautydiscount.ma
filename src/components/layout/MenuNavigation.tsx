'use client'
// components/layout/MenuNavigation.tsx - Menu fixe, labels toujours sur une ligne + font qui baisse
import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  subItems?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Lissages', href: '/lissages', subItems: [
    { label: 'Lissage Brésilien', href: '/lissages/lissage-bresilien' },
    { label: 'Lissage Tanin', href: '/lissages/lissage-tanin' },
    { label: 'Kits Mini Lissage', href: '/lissages/kits-mini-lissages' },
    { label: 'Botox Capillaire', href: '/lissages/botox-capillaire' },
    { label: 'Lisseurs', href: '/lissages/lisseurs' },
    { label: 'Packs Lissages', href: '/lissages/pack-lissages' },
  ]},
  { label: 'Soins Capillaires', href: '/soins-capillaires', subItems: [
    { label: 'Shampooings', href: '/soins-capillaires/shampooings' },
    { label: 'Masques Capillaires', href: '/soins-capillaires/masques' },
    { label: 'Huiles Capillaires', href: '/soins-capillaires/huiles' },
    { label: 'Sérums', href: '/soins-capillaires/serums' },
    { label: 'Sprays Protecteurs', href: '/soins-capillaires/sprays' },
    { label: 'Packs Capillaires', href: '/soins-capillaires/pack-capillaires' },
  ]},
  { label: 'Coloration', href: '/coloration', subItems: [
    { label: 'Poudres Décolorantes', href: '/coloration/poudres-decolorantes' },

  ]},
  { label: 'Soins Visage', href: '/soins-visage', subItems: [
    { label: 'Crèmes Hydratantes', href: '/soins-visage/cremes-hydratantes' },
    { label: 'Sérums Anti-âge', href: '/soins-visage/serums-anti-age' },
    { label: 'Nettoyants', href: '/soins-visage/nettoyants' },
    { label: 'Masques Visage', href: '/soins-visage/masques' },
    { label: 'Contour des Yeux', href: '/soins-visage/contour-yeux' },
  ]},
  { label: 'Cosmétique Coréen', href: '/cosmetique-coreen', subItems: [
    { label: 'K-Beauty Routine', href: '/cosmetique-coreen/k-beauty-routine' },
    { label: 'Masques Coréens', href: '/cosmetique-coreen/masques' },
    { label: 'Sérums K-Beauty', href: '/cosmetique-coreen/serums' },
    { label: 'BB & CC Creams', href: '/cosmetique-coreen/bb-cc-creams' },
  ]},
  { label: 'Onglerie', href: '/onglerie', subItems: [
    { label: 'Vernis à Ongles', href: '/onglerie/vernis-ongles' },
    { label: 'Base & Top Coat', href: '/onglerie/base-top-coat' },
    { label: 'Soins des Ongles', href: '/onglerie/soins-ongles' },
    { label: 'Accessoires Nail Art', href: '/onglerie/accessoires-nail-art' },
  ]},
  { label: 'Accessoires', href: '/accessoires', subItems: [
    { label: 'Pinceaux Maquillage', href: '/accessoires/pinceaux-maquillage' },
    { label: 'Éponges & Blenders', href: '/accessoires/eponges-blenders' },
    { label: 'Miroirs', href: '/accessoires/miroirs' },
    { label: 'Trousses Beauté', href: '/accessoires/trousses-beaute' },
  ]},
];

const MenuNavigation: React.FC = () => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const handleMouseEnter = (label: string) => setActiveDropdown(label);
  const handleMouseLeave = () => setActiveDropdown(null);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Desktop seulement */}
        <div className="hidden lg:flex items-center justify-between">
          {/* Catégories */}
          <div className="flex-1">
            <ul className="flex items-center gap-x-3 xl:gap-x-4 2xl:gap-x-6">
              {MENU_ITEMS.map((item) => (
                <li
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(item.label)}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link
                    href={item.href}
                    className="
                      flex items-center
                      px-3 xl:px-4 2xl:px-5
                      py-3
                      font-semibold text-gray-700 hover:text-rose-400
                      border-b-2 border-transparent hover:border-rose-300
                      transition-colors duration-200
                    "
                  >
                    {/* ⬇️ Empêche toute coupure + police qui s’adapte */}
                    <span className="
                      whitespace-nowrap leading-none tracking-tight
                      text-[clamp(12px,0.95vw,16px)]
                    ">
                      {item.label}
                    </span>
                    {item.subItems?.length ? (
                      <ChevronDown className="ml-1 w-3.5 h-3.5" />
                    ) : null}
                  </Link>

                  {/* Dropdown */}
                  {item.subItems?.length && activeDropdown === item.label && (
                    <div className="
                      absolute left-0 top-full bg-white border border-gray-200 shadow-xl rounded-b-lg
                      min-w-[380px] xl:min-w-[520px] 2xl:min-w-[560px]
                      max-w-[640px] py-5 xl:py-6 px-6 xl:px-8 z-50
                    ">
                      <div className="border-b border-pink-200 pb-3 mb-4">
                        <h3 className="font-bold text-rose-400
                          text-[clamp(13px,1.05vw,18px)] leading-none tracking-tight">
                          {item.label}
                        </h3>
                        <p className="text-[12px] text-gray-500 mt-1">
                          {item.subItems.length} sous-catégories disponibles
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                        {item.subItems.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="
                              block px-2 py-2 rounded-md transition-all duration-200 font-medium
                              hover:text-rose-400 hover:bg-pink-50
                              text-[clamp(12px,0.9vw,14px)] leading-none tracking-tight
                              text-gray-700
                            "
                          >
                            • {sub.label}
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
          <div className="items-center space-x-3 xl:space-x-5 2xl:space-x-6 flex-shrink-0 hidden lg:flex">
            <Link
              href="/promotions"
              className="
                font-semibold text-red-600 hover:text-red-700
                bg-red-50 px-3 py-2 rounded-md hover:bg-red-100
                text-[clamp(11px,0.85vw,14px)] leading-none tracking-tight
              "
            >
              🔥 Promotions
            </Link>
            <Link
              href="/conseils-beaute"
              className="font-semibold text-gray-600 hover:text-rose-400
                         text-[clamp(11px,0.85vw,14px)] leading-none tracking-tight"
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
