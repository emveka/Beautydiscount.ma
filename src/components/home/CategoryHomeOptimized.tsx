// components/home/CategoryHomeOptimized.tsx
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour une catégorie de votre structure Firebase
 */
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  mainImage?: string;
  description: string;
  title: string;
  subcategories?: string[];
}

/**
 * Props du composant
 */
interface CategoryHomeOptimizedProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  titleColor?: string;
  maxCategories?: number;
}

/**
 * CategoryHome optimisée pour votre structure Firebase existante
 * Plus rapide car ne compte pas les produits en temps réel
 */
const CategoryHomeOptimized: React.FC<CategoryHomeOptimizedProps> = ({
  title = "Découvrez nos catégories",
  subtitle = "Trouvez exactement ce que vous cherchez",
  backgroundColor = 'bg-white',
  titleColor = 'text-gray-900',
  maxCategories = 6
}) => {

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère les catégories principales depuis Firebase
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Récupérer toutes les catégories
        const categoriesRef = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesRef);
        
        const categoriesData: Category[] = [];
        
        categoriesSnapshot.forEach((doc) => {
          const data = doc.data();
          categoriesData.push({
            id: doc.id,
            name: data.name || '',
            slug: data.slug || '',
            imageUrl: data.imageUrl || data.mainImage || null, // Récupérer depuis Firebase
            mainImage: data.mainImage || null,
            description: data.shortSEOdescription || '',
            title: data.title || '',
            subcategories: data.subcategories || []
          });
        });
        
        // Trier par nom et limiter
        categoriesData.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(categoriesData.slice(0, maxCategories));
        
        console.log('Catégories chargées:', categoriesData.length);
        
      } catch (err) {
        console.error('Erreur lors du chargement des catégories:', err);
        setError('Erreur lors du chargement des catégories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [maxCategories]);

  // État de chargement
  if (loading) {
    return (
      <section className={`${backgroundColor} py-12 md:py-16`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${titleColor} mb-4`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Skeleton de chargement */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
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
      <section className={`${backgroundColor} py-12 md:py-16`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${titleColor} mb-4`}>
              {title}
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Si aucune catégorie
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className={`${backgroundColor} py-12 md:py-10`}>
      <div className="container mx-auto px-4">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className={`text-2xl md:text-3xl lg:text-4xl font-bold ${titleColor} mb-4`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Grille des catégories en cercles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/${category.slug}`}
              className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-105"
            >
              {/* Cercle avec image */}
              <div className="relative mb-4 overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-pink-50 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 overflow-hidden rounded-full bg-white">
                   {category.imageUrl || category.mainImage ? (
                    <Image
                      src={category.imageUrl || category.mainImage || ''}
                      alt={category.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                      quality={90}
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyatEfTaFLLv0YJyJH9WJIExanAX1F3KyiMklePcLu6r/mCa5iFNLLQu3F1klLTu3YlHjWLK7+q0dJmhL1mRKJA6iXZBJSxTvKwEU5rqK/BQR"
                    />
                  ) : (
                    // Placeholder avec icône si pas d'image Firebase
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-bold text-2xl">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay gradient au hover */}
                  
                </div>
                
                {/* Badge pour les sous-catégories */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    {category.subcategories.length}
                  </div>
                )}
              </div>

              {/* Nom de la catégorie */}
              <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 group-hover:text-pink-600 transition-colors duration-300">
                {category.name}
              </h3>
              
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryHomeOptimized;