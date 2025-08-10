// components/home/ProductCategoryHome.tsx - Optimisé avec ProductCardWithCart + Ordre Aléatoire
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductCardWithCart from '@/components/products/ProductCardWithCart';

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
  randomize?: boolean;              // 🆕 Activer l'ordre aléatoire (par défaut: true)
}

/**
 * 🎲 Fonction pour mélanger un tableau de façon aléatoire (algorithme Fisher-Yates)
 * Cette fonction est plus performante et plus équitable que sort(() => Math.random() - 0.5)
 * 
 * @param array - Le tableau à mélanger
 * @returns Le tableau mélangé
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Copie pour ne pas modifier l'original
  
  // Algorithme de Fisher-Yates pour un mélange équitable
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Générer un index aléatoire entre 0 et i
    const randomIndex = Math.floor(Math.random() * (i + 1));
    
    // Échanger les éléments
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * ProductCategoryHome - Utilise maintenant ProductCardWithCart pour la cohérence + Ordre Aléatoire
 * 
 * ✅ Utilise le vrai composant ProductCardWithCart optimisé mobile
 * ✅ Tailles de boutons cohérentes sur tous les écrans
 * ✅ Responsive design uniforme
 * ✅ Comportement du panier identique partout
 * ✅ 🆕 Ordre aléatoire des produits pour plus de variété
 */
const ProductCategoryHome: React.FC<ProductCategoryHomeProps> = ({
  title,
  categoryLink,
  category,
  backgroundColor = 'bg-white',
  titleColor = 'text-gray-800',
  viewAllText = 'Voir plus',
  randomize = true // 🆕 Par défaut, on active l'ordre aléatoire
}) => {
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Récupère les produits depuis Firebase
   * Filtre par catégorie/sous-catégorie et limite à 6 résultats
   * 🆕 Applique un ordre aléatoire si activé
   */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Création de la requête Firebase
        const productsRef = collection(db, 'products');
        
        // Récupérer plus de produits pour avoir un meilleur pool aléatoire
        // 🎯 Augmenté de 50 à 100 pour plus de variété dans le mélange
        const q = query(
          productsRef,
          where('inStock', '==', true), // Seuls les produits en stock
          limit(100) // Plus large pour ensuite filtrer et mélanger côté client
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
        
        // 🎲 Appliquer l'ordre aléatoire AVANT de limiter à 6
        // Cela garantit qu'on sélectionne 6 produits aléatoires parmi tous ceux disponibles
        let finalProducts = productsData;
        
        if (randomize && productsData.length > 0) {
          finalProducts = shuffleArray(productsData);
          console.log(`🎲 Produits mélangés aléatoirement pour "${category}"`);
        }
        
        // Limiter à 6 produits après le mélange aléatoire
        setProducts(finalProducts.slice(0, 6));
        
        console.log(`Produits trouvés pour "${category}":`, productsData.length, `(affichés: ${Math.min(finalProducts.length, 6)})`);
        
      } catch (err) {
        console.error(`Erreur lors du chargement des produits ${category}:`, err);
        setError('Erreur lors du chargement des produits');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [category, randomize]); // 🆕 Ajouter randomize aux dépendances

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
          
          {/* Skeleton de chargement - Grille responsive optimisée */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
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
            className="flex items-center space-x-1 text-sm text-rose-500 hover:text-rose-600 font-medium transition-colors duration-200 group"
          >
            <span>{viewAllText}</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
          </Link>
        </div>

        {/* 🎯 Grille de produits avec ProductCardWithCart optimisé + Ordre Aléatoire */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.productId} className="flex justify-center">
              
              {/* 🎯 Utilisation du vrai ProductCardWithCart optimisé mobile */}
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