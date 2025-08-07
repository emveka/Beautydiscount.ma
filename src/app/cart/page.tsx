// app/cart/page.tsx - Version corrigée (erreurs fixées)
'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowLeft, 
  Truck,
  Shield,
  CreditCard,
  Heart
} from 'lucide-react';
import { useCartActions, useCartData } from '@/store/cartStore'; // ✅ Supprimé useCartStore non utilisé

/**
 * Page Panier - Affichage et gestion du panier avec Zustand
 * 
 * Fonctionnalités :
 * - Affichage des articles du panier
 * - Modification des quantités
 * - Suppression d'articles
 * - Calcul des totaux automatique
 * - Navigation vers checkout
 * - Design responsive
 */
const CartPage = () => {
  const router = useRouter();
  
  // Actions du panier
  const { updateQuantity, removeItem, clearCart } = useCartActions();
  
  // Données du panier
  const { items, total, subtotal, itemsCount, shippingCost } = useCartData();

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
   * Navigation vers le checkout
   */
  const proceedToCheckout = () => {
    router.push('/checkout');
  };

  // Si panier vide
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-pink-600 hover:text-pink-700 transition-colors duration-200 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continuer mes achats
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mon Panier</h1>
          </div>

          {/* Panier vide */}
          <div className="bg-white rounded-lg shadow-sm p-8 md:p-12 text-center">
            <div className="max-w-md mx-auto">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Votre panier est vide
              </h2>
              <p className="text-gray-600 mb-6">
                Découvrez nos produits et ajoutez vos articles favoris à votre panier.
              </p>
              <Link
                href="/"
                className="inline-flex items-center bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors duration-200"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Découvrir nos produits
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/"
            className="inline-flex items-center text-pink-600 hover:text-pink-700 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continuer mes achats
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mon Panier</h1>
              <p className="text-gray-600 mt-1">
                {itemsCount} article{itemsCount > 1 ? 's' : ''} dans votre panier
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-200"
              >
                Vider le panier
              </button>
            )}
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          
          {/* Colonne principale - Articles du panier */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              
              {/* Header du tableau */}
              <div className="hidden md:block bg-gray-50 px-6 py-3 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-3">Produit</div>
                  <div className="text-center">Prix unitaire</div>
                  <div className="text-center">Quantité</div>
                  <div className="text-center">Total</div>
                </div>
              </div>

              {/* Liste des articles */}
              <div className="divide-y divide-gray-200">
                {items.map((item) => {
                  // ✅ Supprimé itemDiscount qui n'était pas utilisé
                  const discountPercentage = getDiscountPercentage(item.price, item.originalPrice);
                  const itemTotal = item.price * item.quantity;

                  return (
                    <div key={item.productId} className="p-4 md:p-6">
                      
                      {/* Version Mobile */}
                      <div className="md:hidden">
                        <div className="flex space-x-4">
                          {/* Image */}
                          <div className="flex-shrink-0">
                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
                              {item.imageUrl ? (
                                <Image
                                  src={item.imageUrl}
                                  alt={item.name}
                                  width={80}
                                  height={80}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                  <ShoppingBag className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Infos produit */}
                          <div className="flex-1 min-w-0">
                            <Link 
                              href={`/product/${item.slug}`}
                              className="block"
                            >
                              <p className="text-sm text-gray-500 uppercase font-medium mb-1">
                                {item.brand}
                              </p>
                              <h3 className="text-sm font-medium text-gray-900 hover:text-pink-600 transition-colors duration-200 line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>

                            {/* Prix mobile */}
                            <div className="mt-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg font-bold text-pink-600">
                                  {item.price.toLocaleString()} DH
                                </span>
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <span className="text-sm text-gray-400 line-through">
                                    {item.originalPrice.toLocaleString()} DH
                                  </span>
                                )}
                              </div>
                              {discountPercentage > 0 && (
                                <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded mt-1">
                                  -{discountPercentage}%
                                </span>
                              )}
                            </div>

                            {/* Quantité et actions mobile */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-medium">{item.quantity}</span>
                                <button
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                  disabled={item.quantity >= 99}
                                  className="p-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-gray-900">
                                  {itemTotal.toLocaleString()} DH
                                </span>
                                <button
                                  onClick={() => removeItem(item.productId)}
                                  className="text-red-600 hover:text-red-700 transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Version Desktop */}
                      <div className="hidden md:block">
                        <div className="grid grid-cols-6 gap-4 items-center">
                          
                          {/* Produit (col-span-3) */}
                          <div className="col-span-3 flex items-center space-x-4">
                            {/* Image */}
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                                {item.imageUrl ? (
                                  <Image
                                    src={item.imageUrl}
                                    alt={item.name}
                                    width={96}
                                    height={96}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <ShoppingBag className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Infos */}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/product/${item.slug}`}
                                className="block"
                              >
                                <p className="text-sm text-gray-500 uppercase font-medium mb-1">
                                  {item.brand}
                                </p>
                                <h3 className="text-base font-medium text-gray-900 hover:text-pink-600 transition-colors duration-200">
                                  {item.name}
                                </h3>
                              </Link>
                              {!item.inStock && (
                                <p className="text-sm text-red-600 mt-1">⚠️ Plus en stock</p>
                              )}
                            </div>
                          </div>

                          {/* Prix unitaire */}
                          <div className="text-center">
                            <div className="space-y-1">
                              <div className="font-bold text-pink-600">
                                {item.price.toLocaleString()} DH
                              </div>
                              {item.originalPrice && item.originalPrice > item.price && (
                                <div className="text-sm text-gray-400 line-through">
                                  {item.originalPrice.toLocaleString()} DH
                                </div>
                              )}
                              {discountPercentage > 0 && (
                                <div>
                                  <span className="inline-block bg-red-100 text-red-600 text-xs font-semibold px-2 py-1 rounded">
                                    -{discountPercentage}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Quantité */}
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-3">
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors duration-200"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="font-medium w-8 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                disabled={item.quantity >= 99}
                                className="p-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Total et actions */}
                          <div className="text-center">
                            <div className="flex items-center justify-center space-x-4">
                              <span className="font-bold text-gray-900">
                                {itemTotal.toLocaleString()} DH
                              </span>
                              <button
                                onClick={() => removeItem(item.productId)}
                                className="text-red-600 hover:text-red-700 transition-colors duration-200"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
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

          {/* Sidebar - Récapitulatif de commande */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
              
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Récapitulatif de commande
              </h2>

              {/* Détails prix */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sous-total ({itemsCount} article{itemsCount > 1 ? 's' : ''})</span>
                  <span className="font-medium">{subtotal.toLocaleString()} DH</span>
                </div>
                
                {/* Affichage "À définir" pour les frais de livraison */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Livraison</span>
                  <span className="font-medium">
                    {shippingCost === 0 ? (
                      <span className="text-gray-500">À définir</span>
                    ) : (
                      `${shippingCost.toLocaleString()} DH`
                    )}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-pink-600">
                      {total.toLocaleString()} DH
                    </span>
                  </div>
                </div>
              </div>

              {/* Bouton checkout */}
              <button
                onClick={proceedToCheckout}
                className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700 transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>Passer la commande</span>
              </button>

              {/* Garanties */}
              <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>Livraison partout au Maroc</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Paiement sécurisé</span>
                </div>
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <CreditCard className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span>Paiement à la livraison</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Produits recommandés */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Vous pourriez aussi aimer
          </h2>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
            <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Section des produits recommandés à implémenter</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;