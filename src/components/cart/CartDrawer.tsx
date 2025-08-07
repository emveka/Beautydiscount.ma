// components/cart/CartDrawer.tsx - Version Mobile Sans Scroll
'use client'
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 

  Truck,
  Shield,

  X,
  ArrowRight,
  CreditCard
} from 'lucide-react';
import { useCartActions, useCartData } from '@/store/cartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * CartDrawer - Version Mobile Ultra-Compacte Sans Scroll
 * 
 * 🚀 Mobile: Tout visible sans scroll, éléments compacts
 * 🖥️ Desktop: Version normale inchangée
 */
const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  
  // Actions du panier
  const { updateQuantity, removeItem, clearCart } = useCartActions();
  
  // Données du panier
  const { items, total, subtotal, itemsCount} = useCartData();

  /**
   * Gestion des animations d'ouverture/fermeture
   */
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Délai pour permettre au DOM de se monter avant l'animation
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      setIsAnimating(false);
      // Attendre la fin de l'animation avant de démonter
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 400); // Durée de l'animation de fermeture
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  /**
   * Fermeture avec animation
   */
  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Délai pour l'animation
  };

  /**
   * Gère la modification de quantité avec validation
   */
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
    } else if (newQuantity <= 99) {
      updateQuantity(productId, newQuantity);
    }
  };

  /**
   * Calcule le pourcentage de réduction
   */
  const getDiscountPercentage = (price: number, originalPrice?: number) => {
    if (!originalPrice || originalPrice <= price) return 0;
    return Math.round(((originalPrice - price) / originalPrice) * 100);
  };

  /**
   * Navigation vers le checkout et fermeture du drawer
   */
  const proceedToCheckout = () => {
    handleClose();
    setTimeout(() => {
      router.push('/checkout');
    }, 350);
  };

  /**
   * Navigation vers une page produit et fermeture du drawer
   */
  const goToProduct = (slug: string) => {
    handleClose();
    setTimeout(() => {
      router.push(`/product/${slug}`);
    }, 350);
  };

  // Ne pas rendre si le composant ne doit pas être affiché
  if (!shouldRender) return null;

  return (
    <>
      {/* Overlay avec animation de fade */}
      <div 
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-in-out ${
          isAnimating ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={handleClose}
      />

      {/* Drawer avec animation de slide - RESPONSIVE AMÉLIORÉ */}
      <div className={`
        fixed z-50 bg-white shadow-2xl
        transform transition-all duration-400 ease-in-out
        ${isAnimating ? 'translate-x-0 translate-y-0' : 'translate-x-full sm:translate-x-full translate-y-full sm:translate-y-0'}
        
        // Mobile : Slide depuis le bas, sous le header
        top-auto sm:top-0
        bottom-0 sm:bottom-auto
        right-0
        left-0 sm:left-auto
        h-[90vh] sm:h-full
        w-full sm:w-[480px] lg:w-[600px] xl:w-[700px]
        
        // Border radius seulement en haut sur mobile
        rounded-t-2xl sm:rounded-none
        
        flex flex-col
      `}>
        
        {/* 🚀 Header ultra-compact mobile */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-2 sm:py-4 relative">
          
          {/* Handle bar pour mobile */}
          <div className="sm:hidden absolute top-1 left-1/2 transform -translate-x-1/2">
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between mt-1 sm:mt-0">
            <div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Mon Panier</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                {itemsCount} article{itemsCount > 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Bouton vider le panier */}
              {items.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-700 text-xs sm:text-sm font-medium transition-colors duration-200 px-2 sm:px-3 py-1 hover:bg-red-50 rounded-lg"
                >
                  Vider
                </button>
              )}
              
              {/* Bouton fermer */}
              <button
                onClick={handleClose}
                className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* 🚀 Contenu principal - PLUS de scroll, hauteur flex */}
        <div className="flex-1 min-h-0">
          
          {/* Si panier vide */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 sm:p-8 text-center">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Votre panier est vide
              </h3>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                Découvrez nos produits et ajoutez vos articles favoris.
              </p>
              <button
                onClick={handleClose}
                className="inline-flex items-center bg-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-pink-600 transition-colors duration-200 text-sm sm:text-base"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Continuer mes achats
              </button>
            </div>
          ) : (
            
            /* 🚀 Liste des articles - ULTRA COMPACTE */
            <div className="p-2 sm:p-4 lg:p-6 h-full flex flex-col">
              
              {/* Header du tableau - Desktop uniquement */}
              <div className="hidden lg:block bg-gray-50 px-4 py-3 rounded-lg mb-4">
                <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-2">Produit</div>
                  <div className="text-center">Prix</div>
                  <div className="text-center">Quantité</div>
                  <div className="text-center">Total</div>
                </div>
              </div>

              {/* 🚀 Articles - Flex-1 pour prendre l'espace disponible */}
              <div className="flex-1 min-h-0">
                <div className="space-y-1.5 sm:space-y-4 h-full">
                  {items.map((item, index) => {
                    const discountPercentage = getDiscountPercentage(item.price, item.originalPrice);
                    const itemTotal = item.price * item.quantity;

                    return (
                      <div 
                        key={item.productId} 
                        className={`bg-gray-50 rounded-lg p-2 sm:p-4 hover:bg-gray-100 transition-colors duration-200 ${
                          isAnimating ? 'animate-slide-in-right' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        
                        {/* 🚀 Version Mobile Ultra-Compacte */}
                        <div className="lg:hidden">
                          <div className="flex space-x-2 sm:space-x-4">
                            {/* Image plus petite */}
                            <div className="flex-shrink-0">
                              <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                {item.imageUrl ? (
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover sm:w-20 sm:h-20"
                                    onClick={() => goToProduct(item.slug)}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Infos produit compactes */}
                            <div className="flex-1 min-w-0">
                              <div 
                                className="cursor-pointer"
                                onClick={() => goToProduct(item.slug)}
                              >
                                <p className="text-[10px] sm:text-xs text-gray-500 uppercase font-medium mb-0.5 sm:mb-1">
                                  {item.brand}
                                </p>
                                <h3 className="text-xs sm:text-sm font-medium text-gray-900 hover:text-pink-500 transition-colors duration-200 line-clamp-1 sm:line-clamp-2 leading-tight">
                                  {item.name}
                                </h3>
                              </div>

                              {/* Prix mobile compact */}
                              <div className="mt-1 sm:mt-2">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  <span className="text-sm sm:text-lg font-bold text-red-500">
                                    {item.price.toLocaleString()} DH
                                  </span>
                                  {item.originalPrice && item.originalPrice > item.price && (
                                    <span className="text-xs sm:text-sm text-gray-400 line-through">
                                      {item.originalPrice.toLocaleString()} DH
                                    </span>
                                  )}
                                </div>
                                {discountPercentage > 0 && (
                                  <span className="inline-block bg-red-100 text-red-600 text-[10px] sm:text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded mt-0.5 sm:mt-1">
                                    -{discountPercentage}%
                                  </span>
                                )}
                              </div>

                              {/* 🚀 Contrôles ultra-compacts */}
                              <div className="flex items-center justify-between mt-2 sm:mt-4">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                    className="p-1 sm:p-1.5 border border-gray-300 rounded-lg hover:bg-white transition-colors duration-200"
                                  >
                                    <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </button>
                                  <span className="font-medium text-xs sm:text-sm w-6 sm:w-8 text-center">{item.quantity}</span>
                                  <button
                                    onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                    disabled={item.quantity >= 99}
                                    className="p-1 sm:p-1.5 border border-gray-300 rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                  >
                                    <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                  </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <span className="font-bold text-gray-900 text-xs sm:text-sm">
                                    {itemTotal.toLocaleString()} DH
                                  </span>
                                  <button
                                    onClick={() => removeItem(item.productId)}
                                    className="text-red-600 hover:text-red-700 transition-colors duration-200 p-0.5 sm:p-1"
                                  >
                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Version Desktop inchangée */}
                        <div className="hidden lg:block">
                          <div className="grid grid-cols-5 gap-4 items-center">
                            
                            {/* Produit (col-span-2) */}
                            <div className="col-span-2 flex items-center space-x-4">
                              <div className="flex-shrink-0">
                                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                  {item.imageUrl ? (
                                    <Image
                                      src={item.imageUrl}
                                      alt={item.name}
                                      width={64}
                                      height={64}
                                      className="w-full h-full object-cover"
                                      onClick={() => goToProduct(item.slug)}
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div 
                                  className="cursor-pointer"
                                  onClick={() => goToProduct(item.slug)}
                                >
                                  <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                                    {item.brand}
                                  </p>
                                  <h3 className="text-sm font-medium text-gray-900 hover:text-pink-500 transition-colors duration-200">
                                    {item.name}
                                  </h3>
                                </div>
                              </div>
                            </div>

                            {/* Prix */}
                            <div className="text-center">
                              <div className="space-y-1">
                                <div className="font-bold text-red-500 text-sm">
                                  {item.price.toLocaleString()} DH
                                </div>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <div className="text-xs text-gray-400 line-through">
                                    {item.originalPrice.toLocaleString()} DH
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quantité */}
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  className="p-1 border border-gray-300 rounded hover:bg-white transition-colors duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= 99}
                                  className="p-1 border border-gray-300 rounded hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>

                            {/* Total et actions */}
                            <div className="text-center">
                              <div className="flex items-center justify-center space-x-3">
                                <span className="font-bold text-gray-900 text-sm">
                                  {itemTotal.toLocaleString()} DH
                                </span>
                                <button
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-600 hover:text-red-700 transition-colors duration-200"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 Footer ultra-compact */}
        {items.length > 0 && (
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3 sm:p-4 lg:p-6">
            
            {/* Récapitulatif compact */}
            <div className="bg-gray-50 rounded-lg p-2.5 sm:p-4 mb-3 sm:mb-4">
              <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Récapitulatif</h3>
              
              <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total ({itemsCount} article{itemsCount > 1 ? 's' : ''})</span>
                  <span className="font-medium">{subtotal.toLocaleString()} DH</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium text-gray-500">À définir</span>
                </div>
                <div className="flex justify-between pt-1 sm:pt-2 border-t border-gray-200">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-red-500 text-base sm:text-lg">
                    {total.toLocaleString()} DH
                  </span>
                </div>
              </div>
            </div>

            {/* Boutons d'action compacts */}
            <div className="space-y-2 sm:space-y-3">
              <button
                onClick={proceedToCheckout}
                className="w-full bg-pink-500 text-white py-2 sm:py-3 px-4 rounded-lg font-semibold hover:bg-pink-600 transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
              >
                <CreditCard className="w-4 h-4" />
                <span>Passer la commande</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleClose}
                className="w-full border border-gray-300 text-gray-700 py-1.5 sm:py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
              >
                Continuer mes achats
              </button>
            </div>

            {/* 🚀 Garanties - SEULEMENT sur desktop */}
            <div className="hidden sm:block pt-4 mt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center space-x-2 text-gray-600">
                <Truck className="w-3 h-3 text-green-600 flex-shrink-0" />
                <span>Livraison partout</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Shield className="w-3 h-3 text-blue-600 flex-shrink-0" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <CreditCard className="w-3 h-3 text-purple-600 flex-shrink-0" />
                <span>Paiement livraison</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles CSS pour les animations fluides */}
      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(20px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes slide-in-up {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out forwards;
        }
        
        .animate-slide-in-up {
          animation: slide-in-up 0.4s ease-out forwards;
        }
        
        .duration-400 {
          transition-duration: 400ms;
        }
        
        /* Mobile : Animation depuis le bas */
        @media (max-width: 640px) {
          .animate-slide-in-right {
            animation: slide-in-up 0.4s ease-out forwards;
          }
        }

        /* Utilitaire line-clamp */
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
};

export default CartDrawer;