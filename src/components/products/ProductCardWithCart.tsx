// components/products/ProductCardWithCart.tsx - Version avec CartDrawer et calcul de réduction corrigé
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
      <div className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg animate-slide-in-right">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            Ajouté au panier !
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * ProductCardWithCart - Version optimisée avec CartDrawer et calcul de réduction corrigé
 * 
 * 🆕 Améliorations :
 * - Calcul automatique de la réduction : originalPrice - price
 * - Ouvre automatiquement le CartDrawer après ajout
 * - Notification rapide et discrète
 * - Bouton "Acheter maintenant" qui utilise replaceCartWithSingleItem
 * - Interface épurée et moderne
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
      <div className="w-full max-w-xs bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden relative group hover:shadow-md transition-all duration-200">
        
        {/* Badges de réduction et stock */}
        <div className="absolute top-2 left-2 z-10 space-y-1">
          {/* 🆕 Badge de réduction calculé automatiquement */}
          {actualDiscount > 0 && (
            <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{actualDiscount.toLocaleString()} DH
            </div>
          )}
          {/* Alternative avec pourcentage */}
          {/* {discountPercentage > 0 && (
            <div className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
              -{discountPercentage}%
            </div>
          )} */}
          {!inStock && (
            <div className="bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded">
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
                <span className="text-white font-semibold text-sm">Indisponible</span>
              </div>
            )}
          </div>
        </Link>

        {/* Section des détails du produit */}
        <div className="p-4">
          {/* Marque du produit */}
          <p className="text-xs text-gray-500 uppercase font-medium tracking-wide mb-1">
            {brand}
          </p>
          
          {/* Nom du produit avec lien */}
          <Link 
            href={`/product/${slug}`} 
            className="block font-medium text-gray-800 text-sm hover:text-pink-600 transition-colors duration-200 leading-5 mb-3 h-10 overflow-hidden"
          >
            <span className="line-clamp-2">
              {name}
            </span>
          </Link>

          {/* Section des prix */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-end gap-2">
              {/* Prix actuel */}
              <span className="text-lg font-bold text-pink-600">
                {price.toLocaleString()} DH
              </span>
              
              {/* Prix original barré */}
              {originalPrice > price && (
                <span className="text-sm line-through text-gray-400">
                  {originalPrice.toLocaleString()} DH
                </span>
              )}
            </div> 
          </div>

          {/* Boutons d'action */}
          <div className="space-y-2">
            
            {/* 🆕 Bouton principal - Ajouter au panier et ouvrir le CartDrawer */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || isAddingToCart}
              className={`
                w-full py-2.5 px-3 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden rounded-lg
                ${inStock 
                  ? justAdded
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-pink-600 text-white hover:bg-pink-700 active:scale-95 shadow-md hover:shadow-lg'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }
                ${isAddingToCart ? 'animate-pulse' : ''}
              `}
            >
              {isAddingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Ajout...</span>
                </>
              ) : justAdded ? (
                <>
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Ajouté !</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{inStock ? 'Ajouter au panier' : 'Indisponible'}</span>
                </>
              )}
              
              {/* Animation de succès */}
              {justAdded && (
                <div className="absolute inset-0 bg-green-500 opacity-20 animate-ping rounded-lg"></div>
              )}
            </button>

            {/* 🆕 Bouton "Acheter maintenant" */}
            {inStock && (
              <button
                onClick={handleBuyNow}
                disabled={isAddingToCart}
                className="w-full py-2 px-3 border border-pink-600 text-pink-600 rounded-lg font-medium text-sm hover:bg-pink-50 transition-all duration-200 active:scale-95 flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Acheter maintenant</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🆕 Notification rapide et discrète */}
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
      `}</style>
    </>
  );
}