// components/home/ProductCategoryHome.tsx - Layout Prix Uniforme comme Promotions
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour la structure des catégories Firebase
 */
interface CategoryItem {
  category: string;
  subcategory: string;
}

/**
 * Interface pour les données d'un produit
 */
interface Product {
  productId: string;
  imageUrl: string;
  brand: string;
  name: string;
  price: number;
  originalPrice: number;
  discount: number;
  slug: string;
  inStock: boolean;
}

/**
 * Interface pour les props du composant
 */
interface ProductCategoryHomeProps {
  title: string;                    // Titre de la section (ex: "Nouveautés", "Meilleures Ventes")
  categoryLink: string;             // Lien vers la catégorie complète (ex: "/categories/nouveautes")
  category: string;                 // Nom de la catégorie Firebase (ex: "nouveautes", "meilleures-ventes")
  backgroundColor?: string;         // Couleur de fond optionnelle (par défaut: blanc)
  titleColor?: string;              // Couleur du titre optionnelle (par défaut: gray-800)
  viewAllText?: string;             // Texte du lien "Voir plus" (par défaut: "Voir plus")
}

/**
 * ProductCategoryHome - Avec layout prix identique aux promotions
 * 
 * ✅ Layout prix uniforme : items-end, text-lg, text-pink-600
 * ✅ Comportement identique à la page promotions
 * ✅ Responsive design optimisé
 */
const ProductCategoryHome: React.FC<ProductCategoryHomeProps> = ({
  title,
  categoryLink,
  category,
  backgroundColor = 'bg-white',
  titleColor = 'text-gray-800',
  viewAllText = 'Voir plus'
}) => {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère les produits depuis Firebase
   * Filtre par catégorie/sous-catégorie et limite à 6 résultats
   */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Création de la requête Firebase
        const productsRef = collection(db, 'products');
        
        // Récupérer tous les produits actifs et filtrer côté client
        // car Firebase ne peut pas filtrer dans un tableau d'objets facilement
        const q = query(
          productsRef,
          where('inStock', '==', true), // Seuls les produits en stock
          limit(50) // Plus large pour ensuite filtrer côté client
        );
        
        // Exécution de la requête
        const querySnapshot = await getDocs(q);
        const productsData: Product[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Vérifier si le produit appartient à la catégorie demandée
          const matchesCategory = data.categories?.some((cat: CategoryItem) => {
            // Chercher d'abord dans subcategory (plus spécifique)
            if (cat.subcategory === category) {
              return true;
            }
            // Puis chercher dans category (plus général)
            if (cat.category === category) {
              return true;
            }
            return false;
          });
          
          if (matchesCategory) {
            productsData.push({
              productId: doc.id,
              imageUrl: data.mainImage || data.images?.[0] || '',
              brand: data.brand || '',
              name: data.name || '',
              price: data.price || 0,
              originalPrice: data.originalPrice || data.price || 0,
              discount: data.discount || 0,
              slug: data.slug || doc.id,
              inStock: data.inStock !== false // Par défaut true
            });
          }
        });
        
        // Limiter à 6 produits après filtrage
        setProducts(productsData.slice(0, 6));
        
        console.log(`Produits trouvés pour "${category}":`, productsData.length);
        
      } catch (err) {
        console.error(`Erreur lors du chargement des produits ${category}:`, err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category]);

  // État de chargement
  if (loading) {
    return (
      <section className={`${backgroundColor} py-8 md:py-12`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor}`}>
              {title}
            </h2>
          </div>
          
          {/* Skeleton de chargement */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded-lg mb-3"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-3 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Gestion d'erreur
  if (error) {
    return (
      <section className={`${backgroundColor} py-8 md:py-12`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor}`}>
              {title}
            </h2>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Si aucun produit trouvé
  if (products.length === 0) {
    return (
      <section className={`${backgroundColor} py-8 md:py-12`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor}`}>
              {title}
            </h2>
          </div>
          
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun produit disponible dans cette catégorie pour le moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`${backgroundColor} py-8 md:py-12`}>
      <div className="container mx-auto px-4">
        
        {/* Header avec titre et lien "Voir plus" */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          
          {/* Titre principal */}
          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor}`}>
            {title}
          </h2>
          
          {/* Lien "Voir plus" - Petit et discret */}
          <Link 
            href={categoryLink}
            className="flex items-center space-x-1 text-sm text-pink-500 hover:text-pink-600 font-medium transition-colors duration-200 group"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* 🎯 Grille de produits avec cards personnalisées - Layout comme Promotions */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.productId} className="flex justify-center">
              
              {/* 🎯 ProductCard avec layout prix identique aux promotions */}
              <div className="w-full max-w-xs bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden relative group hover:shadow-md transition-all duration-200">
                
                {/* Badges de réduction et stock */}
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 space-y-1">
                  {/* Badge de réduction */}
                  {product.originalPrice > product.price && (
                    <div className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </div>
                  )}
                  {!product.inStock && (
                    <div className="bg-gray-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                      Rupture
                    </div>
                  )}
                </div>

                {/* Container de l'image */}
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative overflow-hidden aspect-square">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      quality={85}
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    />
                    
                    {/* Overlay au hover */}
                    <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
                    
                    {/* Badge de rupture de stock */}
                    {!product.inStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white font-semibold text-xs sm:text-sm">Indisponible</span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Section des détails */}
                <div className="p-2.5 sm:p-4">
                  {/* Marque du produit */}
                  <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium tracking-wide mb-0.5 sm:mb-1">
                    {product.brand}
                  </p>
                  
                  {/* Nom du produit avec lien */}
                  <Link 
                    href={`/product/${product.slug}`} 
                    className="block font-medium text-gray-800 text-xs sm:text-sm hover:text-pink-500 transition-colors duration-200 leading-4 sm:leading-5 mb-2 sm:mb-3 h-8 sm:h-10 overflow-hidden"
                  >
                    <span className="line-clamp-2">
                      {product.name}
                    </span>
                  </Link>

                  {/* 🎯 Section des prix - EXACTEMENT comme dans Promotions */}
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-end gap-1.5 sm:gap-2">
                      {/* Prix actuel - MÊME STYLE que Promotions */}
                      <span className="text-base sm:text-lg font-bold text-red-500">
                        {product.price.toLocaleString()} DH
                      </span>
                      
                      {/* Prix original barré - MÊME STYLE que Promotions */}
                      {product.originalPrice > product.price && (
                        <span className="text-xs sm:text-sm line-through text-gray-400">
                          {product.originalPrice.toLocaleString()} DH
                        </span>
                      )}
                    </div> 
                  </div>

                  {/* Boutons d'action - Version compacte */}
                  <div className="space-y-1.5 sm:space-y-2">
                    
                    {/* Bouton principal */}
                    <button
                      className={`
                        w-full py-1.5 sm:py-2.5 px-2 sm:px-3 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 relative overflow-hidden rounded-md sm:rounded-lg
                        ${product.inStock 
                          ? 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95 shadow-md hover:shadow-lg'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }
                      `}
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4M7 13h10M7 13L5.5 7M7 13l4.5 4.5m4.5-4.5L12 17.5" />
                      </svg>
                      <span className="hidden sm:inline">{product.inStock ? 'Ajouter au panier' : 'Indisponible'}</span>
                      <span className="sm:hidden">{product.inStock ? 'Panier' : 'Indispo'}</span>
                    </button>

                    {/* Bouton "Acheter maintenant" */}
                    {product.inStock && (
                      <button
                        className="w-full py-1.5 sm:py-2 px-2 sm:px-3 border border-pink-500 text-pink-500 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm hover:bg-pink-50 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-1 sm:space-x-2"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span className="hidden sm:inline">Acheter maintenant</span>
                        <span className="sm:hidden">Acheter</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS pour line-clamp */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
};

export default ProductCategoryHome;