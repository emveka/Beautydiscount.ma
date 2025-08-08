// app/promotions/page.tsx
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProductCardWithCart from '@/components/products/ProductCardWithCart';
import { 
  ChevronRight, 
  Filter, 
  SlidersHorizontal,
  X,
  Percent,
  Tag
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour les données d'un produit Firebase
 */
interface Product {
  productId: string;
  imageUrl: string;
  mainImage?: string;
  brand: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  slug: string;
  inStock: boolean;
  categories?: CategoryItem[];
  discountPercentage?: number; // Calculé dynamiquement
}

/**
 * Interface pour la structure des catégories Firebase
 */
interface CategoryItem {
  category: string;
  subcategory: string;
}

/**
 * Interface pour les données de catégorie Firebase
 */
interface CategoryData {
  id: string;
  name: string;
  slug: string;
}

/**
 * Interface pour les données de sous-catégorie Firebase
 */
interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  parentCategory: string;
}

/**
 * Interface pour les données de marque Firebase
 */
interface BrandData {
  id: string;
  name: string;
  slug: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
}

/**
 * Page Promotions - Affiche tous les produits en réduction
 */
const PromotionsPage: React.FC = () => {
  // États pour l'interface utilisateur
  const [sortBy, setSortBy] = useState('discount-desc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // États pour les données Firebase
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [selectedDiscountRange, setSelectedDiscountRange] = useState<string>('');

  // Options de filtres générées dynamiquement
  const filterOptions = useMemo(() => {
    // Récupérer les noms des marques des produits en promotion
    const productBrandSlugs = [...new Set(products.map(p => p.brand))].filter(Boolean);
    const brandNames = productBrandSlugs.map(slug => {
      const brandData = brands.find(b => b.slug === slug);
      return brandData ? brandData.name : slug;
    }).sort();

    // Récupérer les catégories des produits en promotion
    const productCategorySlugs = [...new Set(
      products.flatMap(p => p.categories?.map(cat => cat.category) || [])
    )].filter(Boolean);
    const categoryNames = productCategorySlugs.map(slug => {
      const categoryData = categories.find(c => c.slug === slug);
      return categoryData ? categoryData.name : slug;
    }).sort();
    
    return {
      brands: brandNames,
      categories: categoryNames,
      priceRanges: [
        { label: 'Moins de 50 DH', min: 0, max: 50 },
        { label: '50 - 100 DH', min: 50, max: 100 },
        { label: '100 - 200 DH', min: 100, max: 200 },
        { label: '200 - 500 DH', min: 200, max: 500 },
        { label: 'Plus de 500 DH', min: 500, max: 9999 }
      ],
      discountRanges: [
        { label: '10% - 20%', min: 10, max: 20 },
        { label: '20% - 30%', min: 20, max: 30 },
        { label: '30% - 50%', min: 30, max: 50 },
        { label: 'Plus de 50%', min: 50, max: 100 }
      ]
    };
  }, [products, categories, brands]);

  // Options de tri spécifiques aux promotions
  const sortOptions = [
    { value: 'discount-desc', label: 'Réduction décroissante' },
    { value: 'discount-asc', label: 'Réduction croissante' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'name', label: 'Nom A-Z' },
    { value: 'newest', label: 'Nouveautés' }
  ];

  /**
   * Calcule le pourcentage de réduction d'un produit
   */
  const calculateDiscountPercentage = (price: number, originalPrice: number): number => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  /**
   * Charge tous les produits en promotion depuis Firebase
   */
  useEffect(() => {
    const loadPromotionsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Charger toutes les catégories
        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        const categoriesData: CategoryData[] = [];
        categoriesSnapshot.forEach((doc) => {
          categoriesData.push({
            id: doc.id,
            ...doc.data()
          } as CategoryData);
        });
        setCategories(categoriesData);

        // 2. Charger toutes les sous-catégories
        const subcategoriesRef = collection(db, 'subcategories');
        const subcategoriesSnapshot = await getDocs(subcategoriesRef);
        const subcategoriesData: SubcategoryData[] = [];
        subcategoriesSnapshot.forEach((doc) => {
          subcategoriesData.push({
            id: doc.id,
            ...doc.data()
          } as SubcategoryData);
        });
        setSubcategories(subcategoriesData);

        // 3. Charger toutes les marques
        const brandsRef = collection(db, 'brands');
        const brandsSnapshot = await getDocs(brandsRef);
        const brandsData: BrandData[] = [];
        brandsSnapshot.forEach((doc) => {
          brandsData.push({
            id: doc.id,
            ...doc.data()
          } as BrandData);
        });
        setBrands(brandsData);

        // 4. Charger tous les produits en stock
        const productsRef = collection(db, 'products');
        const productsQuery = query(
          productsRef,
          where('inStock', '==', true)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const promotionalProducts: Product[] = [];

        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Vérifier si le produit est en promotion
          // Un produit est en promotion s'il a un originalPrice différent et supérieur au prix actuel
          const hasOriginalPrice = data.originalPrice && 
                                  typeof data.originalPrice === 'number' && 
                                  data.originalPrice > 0;
          
          const currentPrice = data.price || 0;
          const isOnSale = hasOriginalPrice && data.originalPrice > currentPrice;

          if (isOnSale) {
            const discountPercentage = calculateDiscountPercentage(currentPrice, data.originalPrice);
            
            promotionalProducts.push({
              productId: doc.id,
              imageUrl: data.mainImage || data.images?.[0] || '',
              mainImage: data.mainImage,
              brand: data.brand || '',
              name: data.name || '',
              price: currentPrice,
              originalPrice: data.originalPrice,
              discount: data.discount || discountPercentage,
              slug: data.slug || doc.id,
              inStock: data.inStock !== false,
              categories: data.categories || [],
              discountPercentage: discountPercentage
            });
          }
        });

        setProducts(promotionalProducts);

      } catch (err) {
        console.error('Erreur lors du chargement des promotions:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadPromotionsData();
  }, []);

  /**
   * Filtre et trie les produits selon les critères sélectionnés
   */
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Filtrer par marques
    if (selectedBrands.length > 0) {
      filtered = filtered.filter(product => {
        const brandData = brands.find(b => b.slug === product.brand);
        const brandName = brandData ? brandData.name : product.brand;
        return selectedBrands.includes(brandName);
      });
    }

    // Filtrer par catégories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(product =>
        product.categories?.some(cat => {
          const categoryData = categories.find(c => c.slug === cat.category);
          return categoryData && selectedCategories.includes(categoryData.name);
        })
      );
    }

    // Filtrer par prix
    if (selectedPriceRange) {
      const range = filterOptions.priceRanges.find(r => r.label === selectedPriceRange);
      if (range) {
        filtered = filtered.filter(product =>
          product.price >= range.min && product.price <= range.max
        );
      }
    }

    // Filtrer par pourcentage de réduction
    if (selectedDiscountRange) {
      const range = filterOptions.discountRanges.find(r => r.label === selectedDiscountRange);
      if (range) {
        filtered = filtered.filter(product =>
          product.discountPercentage && 
          product.discountPercentage >= range.min && 
          product.discountPercentage <= range.max
        );
      }
    }

    // Trier
    switch (sortBy) {
      case 'discount-desc':
        filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
      case 'discount-asc':
        filtered.sort((a, b) => (a.discountPercentage || 0) - (b.discountPercentage || 0));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        // Garder l'ordre par défaut (réduction décroissante)
        filtered.sort((a, b) => (b.discountPercentage || 0) - (a.discountPercentage || 0));
        break;
    }

    return filtered;
  }, [products, selectedBrands, selectedCategories, selectedPriceRange, selectedDiscountRange, sortBy, filterOptions.priceRanges, filterOptions.discountRanges, categories, brands]);

  // Fonction pour réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedPriceRange('');
    setSelectedDiscountRange('');
  };

  // Calculs pour les statistiques
  const stats = useMemo(() => {
    if (products.length === 0) return { avgDiscount: 0, maxDiscount: 0, totalSavings: 0 };

    const avgDiscount = Math.round(
      products.reduce((sum, p) => sum + (p.discountPercentage || 0), 0) / products.length
    );
    
    const maxDiscount = Math.max(...products.map(p => p.discountPercentage || 0));
    
    const totalSavings = products.reduce((sum, p) => {
      return sum + ((p.originalPrice || 0) - p.price);
    }, 0);

    return { avgDiscount, maxDiscount, totalSavings };
  }, [products]);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-8 bg-gray-200 rounded w-96 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-full max-w-2xl mb-8"></div>
            
            <div className="flex gap-6">
              <div className="hidden lg:block w-80">
                <div className="bg-white rounded-lg p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg p-4">
                      <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gestion d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link 
            href="/" 
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap">
          <Link href="/" className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0">
            Accueil
          </Link>
          <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
          <span className="text-gray-800 font-medium flex-shrink-0">Promotions</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          
          {/* Sidebar Filtres - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
              </div>

              {/* Pourcentage de réduction */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Réduction</h4>
                <div className="space-y-2">
                  {filterOptions.discountRanges.map((range) => (
                    <label key={range.label} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="discountRange"
                        className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                        checked={selectedDiscountRange === range.label}
                        onChange={() => setSelectedDiscountRange(range.label)}
                      />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Catégories */}
              {filterOptions.categories.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Catégories</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filterOptions.categories.map((category) => (
                      <label key={category} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          checked={selectedCategories.includes(category)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCategories([...selectedCategories, category]);
                            } else {
                              setSelectedCategories(selectedCategories.filter(c => c !== category));
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Marques */}
              {filterOptions.brands.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Marques</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filterOptions.brands.map((brand) => (
                      <label key={brand} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                          checked={selectedBrands.includes(brand)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBrands([...selectedBrands, brand]);
                            } else {
                              setSelectedBrands(selectedBrands.filter(b => b !== brand));
                            }
                          }}
                        />
                        <span className="text-sm text-gray-700">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Gamme de prix */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-800 mb-3">Prix</h4>
                <div className="space-y-2">
                  {filterOptions.priceRanges.map((range) => (
                    <label key={range.label} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="priceRange"
                        className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                        checked={selectedPriceRange === range.label}
                        onChange={() => setSelectedPriceRange(range.label)}
                      />
                      <span className="text-sm text-gray-700">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Bouton réinitialiser */}
              <button 
                onClick={resetAllFilters}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Réinitialiser les filtres
              </button>
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1">
            
            {/* Header des promotions */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6 text-white">
              <div className="flex items-center mb-2">
                <Tag className="w-6 h-6 md:w-8 md:h-8 mr-3" />
                <h1 className="text-2xl md:text-3xl font-bold">
                  Promotions
                </h1>
              </div>
              <p className="text-sm md:text-base text-red-100 mb-4">
                Découvrez tous nos produits en promotion avec des réductions exceptionnelles !
              </p>
              
              {/* Statistiques inline */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  <span className="font-medium">{products.length}</span> produits en promo
                </div>
                <div className="bg-white/20 rounded-lg px-3 py-2">
                  Jusqu&apos;à <span className="font-medium">{stats.maxDiscount}%</span> de réduction
                </div>
                
              </div>
            </div>
            
            {/* Barre d'outils */}
            <div className="bg-white rounded-lg shadow-sm p-3 md:p-4 mb-4 md:mb-6">
              <div className="flex flex-col gap-3 md:gap-4">
                
                {/* Ligne principale : Filtres Mobile + Nombre de résultats + Tri */}
                <div className="flex items-center justify-between">
                  {/* Bouton Filtres (Mobile uniquement) */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Filtres</span>
                  </button>

                  {/* Nombre de résultats (Desktop uniquement) */}
                  <div className="hidden lg:block">
                    <span className="text-sm text-gray-600">
                      {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} en promotion
                    </span>
                  </div>

                  {/* Sélecteur de tri - Toujours à droite */}
                  <div className="flex items-center space-x-2">
                    <span className="text-xs md:text-sm text-gray-600 hidden sm:inline">Trier par:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="text-xs md:text-sm border border-gray-300 rounded-lg px-2 md:px-3 py-1 md:py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Filtres actifs */}
                {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedPriceRange || selectedDiscountRange) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs md:text-sm font-medium text-gray-700">Filtres actifs:</span>
                      <button
                        onClick={resetAllFilters}
                        className="text-xs text-pink-600 hover:text-pink-700"
                      >
                        Effacer
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {/* Marques sélectionnées */}
                      {selectedBrands.map((brand) => (
                        <span key={brand} className="inline-flex items-center space-x-1 bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs">
                          <span>{brand}</span>
                          <button
                            onClick={() => setSelectedBrands(selectedBrands.filter(b => b !== brand))}
                            className="hover:text-pink-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {/* Catégories sélectionnées */}
                      {selectedCategories.map((category) => (
                        <span key={category} className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          <span>{category}</span>
                          <button
                            onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== category))}
                            className="hover:text-blue-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                      {/* Réduction sélectionnée */}
                      {selectedDiscountRange && (
                        <span className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
                          <span>{selectedDiscountRange}</span>
                          <button
                            onClick={() => setSelectedDiscountRange('')}
                            className="hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {/* Prix sélectionné */}
                      {selectedPriceRange && (
                        <span className="inline-flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          <span>{selectedPriceRange}</span>
                          <button
                            onClick={() => setSelectedPriceRange('')}
                            className="hover:text-green-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grille de produits */}
            {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredAndSortedProducts.map((product) => (
                  <div key={product.productId} className="flex justify-center">
                    <ProductCardWithCart
                      imageUrl={product.imageUrl}
                      brand={product.brand}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice || product.price}
                      discount={product.discountPercentage || 0}
                      slug={product.slug}
                      inStock={product.inStock}
                      productId={product.productId}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Tag className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Aucune promotion trouvée</h3>
                <p className="text-gray-600 mb-4">
                  {products.length === 0 
                    ? "Aucun produit n'est actuellement en promotion"
                    : "Essayez de modifier vos filtres pour voir plus de promotions"
                  }
                </p>
                {products.length > 0 && (
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}

            {/* Section informative sur les promotions */}
            <div className="mt-12 md:mt-16 bg-white rounded-lg p-4 md:p-8 border border-gray-200">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                  Pourquoi choisir nos promotions ?
                </h2>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  Découvrez notre sélection de produits en promotion avec des réductions exceptionnelles. 
                  Tous nos articles promotionnels bénéficient de la même qualité et du même service que nos produits à prix régulier.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Percent className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Réductions authentiques</h3>
                  <p className="text-sm text-gray-600">
                    Toutes nos promotions sont calculées sur les prix d&apos;origine réels, sans artifice.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Qualité garantie</h3>
                  <p className="text-sm text-gray-600">
                    Produits en promotion = même qualité, même garantie, même service client.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Filter className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Facile à filtrer</h3>
                  <p className="text-sm text-gray-600">
                    Utilisez nos filtres pour trouver exactement ce que vous cherchez en promotion.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Filtres Mobile */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileFiltersOpen(false)}></div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Statistiques des promotions - Mobile */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <h4 className="font-medium text-red-800 mb-3 flex items-center">
                      <Percent className="w-4 h-4 mr-2" />
                      Statistiques
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-red-700">Réduction moyenne:</span>
                        <span className="font-medium text-red-800">{stats.avgDiscount}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-700">Réduction max:</span>
                        <span className="font-medium text-red-800">{stats.maxDiscount}%</span>
                      </div>
                      
                    </div>
                  </div>

                  {/* Pourcentage de réduction - Mobile */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Réduction</h4>
                    <div className="space-y-2">
                      {filterOptions.discountRanges.map((range) => (
                        <label key={range.label} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="discountRangeMobile"
                            className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                            checked={selectedDiscountRange === range.label}
                            onChange={() => setSelectedDiscountRange(range.label)}
                          />
                          <span className="text-sm text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Catégories Mobile */}
                  {filterOptions.categories.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Catégories</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filterOptions.categories.map((category) => (
                          <label key={category} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              checked={selectedCategories.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedCategories([...selectedCategories, category]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== category));
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{category}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Marques Mobile */}
                  {filterOptions.brands.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Marques</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {filterOptions.brands.map((brand) => (
                          <label key={brand} className="flex items-center space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                              checked={selectedBrands.includes(brand)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBrands([...selectedBrands, brand]);
                                } else {
                                  setSelectedBrands(selectedBrands.filter(b => b !== brand));
                                }
                              }}
                            />
                            <span className="text-sm text-gray-700">{brand}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prix Mobile */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Prix</h4>
                    <div className="space-y-2">
                      {filterOptions.priceRanges.map((range) => (
                        <label key={range.label} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="priceRangeMobile"
                            className="w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                            checked={selectedPriceRange === range.label}
                            onChange={() => setSelectedPriceRange(range.label)}
                          />
                          <span className="text-sm text-gray-700">{range.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Boutons d'action mobile */}
                <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={resetAllFilters}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Réinitialiser
                  </button>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="flex-1 py-3 px-4 bg-pink-500 text-white rounded-lg text-sm hover:bg-pink-600 transition-colors duration-200"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionsPage;