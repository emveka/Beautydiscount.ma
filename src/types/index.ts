// types/index.ts - VERSION UNIFIÉE ET CORRIGÉE

import { Timestamp } from 'firebase/firestore';

/**
 * ✅ Interface principale pour les produits - VERSION CORRIGÉE
 * Structure compatible avec Firebase + Analytics + Pages
 */
export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  // ✅ CORRECTION : categories optionnel avec subcategory optionnel
  categories?: Array<{
    category: string;
    subcategory?: string;
  }>;
  // ✅ CORRECTION : price obligatoire (utilisé partout dans l'app)
  price: number;
  originalPrice?: number;
  discount?: number;
  prixAchat?: number;
  title?: string;
  shortSEOdescription?: string;
  longSEOdescription?: string;
  shortDescription?: string;
  images?: string[];
  mainImage?: string;
  // ✅ CORRECTION : inStock obligatoire (utilisé dans la logique métier)
  inStock: boolean;
  quantity?: number;
  sku?: string;
  codeBarre?: string;
  contenance?: string;
  specifications?: Record<string, unknown>; // ✅ unknown au lieu de string pour plus de flexibilité
  featured?: boolean;
  canonicalPath?: string; // ✅ CORRECTION : optionnel
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * ✅ Interface pour les produits sérialisés (pour Server/Client Components)
 * Version sans Timestamps Firebase pour éviter les erreurs de sérialisation
 */
export interface SerializedProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categories?: Array<{
    category: string;
    subcategory?: string;
  }>;
  price: number;
  originalPrice?: number;
  discount?: number;
  prixAchat?: number;
  title?: string;
  shortSEOdescription?: string;
  longSEOdescription?: string;
  shortDescription?: string;
  images?: string[];
  mainImage?: string;
  inStock: boolean;
  quantity?: number;
  sku?: string;
  codeBarre?: string;
  contenance?: string;
  specifications?: Record<string, unknown>;
  featured?: boolean;
  canonicalPath?: string;
  // ✅ Timestamps sérialisés en strings
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ✅ Interface pour les catégories - VERSION CORRIGÉE
 */
export interface Category {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  subcategories?: string[];
  imageUrl?: string;
  mainImage?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * ✅ Interface pour les catégories sérialisées
 */
export interface SerializedCategory {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  subcategories?: string[];
  imageUrl?: string;
  mainImage?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ✅ Interface pour les sous-catégories - VERSION CORRIGÉE
 */
export interface Subcategory {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  parentCategory: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * ✅ Interface pour les sous-catégories sérialisées
 */
export interface SerializedSubcategory {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  parentCategory: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ✅ Interface pour les éléments du panier - VERSION CORRIGÉE ET COMPLÈTE
 */
export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number; // ✅ AJOUTÉ : pour afficher les promotions
  imageUrl: string;
  slug: string; // ✅ AJOUTÉ : pour la navigation
  quantity: number;
  inStock: boolean; // ✅ AJOUTÉ : pour la validation
}

/**
 * ✅ Interface pour les produits similaires (version simplifiée) - CORRIGÉE
 */
export interface SimilarProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  mainImage: string;
  slug: string;
}

/**
 * ✅ Interface pour la structure des catégories dans les produits - CORRIGÉE
 */
export interface CategoryItem {
  category: string;
  subcategory?: string; // ✅ CORRECTION : optionnel
}

/**
 * ✅ Interface pour les options de filtres - CORRIGÉE
 */
export interface FilterOptions {
  brands: string[];
  priceRanges: Array<{
    label: string;
    min: number;
    max: number;
  }>;
  subcategories: SerializedSubcategory[]; // ✅ CORRECTION : utilise le type sérialisé
}

/**
 * ✅ Interface pour les métadonnées de page
 */
export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
}

/**
 * ✅ Types utilitaires
 */
export type ProductStatus = 'draft' | 'published' | 'archived';
export type StockStatus = 'in_stock' | 'out_of_stock' | 'low_stock';
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

/**
 * ✅ Interface pour les avis clients
 */
export interface Review {
  id: string;
  productId: string;
  customerName: string;
  rating: number;
  comment: string;
  verified: boolean;
  createdAt: Timestamp;
}

/**
 * ✅ Interface pour les commandes - CORRIGÉE
 */
export interface Order {
  id: string;
  customerEmail: string;
  customerPhone: string;
  customerName: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * ✅ Interface pour les bannières/promotions
 */
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  isActive: boolean;
  order: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * 🎯 TYPES POUR ANALYTICS - ALIGNÉS AVEC LE COMPOSANT ANALYTICS
 */

/**
 * ✅ Interface pour les produits dans Analytics (compatible avec trackEcommerce)
 */
export interface AnalyticsProduct {
  productId: string;
  name: string;
  brand: string;
  categories?: Array<{ category: string; subcategory?: string }>;
  price: number;
}

/**
 * ✅ Interface pour les éléments du panier dans Analytics
 */
export interface AnalyticsCartItem {
  productId: string;
  name: string;
  brand: string;
  categories?: Array<{ category: string; subcategory?: string }>;
  price: number;
  quantity: number;
}

/**
 * 🛠️ FONCTIONS UTILITAIRES DE CONVERSION
 */

/**
 * ✅ Convertit un Product en AnalyticsProduct
 */
export function toAnalyticsProduct(product: Product | SerializedProduct): AnalyticsProduct {
  return {
    productId: product.id,
    name: product.name,
    brand: product.brand,
    categories: product.categories || [],
    price: product.price
  };
}

/**
 * ✅ Convertit un CartItem en AnalyticsCartItem
 */
export function toAnalyticsCartItem(cartItem: CartItem): AnalyticsCartItem {
  return {
    productId: cartItem.productId,
    name: cartItem.name,
    brand: cartItem.brand,
    categories: [], // Les CartItems n'ont pas de categories, on peut les récupérer si besoin
    price: cartItem.price,
    quantity: cartItem.quantity
  };
}

/**
 * ✅ Sérialise un Product Firebase en SerializedProduct
 */
export function serializeProduct(product: Product): SerializedProduct {
  return {
    ...product,
    createdAt: product.createdAt?.toDate?.()?.toISOString?.(),
    updatedAt: product.updatedAt?.toDate?.()?.toISOString?.()
  };
}

/**
 * ✅ Sérialise une Category Firebase en SerializedCategory
 */
export function serializeCategory(category: Category): SerializedCategory {
  return {
    ...category,
    createdAt: category.createdAt?.toDate?.()?.toISOString?.(),
    updatedAt: category.updatedAt?.toDate?.()?.toISOString?.()
  };
}

/**
 * ✅ Sérialise une Subcategory Firebase en SerializedSubcategory
 */
export function serializeSubcategory(subcategory: Subcategory): SerializedSubcategory {
  return {
    ...subcategory,
    createdAt: subcategory.createdAt?.toDate?.()?.toISOString?.(),
    updatedAt: subcategory.updatedAt?.toDate?.()?.toISOString?.()
  };
}