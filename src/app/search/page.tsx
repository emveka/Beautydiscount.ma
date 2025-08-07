// app/search/page.tsx - VERSION CORRIGÉE avec Suspense
'use client'
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ProductCardWithCart from '@/components/products/ProductCardWithCart';
import { 
  ChevronRight, 
  Filter, 
  SlidersHorizontal,
  X,
  Search
} from 'lucide-react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
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
}

/**
 * Fonction pour calculer la similarité entre deux chaînes
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
 * 🆕 COMPOSANT PRINCIPAL qui utilise useSearchParams
 * Doit être dans Suspense pour éviter l'erreur de build
 */
const SearchContent: React.FC = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('q') || '';

  // États pour l'interface utilisateur
  const [sortBy, setSortBy] = useState('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // États pour les données Firebase
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Recherche et filtrage des produits
  const searchResults = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const term = searchQuery.toLowerCase().trim();
    const results: Array<Product & { relevanceScore: number }> = [];
    
    allProducts.forEach(product => {
      let relevanceScore = 0;
      
      // Vérifier le nom du produit
      const nameScore = calculateSimilarity(product.name, term);
      relevanceScore = Math.max(relevanceScore, nameScore);
      
      // Vérifier la marque
      const brandData = brands.find(b => b.slug === product.brand);
      const brandName = brandData ? brandData.name : product.brand;
      const brandScore = calculateSimilarity(brandName, term);
      relevanceScore = Math.max(relevanceScore, brandScore * 0.9);
      
      // Vérifier les catégories
      product.categories?.forEach(cat => {
        const categoryData = categories.find(c => c.slug === cat.category);
        const subcategoryData = subcategories.find(s => s.slug === cat.subcategory);
        
        if (categoryData) {
          const catScore = calculateSimilarity(categoryData.name, term);
          relevanceScore = Math.max(relevanceScore, catScore * 0.7);
        }
        
        if (subcategoryData) {
          const subCatScore = calculateSimilarity(subcategoryData.name, term);
          relevanceScore = Math.max(relevanceScore, subCatScore * 0.8);
        }
      });
      
      // Vérifier les mots-clés combinés
      const fullText = `${product.name} ${brandName}`.toLowerCase();
      if (fullText.includes(term)) {
        relevanceScore = Math.max(relevanceScore, 0.6);
      }
      
      if (relevanceScore > 0.2) {
        results.push({ ...product, relevanceScore });
      }
    });
    
    return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }, [searchQuery, allProducts, brands, categories, subcategories]);

  // Options de filtres générées dynamiquement
  const filterOptions = useMemo(() => {
    const productBrandSlugs = [...new Set(searchResults.map(p => p.brand))].filter(Boolean);
    const brandNames = productBrandSlugs.map(slug => {
      const brandData = brands.find(b => b.slug === slug);
      return brandData ? brandData.name : slug;
    }).sort();

    const productCategorySlugs = [...new Set(searchResults.flatMap(p => p.categories?.map(c => c.category) || []))];
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
      ]
    };
  }, [searchResults, brands, categories]);

  // Options de tri
  const sortOptions = [
    { value: 'relevance', label: 'Pertinence' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'name', label: 'Nom A-Z' },
    { value: 'newest', label: 'Nouveautés' }
  ];

  /**
   * Charge toutes les données depuis Firebase
   */
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productsSnapshot, categoriesSnapshot, subcategoriesSnapshot, brandsSnapshot] = await Promise.all([
          getDocs(query(collection(db, 'products'), limit(1000))),
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'subcategories')),
          getDocs(collection(db, 'brands'))
        ]);

        // Produits
        const productsData: Product[] = [];
        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.inStock !== false && data.name && data.slug) {
            productsData.push({
              productId: doc.id,
              imageUrl: data.mainImage || data.images?.[0] || '',
              mainImage: data.mainImage,
              brand: data.brand || '',
              name: data.name || '',
              price: data.price || 0,
              originalPrice: data.originalPrice || data.price || 0,
              discount: data.discount || 0,
              slug: data.slug || doc.id,
              inStock: data.inStock !== false,
              categories: data.categories || []
            });
          }
        });

        // Catégories
        const categoriesData: CategoryData[] = [];
        categoriesSnapshot.forEach((doc) => {
          categoriesData.push({
            id: doc.id,
            name: doc.data().name,
            slug: doc.data().slug
          });
        });

        // Sous-catégories
        const subcategoriesData: SubcategoryData[] = [];
        subcategoriesSnapshot.forEach((doc) => {
          subcategoriesData.push({
            id: doc.id,
            name: doc.data().name,
            slug: doc.data().slug,
            parentCategory: doc.data().parentCategory
          });
        });

        // Marques
        const brandsData: BrandData[] = [];
        brandsSnapshot.forEach((doc) => {
          brandsData.push({
            id: doc.id,
            name: doc.data().name,
            slug: doc.data().slug
          });
        });

        setAllProducts(productsData);
        setCategories(categoriesData);
        setSubcategories(subcategoriesData);
        setBrands(brandsData);

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  /**
   * Filtre et trie les produits selon les critères sélectionnés
   */
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...searchResults];

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

    // Trier
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'relevance':
      default:
        // Déjà trié par pertinence
        break;
    }

    return filtered;
  }, [searchResults, selectedBrands, selectedCategories, selectedPriceRange, sortBy, filterOptions.priceRanges, brands, categories]);

  // Fonction pour réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedPriceRange('');
  };

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
          <span className="text-gray-800 font-medium flex-shrink-0">
            Recherche{searchQuery && ` : "${searchQuery}"`}
          </span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
          
          {/* Sidebar Filtres - Desktop */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
                <SlidersHorizontal className="w-5 h-5 text-gray-400" />
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
            
            {/* Header de recherche */}
            <div className="bg-white rounded-lg shadow-sm p-2 md:p-4 mb-2 md:mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-rose-400 mb-1 md:mb-2">
                {searchQuery ? `Résultats pour "${searchQuery}"` : 'Recherche'}
              </h1>
              
              <p className="text-sm md:text-base text-gray-700">
                {filteredAndSortedProducts.length > 0 
                  ? `${filteredAndSortedProducts.length} produit${filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé${filteredAndSortedProducts.length > 1 ? 's' : ''}`
                  : searchQuery 
                    ? 'Aucun produit trouvé pour cette recherche'
                    : 'Effectuez une recherche pour voir les résultats'
                }
              </p>
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
                      {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé{filteredAndSortedProducts.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Sélecteur de tri */}
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

                {/* Ligne Mobile uniquement : Nombre de résultats */}
                <div className="lg:hidden">
                  <span className="text-sm text-gray-600">
                    {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé{filteredAndSortedProducts.length > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Filtres actifs */}
                {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedPriceRange) && (
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

            {/* Section Produits */}
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
                      discount={product.discount || 0}
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
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  {searchQuery ? `Aucun résultat pour "${searchQuery}"` : 'Effectuez une recherche'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery 
                    ? 'Essayez avec des mots-clés différents ou vérifiez l\'orthographe'
                    : 'Utilisez la barre de recherche pour trouver des produits'
                  }
                </p>
                {(selectedBrands.length > 0 || selectedCategories.length > 0 || selectedPriceRange) && (
                  <button
                    onClick={resetAllFilters}
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
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

/**
 * 🆕 COMPOSANT DE CHARGEMENT pour Suspense
 */
const SearchLoading = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex items-center space-x-3">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      <span className="text-gray-600">Chargement de la recherche...</span>
    </div>
  </div>
);

/**
 * 🆕 PAGE PRINCIPALE avec Suspense OBLIGATOIRE
 * Résout l'erreur: "useSearchParams() should be wrapped in a suspense boundary"
 */
const SearchPage: React.FC = () => {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchContent />
    </Suspense>
  );
};

export default SearchPage;