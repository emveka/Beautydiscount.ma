// app/[category]/[subcategory]/SubcategoryPageClient.tsx - CLIENT COMPONENT CORRIGÉ COMPLET
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import ProductCardWithCart from '@/components/products/ProductCardWithCart';
import { 
  ChevronRight, 
  Filter, 
  SlidersHorizontal,
  X
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ✅ Import des types unifiés
import { 
  SerializedProduct,
  SerializedCategory, 
  SerializedSubcategory,
  CategoryItem,
  toAnalyticsProduct
} from '@/types/index';

// 🎯 Import Analytics
import { trackEcommerce } from '@/components/Analytics';

/**
 * Interface pour les marques
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
 * Props du Client Component
 */
interface SubcategoryPageClientProps {
  categorySlug: string;
  subcategorySlug: string;
  initialCategoryData: SerializedCategory | null;
  initialSubcategoryData: SerializedSubcategory | null;
}

/**
 * Schema.org JSON-LD pour sous-catégories
 */
function generateSubcategorySchema(
  category: SerializedCategory, 
  subcategory: SerializedSubcategory, 
  products: SerializedProduct[], 
  brands: BrandData[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": subcategory.name,
    "description": subcategory.shortSEOdescription,
    "url": `https://beautydiscount.ma/${category.slug}/${subcategory.slug}`,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": products.length,
      "itemListElement": products.slice(0, 20).map((product, index) => {
        const brandData = brands.find(b => b.slug === product.brand);
        return {
          "@type": "Product",
          "position": index + 1,
          "name": product.name,
          "brand": brandData?.name || product.brand,
          "image": product.mainImage,
          "offers": {
            "@type": "Offer",
            "price": product.price,
            "priceCurrency": "MAD",
            "availability": product.inStock ? "InStock" : "OutOfStock"
          }
        };
      })
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Accueil",
          "item": "https://beautydiscount.ma"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": category.name,
          "item": `https://beautydiscount.ma/${category.slug}`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": subcategory.name,
          "item": `https://beautydiscount.ma/${category.slug}/${subcategory.slug}`
        }
      ]
    }
  };
}

/**
 * Client Component principal
 */
const SubcategoryPageClient: React.FC<SubcategoryPageClientProps> = ({ 
  categorySlug, 
  subcategorySlug,
  initialCategoryData,
  initialSubcategoryData
}) => {
  // 1️⃣ États pour l'interface utilisateur
  const [sortBy, setSortBy] = useState('popularity');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // États pour les données Firebase
  const [products, setProducts] = useState<SerializedProduct[]>([]);
  const [categoryData, setCategoryData] = useState<SerializedCategory | null>(initialCategoryData);
  const [subcategoryData, setSubcategoryData] = useState<SerializedSubcategory | null>(initialSubcategoryData);
  const [brands, setBrands] = useState<BrandData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les filtres
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');

  // 2️⃣ Fonctions utilitaires
  const getBrandName = (brandSlug: string): string => {
    const brandData = brands.find(b => b.slug === brandSlug);
    return brandData ? brandData.name : brandSlug;
  };

  const handleProductClick = (product: SerializedProduct) => {
    const analyticsProduct = toAnalyticsProduct(product);
    trackEcommerce.viewItem(analyticsProduct);
  };

  const resetAllFilters = () => {
    setSelectedBrands([]);
    setSelectedPriceRange('');
  };

  // 3️⃣ useMemo (calculs dérivés) - ORDRE IMPORTANT
  const filterOptions = useMemo(() => {
    const productBrandSlugs = [...new Set(products.map(p => p.brand))].filter(Boolean);
    const brandNames = productBrandSlugs.map(slug => {
      const brandData = brands.find(b => b.slug === slug);
      return brandData ? brandData.name : slug;
    }).sort();
    
    return {
      brands: brandNames,
      priceRanges: [
        { label: 'Moins de 50 DH', min: 0, max: 50 },
        { label: '50 - 100 DH', min: 50, max: 100 },
        { label: '100 - 200 DH', min: 100, max: 200 },
        { label: '200 - 500 DH', min: 200, max: 500 },
        { label: 'Plus de 500 DH', min: 500, max: 9999 }
      ]
    };
  }, [products, brands]);

  // ✅ DÉPLACÉ ICI : Filtre et trie les produits - AVANT les useEffect qui l'utilisent
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
      default:
        break;
    }

    return filtered;
  }, [products, selectedBrands, selectedPriceRange, sortBy, filterOptions.priceRanges, brands]);

  // Options de tri
  const sortOptions = [
    { value: 'popularity', label: 'Popularité' },
    { value: 'price-asc', label: 'Prix croissant' },
    { value: 'price-desc', label: 'Prix décroissant' },
    { value: 'name', label: 'Nom A-Z' },
    { value: 'newest', label: 'Nouveautés' }
  ];

  // 4️⃣ useEffect (effets de bord) - APRÈS les useMemo
  
  // 🎯 TRACKING ANALYTICS AUTOMATIQUE : Vue sous-catégorie
  useEffect(() => {
    if (categoryData && subcategoryData && !loading && products.length > 0) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'view_item_list', {
          item_list_id: subcategoryData.slug,
          item_list_name: subcategoryData.name,
          items: products.slice(0, 10).map((product, index) => {
            const analyticsProduct = toAnalyticsProduct(product);
            const brandData = brands.find(b => b.slug === product.brand);
            
            return {
              item_id: analyticsProduct.productId,
              item_name: analyticsProduct.name,
              item_brand: brandData?.name || analyticsProduct.brand,
              item_category: categoryData.name,
              item_category2: subcategoryData.name,
              price: analyticsProduct.price,
              index: index
            };
          })
        });
      }
    }
  }, [categoryData, subcategoryData, products, brands, loading]);

  // 🔍 TRACKING ANALYTICS : Recherche/Filtres - ✅ CORRIGÉ
  useEffect(() => {
    if (categoryData && subcategoryData && !loading) {
      const activeFilters = [];
      if (selectedBrands.length > 0) activeFilters.push(...selectedBrands.map(b => `brand:${b}`));
      if (selectedPriceRange) activeFilters.push(`price:${selectedPriceRange}`);

      if (activeFilters.length > 0) {
        trackEcommerce.search(`${subcategoryData.name} ${activeFilters.join(' ')}`, filteredAndSortedProducts.length);
      }
    }
  }, [selectedBrands, selectedPriceRange, categoryData, subcategoryData, loading, filteredAndSortedProducts]);

  // Chargement des données Firebase
  useEffect(() => {
    const loadSubcategoryData = async () => {
      try {
        setLoading(true);
        setError(null);

        let category = categoryData;
        let subcategory = subcategoryData;
        
        if (!category) {
          const categoriesRef = collection(db, 'categories');
          const categoryQuery = query(categoriesRef, where('slug', '==', categorySlug));
          const categorySnapshot = await getDocs(categoryQuery);

          if (categorySnapshot.empty) {
            setError('Catégorie parente non trouvée');
            return;
          }

          const categoryDoc = categorySnapshot.docs[0];
          category = {
            id: categoryDoc.id,
            ...categoryDoc.data(),
            createdAt: categoryDoc.data().createdAt?.toDate?.()?.toISOString?.(),
            updatedAt: categoryDoc.data().updatedAt?.toDate?.()?.toISOString?.()
          } as SerializedCategory;

          setCategoryData(category);
        }

        if (!subcategory) {
          const subcategoriesRef = collection(db, 'subcategories');
          const subcategoryQuery = query(
            subcategoriesRef,
            where('slug', '==', subcategorySlug),
            where('parentCategory', '==', categorySlug)
          );
          const subcategorySnapshot = await getDocs(subcategoryQuery);

          if (subcategorySnapshot.empty) {
            setError('Sous-catégorie non trouvée');
            return;
          }

          const subcategoryDoc = subcategorySnapshot.docs[0];
          subcategory = {
            id: subcategoryDoc.id,
            ...subcategoryDoc.data(),
            createdAt: subcategoryDoc.data().createdAt?.toDate?.()?.toISOString?.(),
            updatedAt: subcategoryDoc.data().updatedAt?.toDate?.()?.toISOString?.()
          } as SerializedSubcategory;

          setSubcategoryData(subcategory);
        }

        // Charger les marques
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

        // Charger les produits de cette sous-catégorie
        const productsRef = collection(db, 'products');
        const productsQuery = query(
          productsRef,
          where('inStock', '==', true)
        );
        
        const productsSnapshot = await getDocs(productsQuery);
        const productsData: SerializedProduct[] = [];

        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          
          const matchesSubcategory = data.categories?.some((cat: CategoryItem) => {
            return cat.category === categorySlug && cat.subcategory === subcategorySlug;
          });

          if (matchesSubcategory) {
            productsData.push({
              id: doc.id,
              slug: data.slug || doc.id,
              name: data.name || '',
              brand: data.brand || '',
              categories: data.categories || [],
              price: data.price || 0,
              originalPrice: data.originalPrice || data.price || 0,
              discount: data.discount || 0,
              title: data.title,
              shortSEOdescription: data.shortSEOdescription,
              longSEOdescription: data.longSEOdescription,
              shortDescription: data.shortDescription,
              images: data.images || [],
              mainImage: data.mainImage || data.images?.[0] || '',
              inStock: data.inStock !== false,
              quantity: data.quantity,
              sku: data.sku,
              codeBarre: data.codeBarre,
              contenance: data.contenance,
              specifications: data.specifications,
              featured: data.featured,
              canonicalPath: data.canonicalPath,
              createdAt: data.createdAt?.toDate?.()?.toISOString?.(),
              updatedAt: data.updatedAt?.toDate?.()?.toISOString?.()
            });
          }
        });

        setProducts(productsData);

      } catch (err) {
        console.error('Erreur lors du chargement de la sous-catégorie:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    if (categorySlug && subcategorySlug) {
      loadSubcategoryData();
    }
  }, [categorySlug, subcategorySlug, categoryData, subcategoryData]);

  // Génération du Schema.org
  const subcategorySchema = (categoryData && subcategoryData) ? 
    generateSubcategorySchema(categoryData, subcategoryData, filteredAndSortedProducts, brands) : null;

  // 5️⃣ États de chargement et d'erreur
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

  if (!subcategoryData || !categoryData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Sous-catégorie non trouvée</h1>
          <Link 
            href={`/${categorySlug}`}
            className="text-pink-600 hover:text-pink-700 mr-4"
          >
            Retour à {categoryData?.name}
          </Link>
          <Link 
            href="/" 
            className="text-pink-600 hover:text-pink-700"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // 6️⃣ JSX - Rendu du composant
  return (
    <>
      {/* Schema.org JSON-LD */}
      {subcategorySchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(subcategorySchema) }}
        />
      )}

      <div className="bg-gray-50">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
          
          {/* Breadcrumb étendu pour sous-catégorie */}
          <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap" aria-label="Fil d'ariane">
            <Link href="/" className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0">
              Accueil
            </Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <Link 
              href={`/${categorySlug}`}
              className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0"
            >
              {categoryData.name}
            </Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            <span className="text-gray-800 font-medium flex-shrink-0">{subcategoryData.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
            
            {/* Sidebar Filtres - Desktop */}
            <div className="hidden lg:block w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 sticky top-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Filtres</h3>
                  <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                </div>

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
              
              {/* Header de la sous-catégorie */}
              <header className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-4 md:mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-rose-400 mb-1 md:mb-2">
                  {subcategoryData.name}
                </h1>
                <p className="text-sm md:text-base text-gray-700">
                  {subcategoryData.shortSEOdescription}
                </p>
              </header>
              
              {/* Container principal : Barre d'outils + Produits */}
              <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
                
                {/* Barre d'outils */}
                <div className="mb-6">
                  <div className="flex flex-col gap-3 md:gap-4">
                    
                    {/* Ligne principale */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setMobileFiltersOpen(true)}
                        className="lg:hidden flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors duration-200"
                      >
                        <Filter className="w-4 h-4" />
                        <span>Filtres</span>
                      </button>

                      <div className="hidden lg:block">
                        <span className="text-sm text-gray-600">
                          {filteredAndSortedProducts.length} produit{filteredAndSortedProducts.length > 1 ? 's' : ''} trouvé{filteredAndSortedProducts.length > 1 ? 's' : ''}
                        </span>
                      </div>

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
                    {(selectedBrands.length > 0 || selectedPriceRange) && (
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

                {/* Séparateur visuel */}
                <div className="border-t border-gray-200 mb-6"></div>

                {/* Section Produits avec tracking */}
                {filteredAndSortedProducts.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredAndSortedProducts.map((product) => (
                      <div key={product.id} className="flex justify-center">
                        <div onClick={() => handleProductClick(product)}>
                          <ProductCardWithCart
                            imageUrl={product.mainImage || ''}
                            brand={getBrandName(product.brand)}
                            name={product.name}
                            price={product.price}
                            originalPrice={product.originalPrice || product.price}
                            discount={product.discount || 0}
                            slug={product.slug}
                            inStock={product.inStock}
                            productId={product.id}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <Filter className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun produit trouvé</h3>
                    <p className="text-gray-600 mb-4">
                      Aucun produit disponible dans cette sous-catégorie pour le moment
                    </p>
                    <Link
                      href={`/${categorySlug}`}
                      className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      Voir tous les produits {categoryData.name}
                    </Link>
                  </div>
                )}
              </div>

              {/* Description détaillée de la sous-catégorie */}
              {subcategoryData.longSEOdescription && (
                <section className="mt-12 md:mt-16 bg-white rounded-lg p-4 md:p-8 border border-gray-200">
                  <div className="prose max-w-none text-gray-700 text-sm md:text-base">
                    <p>{subcategoryData.longSEOdescription}</p>
                  </div>
                </section>
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
    </>
  );
};

export default SubcategoryPageClient;