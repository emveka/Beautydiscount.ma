// components/Analytics.tsx - Version avec types unifiés depuis types/index.ts
'use client'
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AnalyticsProduct, AnalyticsCartItem } from '@/types/index'; // ✅ Import des types unifiés

// 📊 Types pour les événements e-commerce - UTILISE LES TYPES UNIFIÉS
interface ProductItem {
  item_id: string;
  item_name: string;
  item_brand: string;
  item_category: string;
  price: number;
  quantity: number;
}

// ✅ Plus besoin de redéfinir, on utilise les types de types/index.ts
// Les interfaces Product et CartItem sont maintenant importées

// 📊 Types pour Core Web Vitals
interface WebVitalMetric {
  name: string;
  id: string;
  value: number;
  delta?: number;
  entries?: PerformanceEntry[];
}

// 🎯 Configuration Analytics
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX';

// 📊 Types globaux pour gtag
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

/**
 * 📊 TRACKING DES PAGES VUES
 */
export function usePageTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      // 🎯 Track page view avec paramètres détaillés
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
      
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_location: window.location.href,
        page_title: document.title,
        page_path: url,
        // 🇲🇦 Données spécifiques Maroc
        custom_map: {
          'custom_dimension_1': 'user_country',
          'custom_dimension_2': 'page_type'
        },
        user_country: 'MA',
        page_type: getPageType(pathname)
      });

      // 📊 Track spécial pour les pages produits
      if (pathname.includes('/product/')) {
        window.gtag('event', 'page_view_product', {
          product_slug: pathname.split('/').pop(),
          page_location: window.location.href
        });
      }

      // 🏷️ Track spécial pour les catégories
      if (pathname.match(/^\/[^\/]+$/)) {
        window.gtag('event', 'page_view_category', {
          category_slug: pathname.slice(1),
          page_location: window.location.href
        });
      }
    }
  }, [pathname, searchParams]);
}

/**
 * 🏷️ Détermine le type de page pour Analytics
 */
function getPageType(pathname: string): string {
  if (pathname === '/') return 'homepage';
  if (pathname.includes('/product/')) return 'product';
  if (pathname.includes('/conseils-beaute')) return 'blog';
  if (pathname === '/promotions') return 'promotions';
  if (pathname === '/checkout') return 'checkout';
  if (pathname === '/panier') return 'cart';
  if (pathname.match(/^\/[^\/]+$/)) return 'category';
  if (pathname.match(/^\/[^\/]+\/[^\/]+$/)) return 'subcategory';
  return 'other';
}

/**
 * ✅ CORRECTION : Fonction utilitaire pour extraire la catégorie principale
 */
function getMainCategory(categories?: Array<{ category: string; subcategory?: string }>): string {
  if (!categories || categories.length === 0) return 'Unknown';
  return categories[0].category || 'Unknown';
}

/**
 * 🚀 CORE WEB VITALS MONITORING
 */
export function useCoreWebVitals() {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 📊 Import dynamique pour éviter d'impacter les performances
      import('web-vitals').then((webVitals) => {
        
        // 🎯 Fonction générique pour envoyer les métriques
        function sendToGoogleAnalytics(metric: WebVitalMetric) {
          if (window.gtag) {
            // 📊 Détection du type de connexion et mémoire (avec fallbacks)
            const nav = navigator as Navigator & {
              connection?: { effectiveType?: string };
              deviceMemory?: number;
            };

            window.gtag('event', metric.name, {
              event_category: 'Web Vitals',
              event_label: metric.id,
              value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
              non_interaction: true,
              // 🎯 Données personnalisées pour analyse
              connection_type: nav.connection?.effectiveType || 'unknown',
              device_memory: nav.deviceMemory || 'unknown'
            });
          }

          // 📊 Log pour développement
          console.log(`📊 Core Web Vital - ${metric.name}:`, Math.round(metric.value), 'ms');
        }

        // 🔥 Mesures critiques pour le SEO - avec la nouvelle API web-vitals v3
        if (webVitals.onCLS) webVitals.onCLS(sendToGoogleAnalytics);  // Cumulative Layout Shift
        if (webVitals.onINP) webVitals.onINP(sendToGoogleAnalytics);  // Interaction to Next Paint (remplace FID)
        if (webVitals.onFCP) webVitals.onFCP(sendToGoogleAnalytics);  // First Contentful Paint
        if (webVitals.onLCP) webVitals.onLCP(sendToGoogleAnalytics);  // Largest Contentful Paint
        if (webVitals.onTTFB) webVitals.onTTFB(sendToGoogleAnalytics); // Time to First Byte
        
        // 📊 Fallback pour les anciennes versions
        if (webVitals.onFID) webVitals.onFID(sendToGoogleAnalytics);  // First Input Delay (legacy)
      });
    }
  }, []);
}

/**
 * 🛒 TRACKING E-COMMERCE EVENTS - VERSION CORRIGÉE
 */
const trackEcommerce = {
  // 👀 Vue produit - VERSION CORRIGÉE
  viewItem: (product: AnalyticsProduct) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'view_item', {
        currency: 'MAD',
        value: product.price,
        items: [{
          item_id: product.productId,
          item_name: product.name,
          item_brand: product.brand,
          item_category: getMainCategory(product.categories), // ✅ CORRECTION : Fonction sûre
          price: product.price,
          quantity: 1
        }]
      });
    }
  },

  // 🛒 Ajout au panier - VERSION CORRIGÉE
  addToCart: (product: AnalyticsProduct, quantity: number = 1) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'add_to_cart', {
        currency: 'MAD',
        value: product.price * quantity,
        items: [{
          item_id: product.productId,
          item_name: product.name,
          item_brand: product.brand,
          item_category: getMainCategory(product.categories), // ✅ CORRECTION : Fonction sûre
          price: product.price,
          quantity: quantity
        }]
      });
    }
  },

  // 💳 Début checkout - VERSION CORRIGÉE
  beginCheckout: (cartItems: AnalyticsCartItem[], totalValue: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'begin_checkout', {
        currency: 'MAD',
        value: totalValue,
        items: cartItems.map((item): ProductItem => ({
          item_id: item.productId,
          item_name: item.name,
          item_brand: item.brand,
          item_category: getMainCategory(item.categories), // ✅ CORRECTION : Fonction sûre
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  },

  // ✅ Achat complété - VERSION CORRIGÉE
  purchase: (transactionId: string, cartItems: AnalyticsCartItem[], totalValue: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: transactionId,
        currency: 'MAD',
        value: totalValue,
        items: cartItems.map((item): ProductItem => ({
          item_id: item.productId,
          item_name: item.name,
          item_brand: item.brand,
          item_category: getMainCategory(item.categories), // ✅ CORRECTION : Fonction sûre
          price: item.price,
          quantity: item.quantity
        }))
      });
    }
  },

  // 🔍 Recherche
  search: (searchTerm: string, resultsCount: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
        results_count: resultsCount
      });
    }
  }
};

/**
 * 🎯 COMPOSANT PRINCIPAL ANALYTICS
 */
const Analytics: React.FC = () => {
  // 📊 Hook automatique pour le tracking des pages
  usePageTracking();
  
  // 🚀 Hook automatique pour Core Web Vitals
  useCoreWebVitals();

  // 🔧 Initialisation Google Analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
      // 📊 Chargement asynchrone de GA4
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      script.async = true;
      document.head.appendChild(script);

      // 🎯 Configuration GA4
      script.onload = () => {
        window.dataLayer = window.dataLayer || [];
        
        // ✅ Version corrigée avec rest parameters
        window.gtag = function gtag(...args: unknown[]) {
          window.dataLayer.push(args);
        };
        
        window.gtag('js', new Date());
        window.gtag('config', GA_MEASUREMENT_ID, {
          // 🇲🇦 Configuration spécifique Maroc
          country: 'MA',
          currency: 'MAD',
          // 🔒 Privacy-friendly
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          // 🚀 Performance
          send_page_view: false // On gère manuellement
        });
      };
    }
  }, []);

  // Ce composant ne rend rien visuellement
  return null;
};

export default Analytics;

// 🎯 Export des fonctions utilitaires pour utilisation dans d'autres composants
export { trackEcommerce };