// components/home/CategoryHomeOptimized.tsx - Version Mobile Single Line
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
 * CategoryHome optimisée pour mobile - Ligne unique avec scroll horizontal
 * 🚀 Mobile: Scroll horizontal sur une ligne
 * 🖥️ Desktop: Grille classique
 */
const CategoryHomeOptimized: React.FC<CategoryHomeOptimizedProps> = ({
  title = "Découvrez nos catégories",
  subtitle = "Trouvez exactement ce que vous cherchez",
  backgroundColor = 'bg-white',
  titleColor = 'text-rose-400',
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
      <section className={`${backgroundColor} 4 md:py-6`}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-6 md:mb-12">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor} mb-2 md:mb-4`}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* 🚀 Skeleton Mobile + Desktop */}
          <div className="block md:hidden">
            {/* Mobile: Grille 4 colonnes */}
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="hidden md:block">
            {/* Desktop: Grille classique (3 puis 6 colonnes) */}
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-gray-200 rounded-full animate-pulse mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                </div>
              ))}
            </div>
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
          <div className="text-center">
            <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor} mb-4`}>
              {title}
            </h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-pink-500 text-white rounded-full hover:bg-pink-600 transition-colors"
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
    <section className={`${backgroundColor} py-2 md:py-6`}>
      <div className="container mx-auto px-4">
        
        {/* 🚀 Header Section - Compact sur mobile */}
        <div className="text-center mb-6 md:mb-12">
          <h2 className={`text-xl md:text-2xl lg:text-3xl font-bold ${titleColor} mb-2 md:mb-4`}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 text-sm md:text-lg max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* 🚀 MOBILE: Grille 4 colonnes avec noms complets */}
        <div className="block md:hidden">
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/${category.slug}`}
                className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-105"
              >
                {/* Cercle mobile plus petit pour 4 colonnes */}
                <div className="relative mb-2 overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-pink-50 p-0.5 shadow-md group-hover:shadow-lg transition-all duration-300">
                  <div className="relative w-12 h-12 overflow-hidden rounded-full bg-white">
                     {category.imageUrl || category.mainImage ? (
                      <Image
                        src={category.imageUrl || category.mainImage || ''}
                        alt={category.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="48px"
                        quality={90}
                        priority={false}
                        placeholder="blur"
                        blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyatEfTaFLLv0YJyJH9WJIExanAX1F3KyiMklePcLu6r/mCa5iFNLLQu3F1klLTu3YlHjWLK7+q0dJmhL1mRKJA6iXZBJSxTvKwEU5rqK/BQR"
                      />
                    ) : (
                      // Placeholder avec icône si pas d'image Firebase
                      <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                        <span className="text-rose-500 font-bold text-sm">
                          {category.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Badge pour les sous-catégories - Plus petit pour 4 colonnes */}
                  {category.subcategories && category.subcategories.length > 0 && (
                    <div className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 text-[10px]">
                      {category.subcategories.length}
                    </div>
                  )}
                </div>

                {/* Nom complet de la catégorie - Plus petit pour 4 colonnes */}
                <h3 className="font-medium text-gray-800 text-[9px] leading-3 group-hover:text-rose-500 transition-colors duration-300 text-center px-0.5 min-h-[15px]">
                  {category.name}
                </h3>
                
              </Link>
            ))}
          </div>
        </div>

        {/* 🖥️ DESKTOP: Grille classique (3 puis 6 colonnes) */}
        <div className="hidden md:grid grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
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
                      <span className="text-rose-500 font-bold text-2xl">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Badge pour les sous-catégories */}
                {category.subcategories && category.subcategories.length > 0 && (
                  <div className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    {category.subcategories.length}
                  </div>
                )}
              </div>

              {/* Nom de la catégorie */}
              <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 group-hover:text-rose-500 transition-colors duration-300">
                {category.name}
              </h3>
              
            </Link>
          ))}
        </div>
      </div>

      {/* 🚀 CSS pour masquer la scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;  /* Internet Explorer 10+ */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar { 
          display: none;  /* Safari and Chrome */
        }
      `}</style>
    </section>
  );
};

export default CategoryHomeOptimized;