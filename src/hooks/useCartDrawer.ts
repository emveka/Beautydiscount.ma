// hooks/useCartDrawer.ts
'use client'
import { useCartActions, useCartData } from '@/store/cartStore'

/**
 * Hook personnalisé pour contrôler le CartDrawer
 * Simplifie l'utilisation du panier dans tous vos composants
 */
export const useCartDrawer = () => {
  const { toggleCart, addItem, replaceCartWithSingleItem } = useCartActions()
  const { isOpen, itemsCount, total, subtotal } = useCartData()

  /**
   * Ouvre le drawer du panier
   */
  const openCart = () => {
    if (!isOpen) {
      toggleCart()
    }
  }

  /**
   * Ferme le drawer du panier
   */
  const closeCart = () => {
    if (isOpen) {
      toggleCart()
    }
  }

  /**
   * Ajoute un produit au panier et ouvre automatiquement le drawer
   */
  const addToCartAndOpen = (product: {
    productId: string
    name: string
    brand: string
    price: number
    originalPrice?: number
    imageUrl: string
    slug: string
    inStock: boolean
  }) => {
    // Ajouter au panier
    addItem(product)
    
    // Ouvrir le drawer après un petit délai pour laisser le store se mettre à jour
    setTimeout(() => {
      openCart()
    }, 300)
  }

  /**
   * Remplace le panier avec un seul produit (pour "Acheter maintenant")
   * et redirige vers le checkout
   */
  const buyNow = (product: {
    productId: string
    name: string
    brand: string
    price: number
    originalPrice?: number
    imageUrl: string
    slug: string
    inStock: boolean
  }, quantity: number = 1) => {
    // Remplacer le panier avec ce produit uniquement
    replaceCartWithSingleItem(product, quantity)
    
    // Rediriger vers checkout après un court délai
    setTimeout(() => {
      window.location.href = '/checkout'
    }, 200)
  }

  return {
    // États
    isOpen,
    itemsCount,
    total,
    subtotal,
    
    // Actions
    openCart,
    closeCart,
    addToCartAndOpen,
    buyNow
  }
}

export default useCartDrawer