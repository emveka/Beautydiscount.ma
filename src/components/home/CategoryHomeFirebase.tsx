// components/home/CategoryHomeFirebase.tsx
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour une catégorie Firebase
 */
interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  description?: string;
  order?: number;
  isActive?: boolean;
  productCount?: number;
}

/**
 * Interface pour les props du composant
 */
interface CategoryHomeFirebaseProps {
  title?: string;
  subtitle?: string;
  backgroundColor?: string;
  titleColor?: string;
  maxCategories?: number;
}

/**
 * CategoryHomeFirebase - Section des catégories en cercles depuis Firebase
 * 
 * Récupère les catégories depuis Firebase et les affiche en cercles élégants
 */
const CategoryHomeFirebase: React.FC<CategoryHomeFirebaseProps> = ({
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
   * Récupère les catégories depuis Firebase
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const categoriesRef = collection(db, 'categories');
        const q = query(
          categoriesRef,
          where('isActive', '==', true),
          orderBy('order', 'asc') // Ordre d'affichage
        );
        
        const querySnapshot = await getDocs(q);
        const categoriesData: Category[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          categoriesData.push({
            id: doc.id,
            name: data.name || '',
            slug: data.slug || `/categories/${doc.id}`,
            imageUrl: data.imageUrl || data.mainImage || '',
            description: data.description || '',
            order: data.order || 0,
            isActive: data.isActive !== false,
            productCount: data.productCount || 0
          });
        });
        
        // Limiter le nombre de catégories affichées
        setCategories(categoriesData.slice(0, maxCategories));
        
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
    <section className={`${backgroundColor} py-12 md:py-16`}>
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
              href={category.slug}
              className="group flex flex-col items-center text-center transition-all duration-300 hover:scale-105"
            >
              {/* Cercle avec image */}
              <div className="relative mb-4 overflow-hidden rounded-full bg-gradient-to-br from-pink-100 to-pink-50 p-1 shadow-lg group-hover:shadow-xl transition-all duration-300">
                <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 overflow-hidden rounded-full bg-white">
                  {category.imageUrl ? (
                    <Image
                      src={category.imageUrl}
                      alt={category.name}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 80px, (max-width: 1024px) 96px, 112px"
                    />
                  ) : (
                    // Placeholder si pas d'image
                    <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                      <span className="text-pink-600 font-bold text-xl">
                        {category.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  
                  {/* Overlay gradient au hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-pink-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Badge de comptage de produits */}
                {category.productCount && category.productCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                    {category.productCount > 99 ? '99+' : category.productCount}
                  </div>
                )}
              </div>

              {/* Nom de la catégorie */}
              <h3 className="font-semibold text-gray-800 text-sm md:text-base mb-1 group-hover:text-pink-600 transition-colors duration-300">
                {category.name}
              </h3>

              {/* Description */}
              {category.description && (
                <p className="text-xs text-gray-500 leading-tight max-w-[120px] group-hover:text-gray-600 transition-colors duration-300">
                  {category.description}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* CTA supplémentaire */}
        <div className="text-center mt-12">
          <Link
            href="/categories"
            className="inline-flex items-center px-6 py-3 bg-pink-600 text-white font-medium rounded-full hover:bg-pink-700 transition-all duration-300 hover:shadow-lg group"
          >
            <span>Voir toutes les catégories</span>
            <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategoryHomeFirebase;