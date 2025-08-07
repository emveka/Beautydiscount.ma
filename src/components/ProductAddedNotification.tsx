import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, ShoppingCart, X, Eye, Package } from 'lucide-react';
import Image from 'next/image'; // Import ajouté pour Next.js

/**
 * Composant de notification pour l'ajout au panier
 * Affichage moderne avec animations et actions rapides
 */
interface ProductAddedNotificationProps {
  isVisible: boolean;
  onClose: () => void;
  productData: {
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    quantity: number;
  };
  onViewCart?: () => void;
  onContinueShopping?: () => void;
}

const ProductAddedNotification: React.FC<ProductAddedNotificationProps> = ({
  isVisible,
  onClose,
  productData,
  onViewCart,
  onContinueShopping
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  // Utilisation de useCallback pour éviter les re-créations de fonction
  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true);
      // Auto-fermeture après 5 secondes
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, handleClose]); // handleClose ajouté dans les dépendances

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay sombre */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Modal de notification */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
            isAnimating 
              ? 'scale-100 opacity-100 translate-y-0' 
              : 'scale-95 opacity-0 translate-y-4'
          }`}
        >
          {/* En-tête avec animation de succès */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 relative overflow-hidden">
            {/* Animation de cercles en arrière-plan */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 right-4 w-12 h-12 bg-white rounded-full animate-ping"></div>
              <div className="absolute bottom-2 left-8 w-8 h-8 bg-white rounded-full animate-pulse"></div>
            </div>
            
            <div className="relative flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <CheckCircle className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">
                  Produit ajouté !
                </h3>
                <p className="text-green-100 text-sm">
                  {productData.quantity} article{productData.quantity > 1 ? 's' : ''} dans votre panier
                </p>
              </div>
              
              {/* Bouton fermer */}
              <button
                onClick={handleClose}
                className="absolute top-2 right-2 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Fermer la notification"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps de la notification */}
          <div className="p-6">
            {/* Informations produit */}
            <div className="flex items-start space-x-4 mb-6">
              <div className="relative">
                {/* Remplacement de <img> par <Image> de Next.js */}
                <Image
                  src={productData.imageUrl || '/placeholder-product.jpg'}
                  alt={productData.name}
                  width={64}
                  height={64}
                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                  placeholder="blur"
                  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                />
                {/* Badge quantité */}
                <div className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {productData.quantity}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                  {productData.brand}
                </p>
                <h4 className="font-semibold text-gray-800 text-sm leading-tight mb-2 line-clamp-2">
                  {productData.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-rose-600">
                    {productData.price.toLocaleString()} DH
                  </span>
                  {productData.quantity > 1 && (
                    <span className="text-xs text-gray-500">
                      × {productData.quantity}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Total ajouté
                  </span>
                </div>
                <span className="font-bold text-lg text-gray-800">
                  {(productData.price * productData.quantity).toLocaleString()} DH
                </span>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  onViewCart?.();
                  handleClose();
                }}
                className="flex-1 bg-rose-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-rose-600 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Voir le panier</span>
              </button>
              
              <button
                onClick={() => {
                  onContinueShopping?.();
                  handleClose();
                }}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Continuer</span>
              </button>
            </div>

            {/* Message encourageant */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                🚚 Livraison gratuite dès maintenant !
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Export par défaut du composant pour résoudre l'erreur "never used"
export default ProductAddedNotification;