// components/layout/Header.tsx - Version avec menu fixe synchronisé
'use client'
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, ShoppingCart, Phone, ChevronDown, MessageCircle, X, Menu } from 'lucide-react';
import { useCartData, useCartActions } from '@/store/cartStore';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface MenuItem {
  label: string;
  href: string;
  subItems?: MenuItem[];
}

/**
 * Menu fixe identique au MenuNavigation - Plus de chargement Firebase
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
    { label: 'Lisseurs', href: '/lissages/lisseurs' },
    { label: 'Packs Lissages', href: '/lissages/pack-lissages' }
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
    { label: 'Sprays Protecteurs', href: '/soins-capillaires/sprays' },
    { label: 'Packs Capillaires', href: '/soins-capillaires/pack-capillaires' }
    ]
  },
  {
    label: 'Coloration',
    href: '/coloration',
    subItems: [
      { label: 'Poudres Décolorantes', href: '/coloration/poudres-decolorantes' },
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
    { label: 'Contour des Yeux', href: '/soins-visage/contour-yeux' },
    ]
  },
  {
    label: 'Cosmétique Coréen',
    href: '/cosmetique-coreen',
    subItems: [
      { label: 'K-Beauty Routine', href: '/cosmetique-coreen/k-beauty-routine' },
    { label: 'Masques Coréens', href: '/cosmetique-coreen/masques' },
    { label: 'Sérums K-Beauty', href: '/cosmetique-coreen/serums' },
    { label: 'BB & CC Creams', href: '/cosmetique-coreen/bb-cc-creams' },
    ]
  },
  {
    label: 'Onglerie',
    href: '/onglerie',
    subItems: [
      { label: 'Vernis à Ongles', href: '/onglerie/vernis-ongles' },
    { label: 'Base & Top Coat', href: '/onglerie/base-top-coat' },
    { label: 'Soins des Ongles', href: '/onglerie/soins-ongles' },
    { label: 'Accessoires Nail Art', href: '/onglerie/accessoires-nail-art' },
    ]
  },
  {
    label: 'Accessoires',
    href: '/accessoires',
    subItems: [
      { label: 'Appareils Electriques', href: '/accessoires/appareils-electriques' },
    { label: 'Tensiometre', href: '/accessoires/tensiometre' },
    { label: 'Miroirs', href: '/accessoires/miroirs' },
    { label: 'Trousses Beauté', href: '/accessoires/trousses-beaute' },
    { label: 'Trousses Médicales', href: '/accessoires/trousses-medicales' }
    ]
  },
];

/**
 * Interface pour les produits dans la recherche
 */
interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  slug: string;
  mainImage?: string;
  categories?: Array<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * Interface pour les catégories dans la recherche
 */
interface Category {
  id: string;
  slug: string;
  name: string;
  subcategories?: string[];
}

/**
 * Interface pour les résultats de recherche
 */
interface SearchResult {
  type: 'product' | 'category' | 'brand';
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  image?: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
}

/**
 * Fonction pour calculer la similarité entre deux chaînes (algorithme de Levenshtein simplifié)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;
  
  // Vérifier les mots communs
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(word => words2.some(w => w.includes(word) || word.includes(w)));
  
  if (commonWords.length > 0) {
    return Math.min(0.7, 0.3 + (commonWords.length / Math.max(words1.length, words2.length)) * 0.4);
  }
  
  return 0;
};

/**
 * Hook personnalisé pour la recherche intelligente
 */
const useSmartSearch = (searchTerm: string, products: Product[], categories: Category[], brands: string[]) => {
  return useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase().trim();
    
    // 1. Recherche dans les produits
    products.forEach(product => {
      let similarity = 0;
      
      // Vérifier le nom du produit
      const nameScore = calculateSimilarity(product.name, term);
      similarity = Math.max(similarity, nameScore);
      
      // Vérifier la marque
      const brandScore = calculateSimilarity(product.brand, term);
      similarity = Math.max(similarity, brandScore * 0.9);
      
      // Vérifier les mots-clés combinés
      const fullText = `${product.name} ${product.brand}`.toLowerCase();
      if (fullText.includes(term)) {
        similarity = Math.max(similarity, 0.7);
      }
      
      if (similarity > 0.3) {
        results.push({
          type: 'product',
          id: product.id,
          title: product.name,
          subtitle: product.brand,
          href: `/product/${product.slug}`,
          image: product.mainImage,
          price: product.price,
          originalPrice: product.originalPrice,
          discount: product.discount
        });
      }
    });
    
    // 2. Recherche dans les catégories
    categories.forEach(category => {
      const similarity = calculateSimilarity(category.name, term);
      if (similarity > 0.4) {
        results.push({
          type: 'category',
          id: category.id,
          title: category.name,
          subtitle: 'Catégorie',
          href: `/${category.slug}`
        });
      }
    });
    
    // 3. Recherche dans les marques
    brands.forEach(brand => {
      const similarity = calculateSimilarity(brand, term);
      if (similarity > 0.4) {
        results.push({
          type: 'brand',
          id: brand,
          title: brand,
          subtitle: 'Marque',
          href: `/marques/${brand.toLowerCase().replace(/\s+/g, '-')}`
        });
      }
    });
    
    // Trier par pertinence et limiter les résultats
    return results
      .sort((a, b) => {
        // Priorité aux correspondances exactes
        const aExact = a.title.toLowerCase().includes(term) ? 1 : 0;
        const bExact = b.title.toLowerCase().includes(term) ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;
        
        // Ensuite par type (produits d'abord)
        const typeOrder = { product: 0, category: 1, brand: 2 };
        return typeOrder[a.type] - typeOrder[b.type];
      })
      .slice(0, 8);
  }, [searchTerm, products, categories, brands]);
};

/**
 * Composant SearchBar intelligent
 */
const SearchBar: React.FC<{
  isMobile?: boolean;
  onClose?: () => void;
  className?: string;
}> = ({ isMobile = false, onClose, className = "" }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Utiliser le hook de recherche intelligente
  const searchResults = useSmartSearch(searchTerm, products, categories, brands);
  
  // Charger les données pour la recherche
  useEffect(() => {
    const loadSearchData = async () => {
      try {
        setIsLoading(true);
        
        const [productsSnapshot, categoriesSnapshot, brandsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'products'), limit(500))),
          getDocs(query(collection(db, 'categories'), orderBy('name'))),
          getDocs(query(collection(db, 'brands'), orderBy('name')))
        ]);
        
        // Produits
        const productsData = productsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Product))
          .filter(product => product.name && product.slug); // Filtrer les produits valides
        
        // Catégories
        const categoriesData = categoriesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Category[];
        
        // Marques
        const brandsData = brandsSnapshot.docs
          .map(doc => doc.data().name)
          .filter(Boolean) as string[];
        
        setProducts(productsData);
        setCategories(categoriesData);
        setBrands(brandsData);
      } catch (error) {
        console.error('Erreur lors du chargement des données de recherche:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSearchData();
  }, []);
  
  // Gérer les clics à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Gérer les touches du clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length >= 2);
  };
  
  const handleSearch = () => {
    if (searchTerm.trim()) {
      // Rediriger vers une page de résultats de recherche
      window.location.href = `/search?q=${encodeURIComponent(searchTerm.trim())}`;
    }
  };
  
  const handleResultClick = (result: SearchResult) => {
    setSearchTerm('');
    setIsOpen(false);
    onClose?.();
  };
  
  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchTerm.length >= 2 && setIsOpen(true)}
          placeholder={isMobile ? "Recherche de produits..." : "Recherche..."}
          className={`w-full px-4 py-3 pr-14 text-gray-800 bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm ${
            isMobile ? 'bg-gray-50 border border-gray-200' : ''
          }`}
          autoComplete="off"
        />
        <button 
          onClick={handleSearch}
          className={`absolute right-0 top-0 h-full px-4 bg-rose-500 text-white rounded-r-lg hover:bg-rose-600 transition-colors duration-200 flex items-center justify-center ${
            isMobile ? 'px-2.5' : ''
          }`}
        >
          <Search className={isMobile ? "w-4 h-4" : "w-5 h-5"} />
        </button>
      </div>
      
      {/* Dropdown des résultats */}
      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto ${
          isMobile ? 'rounded-t-none border-t-0' : ''
        }`}>
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
              Recherche en cours...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              <div className="px-3 py-2 border-b border-gray-100">
                <span className="text-xs font-medium text-gray-500">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} pour &quot;{searchTerm}&ldquo;
                </span>
              </div>
              
              {searchResults.map((result) => (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={() => handleResultClick(result)}
                  className="flex items-center p-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-50 last:border-b-0"
                >
                  {/* Image du produit */}
                  {result.image && (
                    <div className="flex-shrink-0 w-12 h-12 mr-3">
                      <Image
                        src={result.image}
                        alt={result.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  
                  {/* Icône pour les catégories/marques */}
                  {!result.image && (
                    <div className="flex-shrink-0 w-10 h-10 mr-3 bg-gray-100 rounded-lg flex items-center justify-center">
                      {result.type === 'category' ? (
                        <div className="w-5 h-5 bg-pink-500 rounded"></div>
                      ) : (
                        <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {result.title}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        result.type === 'product' ? 'bg-green-100 text-green-600' :
                        result.type === 'category' ? 'bg-pink-100 text-pink-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {result.type === 'product' ? 'Produit' : 
                         result.type === 'category' ? 'Catégorie' : 'Marque'}
                      </span>
                    </div>
                    
                    {result.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{result.subtitle}</p>
                    )}
                    
                    {/* Prix pour les produits */}
                    {result.type === 'product' && result.price && (
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="font-semibold text-pink-600 text-sm">
                          {result.price.toLocaleString()} DH
                        </span>
                        {result.originalPrice && result.originalPrice > result.price && (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              {result.originalPrice.toLocaleString()} DH
                            </span>
                            {result.discount && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                                -{result.discount}%
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
              
              {/* Lien vers tous les résultats */}
              <div className="p-3 border-t border-gray-100">
                <Link
                  href={`/search?q=${encodeURIComponent(searchTerm)}`}
                  onClick={() => handleResultClick({ type: 'product', id: '', title: '', href: '' })}
                  className="block text-center text-sm text-pink-600 hover:text-pink-700 font-medium"
                >
                  Voir tous les résultats pour &quot;{searchTerm}&ldquo;
                </Link>
              </div>
            </div>
          ) : searchTerm.length >= 2 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun résultat pour &ldquo;{searchTerm}&quot;</p>
              <p className="text-xs mt-1">Essayez avec des mots-clés différents</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

/**
 * Header avec menu mobile intégré + CartDrawer + SearchBar intelligente
 * MENU FIXE - Plus de chargement Firebase pour les catégories
 */
const Header: React.FC = () => {
  const [mobileServiceOpen, setMobileServiceOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // État pour éviter l'erreur d'hydratation
  const [isHydrated, setIsHydrated] = useState(false);

  // Données du panier et actions depuis Zustand
  const { itemsCount, total } = useCartData();
  const { toggleCart } = useCartActions();

  // Attendre l'hydratation avant d'afficher le badge
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Fonction pour fermer tous les dropdowns
  const closeAllDropdowns = () => {
    setMobileServiceOpen(false);
    setMobileSearchOpen(false);
    setMobileCategoriesOpen(false);
    setActiveCategory(null);
  };

  // Fonction pour ouvrir le CartDrawer
  const handleOpenCart = () => {
    closeAllDropdowns();
    toggleCart();
  };

  return (
    <header className="bg-rose-400 relative">
      <div className="container mx-auto px-4 py-2">
        {/* VERSION DESKTOP */}
        <div className="hidden md:flex items-center justify-between space-x-4">
          
          {/* Logo Desktop */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <Image
                src="/bdlogo.png"
                alt="BeautyDiscount.ma"
                width={200}
                height={50}
                className="h-14 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Barre de recherche Desktop intelligente */}
          <div className="flex-1 max-w-2xl mx-6">
            <SearchBar />
          </div>

          {/* Service Client Desktop */}
          <div className="hidden lg:flex flex-col items-center text-white text-sm flex-shrink-0">
            <div className="flex items-center space-x-1 text-xs opacity-90">
              <Phone className="w-3 h-3" />
              <span>Service Client</span>
            </div>
            <div className="font-semibold text-xs mt-1">
              0662185335 / 0771515771
            </div>
          </div>

          {/* Panier Desktop */}
          <div className="flex items-center text-white flex-shrink-0">
            <button 
              onClick={handleOpenCart}
              className="flex items-center space-x-2 hover:text-pink-200 transition-colors duration-200 group"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                {isHydrated && itemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                    {itemsCount > 99 ? '99+' : itemsCount}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-semibold text-xs">Panier</span>
                {isHydrated && total > 0 && (
                  <span className="text-xs opacity-90">
                    {total.toLocaleString()} DH
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* VERSION MOBILE */}
        <div className="md:hidden flex items-center justify-between space-x-2">
          
          {/* Menu Hamburger - Catégories */}
          <div className="flex-shrink-0">
            <button
              onClick={() => {
                setMobileCategoriesOpen(!mobileCategoriesOpen);
                setMobileSearchOpen(false);
                setMobileServiceOpen(false);
              }}
              className="p-2 text-white hover:text-pink-200 transition-colors duration-200"
            >
              {mobileCategoriesOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Logo Mobile */}
          <div className="flex-shrink-0 ml-8 ">
            <Link href="/" className="flex items-center">
              <Image
                src="/bdlogo.png"
                alt="BeautyDiscount.ma"
                width={120}
                height={35}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* Icônes mobiles */}
          <div className="flex items-center space-x-2 text-white">
            
            {/* Recherche Mobile */}
            <div className="relative">
              <button
                onClick={() => {
                  setMobileSearchOpen(!mobileSearchOpen);
                  setMobileServiceOpen(false);
                  setMobileCategoriesOpen(false);
                }}
                className="p-2 hover:text-pink-200 transition-colors duration-200"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Dropdown Recherche Mobile Intelligent */}
              {mobileSearchOpen && (
                <div className="fixed top-14 left-2 right-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800 text-sm">Rechercher</h4>
                    <button 
                      onClick={closeAllDropdowns}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <SearchBar 
                    isMobile={true} 
                    onClose={closeAllDropdowns}
                    className="mb-3"
                  />
                  
                  {/* Suggestions populaires */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Recherches populaires :</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['Lissage', 'Kératine', 'Parfum', 'Mascara'].map((term) => (
                        <button
                          key={term}
                          className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs hover:bg-pink-100 hover:text-pink-700 transition-colors duration-200"
                          onClick={() => {
                            window.location.href = `/search?q=${encodeURIComponent(term)}`;
                            closeAllDropdowns();
                          }}
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Service Client Mobile */}
            <div className="relative">
              <button
                onClick={() => {
                  setMobileServiceOpen(!mobileServiceOpen);
                  setMobileSearchOpen(false);
                  setMobileCategoriesOpen(false);
                }}
                className="p-2 hover:text-pink-200 transition-colors duration-200"
              >
                <Phone className="w-5 h-5" />
              </button>

              {/* Dropdown Service Client */}
              {mobileServiceOpen && (
                <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-3 w-56">
                  <div className="text-center mb-2 pb-2 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-sm">Service Client</h4>
                    <p className="text-xs text-gray-600 mt-0.5">Nous sommes là pour vous aider</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-green-600" />
                      </div>
                      <div>
                        <a 
                          href="tel:0662185335" 
                          className="block font-semibold text-gray-800 hover:text-green-600 text-sm"
                        >
                          06 62 18 53 35
                        </a>
                        <span className="text-xs text-gray-500">Ligne principale</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center">
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div>
                        <a 
                          href="tel:0669881999" 
                          className="block font-semibold text-gray-800 hover:text-blue-600 text-sm"
                        >
                          06 69 88 19 99
                        </a>
                        <span className="text-xs text-gray-500">Ligne secondaire</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100">
                      <a
                        href="https://wa.me/212662185335?text=Bonjour, j'ai besoin d'aide concernant BeautyDiscount.ma"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 w-full bg-green-500 text-white py-2 px-3 rounded-lg hover:bg-green-600 transition-colors duration-200"
                        onClick={closeAllDropdowns}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium">WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Panier Mobile */}
            <button 
              onClick={handleOpenCart}
              className="relative p-2 hover:text-pink-200 transition-colors duration-200 group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {isHydrated && itemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold text-[10px] animate-bounce">
                  {itemsCount > 9 ? '9+' : itemsCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MENU MOBILE - CATÉGORIES (MENU FIXE) */}
        {mobileCategoriesOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-200 z-50">
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="py-3">
                <div className="px-3 mb-3">
                  <h3 className="font-semibold text-gray-800 text-base border-b border-pink-200 pb-2">
                    Nos Catégories
                  </h3>
                </div>
                
                <ul className="space-y-0">
                  {MENU_ITEMS.map((item) => (
                    <li key={item.label}>
                      {item.subItems ? (
                        <div>
                          <button
                            onClick={() => setActiveCategory(activeCategory === item.label ? null : item.label)}
                            className="flex items-center justify-between w-full px-3 py-2.5 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 font-medium text-sm"
                          >
                            <span>{item.label}</span>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full text-[10px]">
                                {item.subItems.length}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                activeCategory === item.label ? 'rotate-180' : ''
                              }`} />
                            </div>
                          </button>

                          {activeCategory === item.label && (
                            <div className="bg-gray-50 border-t border-gray-200">
                              <div className="px-3 py-1.5 bg-pink-100 border-b border-pink-200">
                                <h4 className="text-xs font-semibold text-pink-600">
                                  {item.label}
                                </h4>
                              </div>
                              
                              <div className="py-1">
                                <Link
                                  href={item.href}
                                  className="block px-4 py-1.5 text-xs font-semibold text-pink-600 hover:bg-pink-100 transition-colors duration-200"
                                  onClick={closeAllDropdowns}
                                >
                                  Voir tout • {item.label}
                                </Link>
                                {item.subItems.map((subItem) => (
                                  <Link
                                    key={subItem.label}
                                    href={subItem.href}
                                    className="block px-4 py-1.5 text-xs text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-colors duration-200"
                                    onClick={closeAllDropdowns}
                                  >
                                    {subItem.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 font-medium text-sm"
                          onClick={closeAllDropdowns}
                        >
                          <span>{item.label}</span>
                        </Link>
                      )}
                    </li>
                  ))}
                  
                  {/* Liens supplémentaires à la fin du menu mobile */}
                  <li className="border-t border-gray-200 mt-2 pt-2">
                    <Link
                      href="/promotions"
                      className="flex items-center justify-between px-3 py-2.5 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 font-medium text-sm"
                      onClick={closeAllDropdowns}
                    >
                      <span>🔥 Promotions</span>
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/conseils-beaute"
                      className="flex items-center justify-between px-3 py-2.5 text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition-all duration-200 font-medium text-sm"
                      onClick={closeAllDropdowns}
                    >
                      <span>Conseils Beauté</span>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Overlay pour fermer les dropdowns */}
        {(mobileServiceOpen || mobileSearchOpen || mobileCategoriesOpen) && (
          <div 
            className="fixed inset-0 z-40 md:hidden" 
            onClick={closeAllDropdowns}
          ></div>
        )}
      </div>
    </header>
  );
};

export default Header;