// components/home/ProductCategoryHome.tsx
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCardWithCart from '../products/ProductCardWithCart';
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
 * ProductCategoryHome - Section d'accueil avec 6 produits depuis Firebase
 * 
 * Fonctionnalités :
 * - Récupère les produits depuis Firebase par catégorie
 * - Affiche un titre avec un lien "Voir plus" aligné à droite
 * - Grille responsive de 6 produits maximum
 * - Utilise ProductCardWithCart pour les interactions
 * - Design adaptatif mobile/desktop
 * - État de chargement et gestion d'erreurs
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
            className="flex items-center space-x-1 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors duration-200 group"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* Grille de produits responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.productId} className="flex justify-center">
              <ProductCardWithCart
                imageUrl={product.imageUrl}
                brand={product.brand}
                name={product.name}
                price={product.price}
                originalPrice={product.originalPrice}
                discount={product.discount}
                slug={product.slug}
                inStock={product.inStock}
                productId={product.productId}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductCategoryHome;