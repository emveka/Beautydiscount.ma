// components/products/ProductCardWithCart.tsx - Version Mobile Optimisée
'use client'
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, CheckCircle, Eye, } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartActions } from '@/store/cartStore';

/**
 * Interface pour ProductCardWithCart avec CartDrawer
 */
interface ProductCardWithCartProps {
  imageUrl: string;      // URL de l'image du produit
  brand: string;         // Marque du produit
  name: string;          // Nom du produit
  price: number;         // Prix actuel du produit
  originalPrice: number; // Prix original (avant réduction)
  discount: number;      // Montant de la réduction en DH (peut être ignoré)
  slug: string;          // Slug pour l'URL du produit
  inStock: boolean;      // Disponibilité du produit
  productId: string;     // ID unique du produit pour le panier
}

/**
 * Composant de notification simplifiée pour l'ajout au panier
 * 🆕 Version simplifiée car le CartDrawer s'ouvre automatiquement
 */
interface QuickNotificationProps {
  isVisible: boolean;
  productName: string;
  onClose: () => void;
}

const QuickNotification: React.FC<QuickNotificationProps> = ({
  isVisible,
  productName,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Notification rapide de 2 secondes
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] pointer-events-none">
      <div className="bg-green-600 text-white px-3 py-1.5 rounded-lg shadow-lg animate-slide-in-right">
        <div className="flex items-center space-x-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            Ajouté !
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * ProductCardWithCart - Version Mobile Optimisée
 * 
 * 🚀 Optimisations Mobile :
 * - Boutons plus petits et compacts
 * - Espacement réduit pour mobile
 * - Texte et icônes plus petits sur mobile
 * - Padding ajusté selon la taille d'écran
 * - Notification mobile-friendly
 */
export default function ProductCardWithCart({
  imageUrl,
  brand,
  name,
  price,
  originalPrice,
  slug,
  inStock,
  productId
}: ProductCardWithCartProps) {
  
  // 🆕 Actions du panier depuis Zustand avec CartDrawer
  const { addItem, toggleCart, replaceCartWithSingleItem } = useCartActions();
  
  // États pour les interactions utilisateur
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [showQuickNotification, setShowQuickNotification] = useState(false);

  /**
   * 🆕 Calcule la réduction réelle : originalPrice - price
   */
  const getActualDiscount = () => {
    if (!originalPrice || originalPrice <= price) return 0;
    return originalPrice - price;
  };

  /**
   * 🆕 Ajoute au panier et ouvre automatiquement le CartDrawer
   */
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      // Simulation d'une petite latence pour l'UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Ajouter l'item au panier via Zustand
      addItem({
        productId,
        name,
        brand,
        price,
        originalPrice,
        imageUrl,
        slug,
        inStock
      });
      
      // Feedback visuel immédiat sur le bouton
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
      
      // Notification rapide
      setShowQuickNotification(true);
      
      // 🆕 Ouvrir automatiquement le CartDrawer après un délai
      setTimeout(() => {
        toggleCart();
      }, 500);
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout au panier:', error);
      alert('Erreur lors de l\'ajout au panier');
    } finally {
      setIsAddingToCart(false);
    }
  };

  /**
   * 🆕 Acheter maintenant - Remplace le panier et va au checkout
   */
  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!inStock || isAddingToCart) return;
    
    setIsAddingToCart(true);
    
    try {
      // Remplacer le panier avec ce produit uniquement
      replaceCartWithSingleItem({
        productId,
        name,
        brand,
        price,
        originalPrice,
        imageUrl,
        slug,
        inStock
      }, 1);
      
      // Redirection vers checkout après un court délai
      setTimeout(() => {
        window.location.href = '/checkout';
      }, 300);
      
    } catch (error) {
      console.error('Erreur lors de l\'achat direct:', error);
      setIsAddingToCart(false);
    }
  };

  // 🆕 Calculer la réduction réelle
  const actualDiscount = getActualDiscount();

  return (
    <>
      {/* 🚀 Container principal avec responsive padding */}
      <div className="w-full max-w-xs bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden relative group hover:shadow-md transition-all duration-200">
        
        {/* Badges de réduction et stock - Taille réduite sur mobile */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 space-y-1">
          {/* 🆕 Badge de réduction calculé automatiquement */}
          {actualDiscount > 0 && (
            <div className="bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
              -{actualDiscount.toLocaleString()} DH
            </div>
          )}
          {!inStock && (
            <div className="bg-gray-500 text-white text-xs font-semibold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
              Rupture
            </div>
          )}
        </div>

        {/* Container de l'image */}
        <Link href={`/product/${slug}`} className="block">
          <div className="relative overflow-hidden aspect-square">
            <Image
              src={imageUrl}
              alt={name}
              width={400}
              height={400}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={false}
            />
            
            {/* Overlay au hover */}
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200" />
            
            {/* Badge de rupture de stock */}
            {!inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-xs sm:text-sm">Indisponible</span>
              </div>
            )}
          </div>
        </Link>

        {/* 🚀 Section des détails - Padding mobile optimisé */}
        <div className="p-2.5 sm:p-4">
          {/* Marque du produit - Texte plus petit sur mobile */}
          <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium tracking-wide mb-0.5 sm:mb-1">
            {brand}
          </p>
          
          {/* Nom du produit avec lien - Hauteur réduite sur mobile */}
          <Link 
            href={`/product/${slug}`} 
            className="block font-medium text-gray-800 text-xs sm:text-sm hover:text-pink-500 transition-colors duration-200 leading-4 sm:leading-5 mb-2 sm:mb-3 h-8 sm:h-10 overflow-hidden"
          >
            <span className="line-clamp-2">
              {name}
            </span>
          </Link>

          {/* Section des prix - Une ligne sur mobile, layout normal sur desktop */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            {/* Mobile: Prix sur une seule ligne */}
            <div className="flex items-center gap-2 sm:hidden">
              {/* Prix actuel - ROUGE */}
              <span className="text-base font-bold text-red-500">
                {price.toLocaleString()} DH
              </span>
              
              {/* Prix original barré - À côté sur la même ligne */}
              {originalPrice > price && (
                <span className="text-xs line-through text-gray-400">
                  {originalPrice.toLocaleString()} DH
                </span>
              )}
            </div>

            {/* Desktop: Layout original avec items-end */}
            <div className="hidden sm:flex items-end gap-2">
              {/* Prix actuel - Plus petit sur mobile - ROUGE */}
              <span className="text-lg font-bold text-red-500">
                {price.toLocaleString()} DH
              </span>
              
              {/* Prix original barré - Plus petit sur mobile */}
              {originalPrice > price && (
                <span className="text-sm line-through text-gray-400">
                  {originalPrice.toLocaleString()} DH
                </span>
              )}
            </div> 
          </div>

          {/* 🚀 Boutons d'action - Version mobile compacte */}
          <div className="space-y-1.5 sm:space-y-2">
            
            {/* 🚀 Bouton principal - Taille mobile optimisée */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || isAddingToCart}
              className={`
                w-full py-1.5 sm:py-2.5 px-2 sm:px-3 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 relative overflow-hidden rounded-md sm:rounded-lg
                ${inStock 
                  ? justAdded
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
                ${isAddingToCart ? 'animate-pulse' : ''}
              `}
            >
              {isAddingToCart ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Ajout...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : justAdded ? (
                <>
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  <span className="hidden sm:inline">Ajouté !</span>
                  <span className="sm:hidden">✓</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{inStock ? 'Ajouter au panier' : 'Indisponible'}</span>
                  <span className="sm:hidden">{inStock ? 'Panier' : 'Indispo'}</span>
                </>
              )}
              
              {/* Animation de succès */}
              {justAdded && (
                <div className="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded-md sm:rounded-lg"></div>
              )}
            </button>

            {/* 🚀 Bouton "Acheter maintenant" - Version mobile compacte */}
            {inStock && (
              <button
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className="w-full py-1.5 sm:py-2 px-2 sm:px-3 border border-pink-500 text-pink-500 rounded-md sm:rounded-lg font-medium text-xs sm:text-sm hover:bg-pink-50 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-1 sm:space-x-2"
              >
                <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Acheter maintenant</span>
                <span className="sm:hidden">Acheter</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 Notification mobile-friendly */}
      <QuickNotification
        isVisible={showQuickNotification}
        productName={name}
        onClose={() => setShowQuickNotification(false)}
      />

      {/* Styles CSS pour l'animation */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }

        /* Utilitaire line-clamp pour le texte tronqué */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}