// app/product/[slug]/ProductPageClient.tsx - CLIENT COMPONENT (interactivité)
'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Shield,
  RotateCcw,
  Phone,
  Zap
} from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Import des types depuis index.ts - TYPES CORRECTS
import { 
  SerializedProduct as ProductData, // ✅ Utilise le type sérialisé approprié
  CategoryItem, 
  SimilarProduct,
  toAnalyticsProduct // ✅ Fonction utilitaire pour Analytics
} from '@/types/index';

// Import Zustand pour le panier
import { useCartActions } from '@/store/cartStore';

// 🆕 Import du tracking Analytics
import { trackEcommerce } from '@/components/Analytics';

/**
 * Props du Client Component - TYPES CORRECTS
 */
interface ProductPageClientProps {
  slug: string;
  initialProductData: ProductData | null; // ✅ Utilise SerializedProduct
}

/**
 * 🎯 NOUVEAU: Schema.org JSON-LD pour Rich Snippets
 */
function generateProductSchema(product: ProductData, slug: string) {
  const baseUrl = 'https://beautydiscount.ma';
  
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.shortDescription || product.longSEOdescription || 'Produit de beauté authentique',
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "image": product.mainImage ? [product.mainImage] : [],
    "sku": product.sku || slug,
    "mpn": product.sku || slug,
    "category": product.categories?.[0]?.category || 'Cosmétiques',
    
    // 💰 Informations de prix pour Rich Snippets
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "MAD",
      "availability": product.inStock 
        ? "https://schema.org/InStock" 
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "BeautyDiscount.ma",
        "url": baseUrl,
        "logo": `${baseUrl}/logo.png`
      },
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 jours
      "url": `${baseUrl}/product/${slug}`,
      "shippingDetails": {
        "@type": "OfferShippingDetails",
        "shippingRate": {
          "@type": "MonetaryAmount",
          "value": "0",
          "currency": "MAD"
        },
        "deliveryTime": {
          "@type": "ShippingDeliveryTime",
          "businessDays": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "opens": "24-48h"
          }
        }
      }
    },
    
    // ⭐ Avis clients (vous pouvez rendre cela dynamique)
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "15",
      "bestRating": "5",
      "worstRating": "1"
    },
    
    // 🏪 Informations sur le vendeur
    "manufacturer": {
      "@type": "Organization",
      "name": product.brand
    },
    
    // 📍 Disponibilité géographique
    "areaServed": {
      "@type": "Country",
      "name": "Maroc"
    }
  };
}

/**
 * Composant pour afficher du texte formaté avec sauts de ligne
 */
const FormattedText: React.FC<{ 
  text: string; 
  className?: string; 
}> = ({ text, className = "text-gray-700 leading-relaxed" }) => {
  if (!text) return null;
  
  return (
    <div className={`whitespace-pre-wrap break-words ${className}`}>
      {text}
    </div>
  );
};

/**
 * Page Produit Client Component - VERSION AVEC SEO OPTIMISÉ + ANALYTICS
 */
const ProductPageClient: React.FC<ProductPageClientProps> = ({ 
  slug, 
  initialProductData 
}) => {
  const router = useRouter();
  
  // Actions du panier depuis Zustand
  const { addItem, startCheckoutProcess, clearCart } = useCartActions();
  
  // États pour la galerie d'images
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  
  // États pour les interactions utilisateur
  const [quantity, setQuantity] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>('description');
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);
  
  // État pour le bouton "Acheter maintenant"
  const [isBuyingNow, setIsBuyingNow] = useState<boolean>(false);
  
  // États pour les données Firebase
  const [productData, setProductData] = useState<ProductData | null>(initialProductData);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialProductData);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge les données du produit depuis Firebase (si pas de données initiales)
   */
  useEffect(() => {
    const loadProductData = async () => {
      if (!slug || initialProductData) return; // Si on a des données initiales, pas besoin de recharger
      
      try {
        setLoading(true);
        setError(null);

        // Rechercher le produit par slug dans Firebase
        const productsRef = collection(db, 'products');
        const productQuery = query(productsRef, where('slug', '==', slug));
        const productSnapshot = await getDocs(productQuery);

        if (productSnapshot.empty) {
          setError('Produit non trouvé');
          return;
        }

        // Récupération et typage du produit
        const productDoc = productSnapshot.docs[0];
        const productData = productDoc.data();
        
        const product: ProductData = {
          id: productDoc.id,
          slug: String(productData.slug || ''),
          name: String(productData.name || ''),
          brand: String(productData.brand || ''),
          categories: Array.isArray(productData.categories) ? productData.categories : [],
          price: Number(productData.price) || 0,
          originalPrice: productData.originalPrice ? Number(productData.originalPrice) : undefined,
          discount: productData.discount ? Number(productData.discount) : undefined,
          title: productData.title ? String(productData.title) : undefined,
          shortSEOdescription: productData.shortSEOdescription ? String(productData.shortSEOdescription) : undefined,
          longSEOdescription: productData.longSEOdescription ? String(productData.longSEOdescription) : undefined,
          shortDescription: productData.shortDescription ? String(productData.shortDescription) : undefined,
          images: Array.isArray(productData.images) ? productData.images : [],
          mainImage: productData.mainImage ? String(productData.mainImage) : undefined,
          inStock: productData.inStock !== false,
          quantity: productData.quantity ? Number(productData.quantity) : undefined,
          sku: productData.sku ? String(productData.sku) : undefined,
          contenance: productData.contenance ? String(productData.contenance) : undefined,
          specifications: productData.specifications && typeof productData.specifications === 'object' 
            ? productData.specifications as Record<string, unknown> 
            : undefined,
          canonicalPath: productData.canonicalPath ? String(productData.canonicalPath) : `/product/${slug}`,
        };

        setProductData(product);

        // Charger les produits similaires
        await loadSimilarProducts(product);

      } catch (err) {
        console.error('Erreur lors du chargement du produit:', err);
        setError('Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadProductData();
  }, [slug, initialProductData]);

  // 🆕 TRACKING ANALYTICS : Vue produit automatique - VERSION CORRIGÉE
  useEffect(() => {
    if (productData && !loading) {
      // ✅ CORRECTION : Utilise la fonction utilitaire
      const analyticsProduct = toAnalyticsProduct(productData);
      trackEcommerce.viewItem(analyticsProduct);
    }
  }, [productData, loading]);

  // Charger les produits similaires dès qu'on a des données initiales ou chargées
  useEffect(() => {
    if (productData && !loading) {
      loadSimilarProducts(productData);
    }
  }, [productData, loading]);

  /**
   * Charge les produits similaires basés sur la première catégorie
   */
  const loadSimilarProducts = async (currentProduct: ProductData) => {
    try {
      if (!currentProduct.categories || currentProduct.categories.length === 0) return;

      const mainCategory = currentProduct.categories[0];
      const productsRef = collection(db, 'products');
      
      const similarQuery = query(
        productsRef,
        where('inStock', '==', true),
        limit(8)
      );
      
      const similarSnapshot = await getDocs(similarQuery);
      const similarData: SimilarProduct[] = [];

      similarSnapshot.forEach((doc) => {
        const data = doc.data();
        
        if (doc.id !== currentProduct.id) {
          const matchesCategory = data.categories?.some((cat: CategoryItem) => 
            cat.category === mainCategory.category || 
            cat.subcategory === mainCategory.subcategory
          );
          
          if (matchesCategory && similarData.length < 4) {
            similarData.push({
              id: doc.id,
              name: String(data.name || ''),
              brand: String(data.brand || ''),
              price: Number(data.price) || 0,
              mainImage: String(data.mainImage || ''),
              slug: String(data.slug || doc.id)
            });
          }
        }
      });

      setSimilarProducts(similarData);
    } catch (err) {
      console.error('Erreur lors du chargement des produits similaires:', err);
    }
  };

  /**
   * Gère les changements de quantité avec validation
   */
  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  /**
   * 🆕 TRACKING : Ajoute le produit au panier avec Analytics
   */
  const handleAddToCart = async () => {
    if (!productData || !productData.inStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      for (let i = 0; i < quantity; i++) {
        addItem({
          productId: productData.id,
          name: productData.name,
          brand: productData.brand,
          price: productData.price || 0,
          originalPrice: productData.originalPrice,
          imageUrl: productData.mainImage || (productData.images?.[0] || ''),
          slug: productData.slug,
          inStock: productData.inStock
        });
      }
      
      // 🆕 TRACKING: Événement ajout au panier - VERSION CORRIGÉE
      const analyticsProduct = toAnalyticsProduct(productData);
      trackEcommerce.addToCart(analyticsProduct, quantity);
      
      alert(`${quantity} × ${productData.name} ajouté au panier !`);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      alert('Erreur lors de l\'ajout au panier');
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * Acheter maintenant - Version isolée
   */
  const handleBuyNow = async () => {
    if (!productData || !productData.inStock || isBuyingNow) return;
    
    setIsBuyingNow(true);
    
    try {
      startCheckoutProcess();
      clearCart();
      
      await new Promise(resolve => setTimeout(resolve, 400));
      
      for (let i = 0; i < quantity; i++) {
        addItem({
          productId: productData.id,
          name: productData.name,
          brand: productData.brand,
          price: productData.price || 0,
          originalPrice: productData.originalPrice,
          imageUrl: productData.mainImage || (productData.images?.[0] || ''),
          slug: productData.slug,
          inStock: productData.inStock
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
      router.push('/checkout');
      
    } catch (error) {
      console.error('Erreur lors de l\'achat direct:', error);
      alert('Erreur lors de l\'achat. Veuillez réessayer.');
      setIsBuyingNow(false);
    }
  };

  /**
   * Obtient les images du produit avec fallback
   */
  const getProductImages = (): string[] => {
    if (!productData) return [];
    
    if (productData.images && productData.images.length > 0) {
      return productData.images;
    }
    
    if (productData.mainImage) {
      return [productData.mainImage];
    }
    
    return [];
  };

  /**
   * Calcule la réduction appliquée
   */
  const getDiscount = (): number => {
    if (!productData) return 0;
    
    if (productData.originalPrice && productData.price) {
      return productData.originalPrice - productData.price;
    }
    
    return productData.discount || 0;
  };

  // 🆕 GÉNÉRATION DU SCHEMA.ORG
  const productSchema = productData ? generateProductSchema(productData, slug) : null;

  // Rendu conditionnel - État de chargement
  if (loading) {
    return (
      <div className="bg-gray-50">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
          <div className="animate-pulse">
            <div className="h-3 md:h-4 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="lg:grid lg:grid-cols-2 lg:gap-6">
              <div>
                <div className="aspect-square bg-gray-200 rounded mb-4"></div>
                <div className="flex space-x-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-16 h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
              <div className="mt-6 lg:mt-0">
                <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-full mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rendu conditionnel - Gestion d'erreur
  if (error || !productData) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-8 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
            {error || 'Produit non trouvé'}
          </h1>
          <p className="text-gray-600 mb-6">
            Ce produit n&apos;existe pas ou a été supprimé.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm md:text-base"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  // Variables dérivées pour l'affichage
  const productImages = getProductImages();
  const discount = getDiscount();
  const hasDiscount = discount > 0;
  const discountPercentage = hasDiscount && productData.originalPrice 
    ? Math.round((discount / productData.originalPrice) * 100)
    : 0;

  return (
    <>
      {/* 📊 NOUVEAU: Schema.org JSON-LD pour Rich Snippets */}
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
        />
      )}
      
      {/* 🆕 NOUVEAU: Métadonnées de page dynamiques dans le head */}
      <head>
        <meta name="product:price:amount" content={productData.price?.toString()} />
        <meta name="product:price:currency" content="MAD" />
        <meta name="product:brand" content={productData.brand} />
        <meta name="product:availability" content={productData.inStock ? 'in stock' : 'out of stock'} />
        <meta name="product:condition" content="new" />
      </head>
      
      <div className="bg-gray-50">
        <div className="container mx-auto px-2 md:px-4 py-4 md:py-6">
          
          {/* Breadcrumb Navigation - AMÉLIORÉ POUR SEO */}
          <nav className="flex items-center space-x-1 md:space-x-2 text-xs md:text-sm text-gray-600 mb-4 md:mb-6 overflow-x-auto whitespace-nowrap" aria-label="Fil d'ariane">
            <Link href="/" className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0">
              Accueil
            </Link>
            <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
            
            {productData.categories && productData.categories.length > 0 && (
              <>
                <Link 
                  href={`/${productData.categories[0].category}`} 
                  className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0"
                >
                  {productData.categories[0].category}
                </Link>
                <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                
                {productData.categories[0].subcategory && (
                  <>
                    <Link 
                      href={`/${productData.categories[0].category}/${productData.categories[0].subcategory}`} 
                      className="hover:text-pink-600 transition-colors duration-200 flex-shrink-0"
                    >
                      {productData.categories[0].subcategory}
                    </Link>
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  </>
                )}
              </>
            )}
            
            <span className="text-gray-800 font-medium flex-shrink-0 truncate">
              {productData.name}
            </span>
          </nav>

          {/* Layout Responsive - Mobile First */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            
            {/* SECTION MOBILE - Images d'abord */}
            <div className="lg:hidden mb-4 md:mb-6">
              {/* Image principale mobile */}
              <div className="mb-3">
                <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg">
                  {productImages.length > 0 ? (
                    <Image
                      src={productImages[selectedImageIndex]}
                      alt={`${productData.name} ${productData.brand} - Image principale`}
                      fill
                      className="object-cover"
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">Image non disponible</span>
                    </div>
                  )}
                  
                  {hasDiscount && (
                    <div className="absolute top-2 md:top-3 left-2 md:left-3 bg-red-500 text-white px-2 py-1 text-xs font-semibold rounded">
                      -{discount} DH
                    </div>
                  )}
                </div>
              </div>

              {/* Miniatures mobile */}
              {productImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 border-2 overflow-hidden rounded transition-all duration-200 ${
                        selectedImageIndex === index 
                          ? 'border-rose-500' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      aria-label={`Voir l'image ${index + 1} de ${productData.name}`}
                    >
                      <Image
                        src={image}
                        alt={`${productData.name} ${productData.brand} - Vue ${index + 1}`}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION MOBILE - Informations produit */}
            <div className="lg:hidden mb-6">
              <div className="bg-white border border-gray-200 p-3 md:p-4 shadow-sm rounded-lg">
                
                {/* En-tête produit mobile - AMÉLIORÉ POUR SEO */}
                <header className="mb-3">
                  <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">
                    {productData.brand}
                  </p>
                  <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">
                    {productData.name}
                  </h1>
                </header>

                {/* Section prix mobile */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-2xl font-bold text-rose-600">
                      {productData.price?.toLocaleString()} DH
                    </span>
                    {hasDiscount && productData.originalPrice && (
                      <span className="text-base text-gray-400 line-through">
                        {productData.originalPrice.toLocaleString()} DH
                      </span>
                    )}
                  </div>
                  
                  {hasDiscount && (
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                        -{discountPercentage}% 
                      </span>
                      <span className="text-xs text-gray-600">
                        Vous économisez {discount} DH
                      </span>
                    </div>
                  )}

                  {productData.contenance && (
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                       {productData.contenance}
                      </span>
                    </div>
                  )}
                </div>

                {/* Description courte AVEC FORMATAGE */}
                {productData.shortDescription && (
                  <div className="mb-4">
                    <FormattedText 
                      text={productData.shortDescription}
                      className="text-sm text-gray-700 leading-relaxed"
                    />
                  </div>
                )}

                {/* Statut stock */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      productData.inStock ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className={`text-xs font-medium ${
                      productData.inStock ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {productData.inStock ? 'En stock' : 'Rupture de stock'}
                    </span>
                  </div>
                </div>

                {/* Sélecteur de quantité mobile */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Quantité
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-medium text-sm" aria-live="polite">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 99}
                      className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Boutons d'action mobile */}
                <div className="flex space-x-2 mb-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={!productData.inStock || isAddingToCart}
                    className="flex-1 bg-rose-500 text-white py-2 px-3 font-semibold rounded hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-1 text-sm"
                    aria-describedby="add-to-cart-description"
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Ajout...</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3 h-3" />
                        <span>Panier</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    disabled={!productData.inStock || isBuyingNow}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-2 px-3 font-bold rounded hover:from-green-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-1 text-sm shadow-lg"
                    aria-describedby="buy-now-description"
                  >
                    {isBuyingNow ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Achat...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3 h-3" />
                        <span>Acheter</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Services compacts mobile */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-1">
                    <Truck className="w-3 h-3 text-green-600" />
                    <span className="text-gray-600">Livraison gratuite</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3 text-blue-600" />
                    <span className="text-gray-600">Retour 14j</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Shield className="w-3 h-3 text-purple-600" />
                    <span className="text-gray-600">Paiement sécurisé</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-rose-600" />
                    <span className="text-gray-600">Support 7j/7</span>
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE GAUCHE DESKTOP - Images et Descriptions */}
            <div className="hidden lg:block">
              <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-5 space-y-6">
                
                {/* Galerie d'images desktop */}
                <div>
                  <div className="flex space-x-4 justify-center">
                    {productImages.length > 1 && (
                      <div className="flex flex-col space-y-3 flex-shrink-0">
                        {productImages.map((image: string, index: number) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`w-16 h-16 border-2 overflow-hidden rounded-lg transition-all duration-200 ${
                              selectedImageIndex === index 
                                ? 'border-rose-500 opacity-100' 
                                : 'border-gray-200 hover:border-gray-300 opacity-80 hover:opacity-100'
                            }`}
                            aria-label={`Voir l'image ${index + 1} de ${productData.name}`}
                          >
                            <Image
                              src={image}
                              alt={`${productData.name} ${productData.brand} - Vue ${index + 1}`}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex-1 max-w-xl">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden rounded-lg">
                        {productImages.length > 0 ? (
                          <Image
                            src={productImages[selectedImageIndex]}
                            alt={`${productData.name} ${productData.brand} - Image principale`}
                            fill
                            className="object-cover"
                            priority
                            sizes="600px"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400">Image non disponible</span>
                          </div>
                        )}
                        
                        {hasDiscount && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white px-2 py-1 text-sm font-semibold rounded">
                            -{discount} DH
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Onglets de description */}
                <div>
                  <div className="border-b border-gray-200 mb-4">
                    <nav className="flex space-x-4 overflow-x-auto" role="tablist">
                      {[
                        { id: 'description', label: 'Description' },
                        ...(productData.specifications && Object.keys(productData.specifications).length > 0 
                          ? [{ id: 'specifications', label: 'Caractéristiques' }] 
                          : [])
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors duration-200 whitespace-nowrap ${
                            activeTab === tab.id
                              ? 'border-rose-500 text-rose-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                          role="tab"
                          aria-selected={activeTab === tab.id}
                          aria-controls={`${tab.id}-panel`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Contenu des onglets AVEC FORMATAGE */}
                  <div className="prose max-w-none">
                    
                    {activeTab === 'description' && (
                      <div id="description-panel" role="tabpanel">
                        <FormattedText 
                          text={productData.longSEOdescription || 
                                productData.shortSEOdescription || 
                                'Description non disponible pour ce produit.'}
                          className="text-gray-700 leading-relaxed text-sm md:text-base"
                        />
                      </div>
                    )}

                    {activeTab === 'specifications' && (
                      <div id="specifications-panel" role="tabpanel">
                        {productData.specifications && Object.keys(productData.specifications).length > 0 ? (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                              <thead className="sr-only">
                                <tr>
                                  <th>Caractéristique</th>
                                  <th>Valeur</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.entries(productData.specifications).map(([key, value], index) => (
                                  <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                    <td className="px-4 py-3 font-medium text-gray-800 border-b border-gray-200 text-sm">
                                      {key}
                                    </td>
                                    <td className="px-4 py-3 text-gray-700 border-b border-gray-200 text-sm">
                                      {String(value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-gray-600 text-sm">
                            Caractéristiques techniques non disponibles pour ce produit.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* COLONNE DROITE DESKTOP - Informations et actions */}
            <div className="hidden lg:block">
              <div className="sticky top-4">
                <div className="bg-white border border-gray-200 p-5 shadow-sm rounded-lg">
                  
                  {/* En-tête produit desktop - AMÉLIORÉ POUR SEO */}
                  <header className="mb-4">
                    <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">
                      {productData.brand}
                    </p>
                    <h1 className="text-xl font-bold text-gray-800 leading-tight">
                      {productData.name}
                    </h1>
                  </header>

                  {/* Section prix desktop */}
                  <div className="mb-5">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-3xl font-bold text-rose-600" itemProp="price" content={productData.price?.toString()}>
                        {productData.price?.toLocaleString()} DH
                      </span>
                      {hasDiscount && productData.originalPrice && (
                        <span className="text-lg text-gray-400 line-through">
                          {productData.originalPrice.toLocaleString()} DH
                        </span>
                      )}
                    </div>
                    
                    {hasDiscount && (
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                          -{discountPercentage}% 
                        </span>
                        <span className="text-sm text-gray-600">
                          Vous économisez {discount} DH
                        </span>
                      </div>
                    )}

                    {productData.contenance && (
                      <div className="mt-2">
                        <span className="inline-block bg-blue-100 text-blue-700 text-sm font-medium px-3 py-1 rounded">
                         {productData.contenance}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description courte desktop AVEC FORMATAGE */}
                  {productData.shortDescription && (
                    <div className="mb-5">
                      <FormattedText 
                        text={productData.shortDescription}
                        className="text-sm text-gray-700 leading-relaxed"
                      />
                    </div>
                  )}

                  {/* Statut stock desktop */}
                  <div className="mb-5">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        productData.inStock ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`text-sm font-medium ${
                        productData.inStock ? 'text-green-600' : 'text-red-600'
                      }`} itemProp="availability" content={productData.inStock ? 'InStock' : 'OutOfStock'}>
                        {productData.inStock ? 'En stock' : 'Rupture de stock'}
                      </span>
                    </div>
                  </div>

                  {/* Sélecteur quantité desktop */}
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantité
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium" aria-live="polite">
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= 99}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Boutons d'action desktop */}
                  <div className="flex space-x-3 mb-5">
                    <button
                      onClick={handleAddToCart}
                      disabled={!productData.inStock || isAddingToCart}
                      className="flex-1 bg-rose-500 text-white py-3 px-4 font-semibold rounded hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                      aria-describedby="add-to-cart-description"
                    >
                      {isAddingToCart ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Ajout...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>Panier</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={!productData.inStock || isBuyingNow}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 font-bold rounded hover:from-green-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                      aria-describedby="buy-now-description"
                    >
                      {isBuyingNow ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Achat...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Acheter</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Descriptions des boutons pour l'accessibilité */}
                  <div className="sr-only">
                    <p id="add-to-cart-description">
                      Ajouter {quantity} {productData.name} au panier pour {(productData.price || 0) * quantity} DH
                    </p>
                    <p id="buy-now-description">
                      Acheter immédiatement {quantity} {productData.name} pour {(productData.price || 0) * quantity} DH
                    </p>
                  </div>

                  {/* Section services et garanties desktop */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Truck className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">
                          Livraison gratuite
                        </p>
                        <p className="text-xs text-gray-600">
                          Partout au Maroc - Livraison en 24-48h
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <RotateCcw className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">
                          Retour gratuit
                        </p>
                        <p className="text-xs text-gray-600">
                          14 jours pour changer d&lsquo;avis
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Shield className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">
                          Paiement sécurisé
                        </p>
                        <p className="text-xs text-gray-600">
                          À la livraison ou par carte bancaire
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-rose-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-gray-800 mb-1 text-sm">
                          Besoin d&apos;aide ?
                        </p>
                        <p className="text-xs text-gray-600">
                          06 62 18 53 35 - Support 7j/7
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Onglets de description et spécifications pour mobile */}
          <div className="lg:hidden mt-6">
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-4">
              {/* Navigation des onglets mobile */}
              <div className="border-b border-gray-200 mb-4">
                <nav className="flex space-x-4 overflow-x-auto" role="tablist">
                  {[
                    { id: 'description', label: 'Description' },
                    ...(productData.specifications && Object.keys(productData.specifications).length > 0 
                      ? [{ id: 'specifications', label: 'Caractéristiques' }] 
                      : [])
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-xs md:text-sm transition-colors duration-200 whitespace-nowrap ${
                        activeTab === tab.id
                          ? 'border-rose-500 text-rose-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                      role="tab"
                      aria-selected={activeTab === tab.id}
                      aria-controls={`${tab.id}-panel-mobile`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Contenu des onglets mobile AVEC FORMATAGE */}
              <div className="prose max-w-none">
                
                {activeTab === 'description' && (
                  <div id="description-panel-mobile" role="tabpanel">
                    <FormattedText 
                      text={productData.longSEOdescription || 
                            productData.shortSEOdescription || 
                            'Description non disponible pour ce produit.'}
                      className="text-gray-700 leading-relaxed text-sm"
                    />
                  </div>
                )}

                {activeTab === 'specifications' && (
                  <div id="specifications-panel-mobile" role="tabpanel">
                    {productData.specifications && Object.keys(productData.specifications).length > 0 ? (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="sr-only">
                            <tr>
                              <th>Caractéristique</th>
                              <th>Valeur</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(productData.specifications).map(([key, value], index) => (
                              <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-3 py-2 font-medium text-gray-800 border-b border-gray-200 text-xs">
                                  {key}
                                </td>
                                <td className="px-3 py-2 text-gray-700 border-b border-gray-200 text-xs">
                                  {String(value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        Caractéristiques techniques non disponibles pour ce produit.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section produits similaires - AMÉLIORÉE POUR SEO */}
          {similarProducts.length > 0 && (
            <section className="mt-8 pt-6 border-t border-gray-200" aria-labelledby="similar-products-heading">
              <h2 id="similar-products-heading" className="text-lg font-bold text-gray-800 mb-4">
                Produits similaires
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {similarProducts.map((product) => (
                  <article key={product.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden rounded-lg hover:shadow-md transition-shadow duration-200 group">
                    <Link href={`/product/${product.slug}`} className="block">
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {product.mainImage ? (
                          <Image
                            src={product.mainImage}
                            alt={`${product.name} ${product.brand}`}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">Image indisponible</span>
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-400 uppercase mb-1 truncate">
                          {product.brand}
                        </p>
                        <h3 className="font-medium text-gray-800 mb-2 text-sm leading-tight line-clamp-2">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-rose-600">
                            {product.price.toLocaleString()} DH
                          </span>
                          <span className="text-xs text-rose-600 hover:text-rose-700 font-medium transition-colors duration-200">
                            Voir →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Barre d'action mobile sticky */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 p-4">
            <div className="flex space-x-3">
              <button
                onClick={handleAddToCart}
                disabled={!productData.inStock || isAddingToCart}
                className="flex-1 bg-rose-500 text-white py-3 px-4 font-semibold rounded-lg hover:bg-rose-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isAddingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Ajout...</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    <span>Panier</span>
                  </>
                )}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={!productData.inStock || isBuyingNow}
                className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white py-3 px-4 font-bold rounded-lg hover:from-green-700 hover:to-green-600 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
              >
                {isBuyingNow ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Achat...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Acheter</span>
                  </>
                )}
              </button>
            </div>

           
            
          </div>

          {/* Espace pour éviter que le contenu soit masqué par la barre sticky mobile */}
          <div className="lg:hidden h-24"></div>

          {/* Bouton WhatsApp flottant mobile */}
          <div className="fixed bottom-28 right-4 z-50 lg:hidden">
            <a
              href={`https://wa.me/212662185335?text=Bonjour, j'ai une question concernant : ${encodeURIComponent(productData.name)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 text-white p-3 rounded-full shadow-lg hover:bg-green-600 transition-colors duration-200 flex items-center justify-center"
              aria-label="Contacter par WhatsApp"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductPageClient;