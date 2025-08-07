// app/product/[slug]/page.tsx - SERVER COMPONENT (pour SEO)
import React from 'react';
import { Metadata } from 'next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductPageClient from './ProductPageClient';

/**
 * Interface pour les données de produit (version sérialisée)
 */
interface ProductData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categories?: Array<{ category: string; subcategory: string }>;
  price: number;
  originalPrice?: number;
  discount?: number;
  title?: string;
  shortSEOdescription?: string;
  longSEOdescription?: string;
  shortDescription?: string;
  images?: string[];
  mainImage?: string;
  inStock: boolean;
  quantity?: number;
  sku?: string;
  contenance?: string;
  specifications?: Record<string, unknown>;
  canonicalPath?: string;
  // ✅ Timestamps sérialisés
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ✅ CORRECTION : Fonction de sérialisation pour objets Firebase
 */
function serializeProductData(docData: Record<string, unknown>, docId: string): ProductData {
  const result: ProductData = {
    id: docId,
    slug: String(docData.slug || ''),
    name: String(docData.name || ''),
    brand: String(docData.brand || ''),
    categories: Array.isArray(docData.categories) ? docData.categories : [],
    price: Number(docData.price) || 0,
    originalPrice: docData.originalPrice ? Number(docData.originalPrice) : undefined,
    discount: docData.discount ? Number(docData.discount) : undefined,
    title: docData.title ? String(docData.title) : undefined,
    shortSEOdescription: docData.shortSEOdescription ? String(docData.shortSEOdescription) : undefined,
    longSEOdescription: docData.longSEOdescription ? String(docData.longSEOdescription) : undefined,
    shortDescription: docData.shortDescription ? String(docData.shortDescription) : undefined,
    images: Array.isArray(docData.images) ? docData.images.map(String) : [],
    mainImage: docData.mainImage ? String(docData.mainImage) : undefined,
    inStock: docData.inStock !== false,
    quantity: docData.quantity ? Number(docData.quantity) : undefined,
    sku: docData.sku ? String(docData.sku) : undefined,
    contenance: docData.contenance ? String(docData.contenance) : undefined,
    specifications: docData.specifications && typeof docData.specifications === 'object' 
      ? docData.specifications as Record<string, unknown> 
      : undefined,
    canonicalPath: docData.canonicalPath ? String(docData.canonicalPath) : undefined,
  };

  // Traitement des timestamps Firebase
  if (docData.createdAt && typeof docData.createdAt === 'object' && docData.createdAt !== null) {
    if ('toDate' in docData.createdAt && typeof (docData.createdAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = docData.createdAt as { toDate(): Date };
      result.createdAt = timestamp.toDate().toISOString();
    } else if ('seconds' in docData.createdAt && typeof (docData.createdAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = docData.createdAt as { seconds: number };
      result.createdAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }

  if (docData.updatedAt && typeof docData.updatedAt === 'object' && docData.updatedAt !== null) {
    if ('toDate' in docData.updatedAt && typeof (docData.updatedAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = docData.updatedAt as { toDate(): Date };
      result.updatedAt = timestamp.toDate().toISOString();
    } else if ('seconds' in docData.updatedAt && typeof (docData.updatedAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = docData.updatedAt as { seconds: number };
      result.updatedAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }

  return result;
}

/**
 * 🆕 MÉTADONNÉES SEO DYNAMIQUES - SERVER COMPONENT
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> // ✅ CORRECTION Next.js 15
}): Promise<Metadata> {
  try {
    // ✅ CORRECTION : Await params
    const resolvedParams = await params;
    
    // 📊 Charger le produit depuis Firebase
    const productsRef = collection(db, 'products');
    const productQuery = query(productsRef, where('slug', '==', resolvedParams.slug));
    const productSnapshot = await getDocs(productQuery);

    if (productSnapshot.empty) {
      return {
        title: 'Produit non trouvé | BeautyDiscount.ma',
        description: 'Ce produit n\'est plus disponible sur BeautyDiscount.ma',
        robots: {
          index: false,
          follow: false
        }
      };
    }

    const productDoc = productSnapshot.docs[0];
    const product = productDoc.data();

    // Types sûrs pour les données Firebase
    const productName = String(product.name || 'Produit');
    const productBrand = String(product.brand || '');
    const productPrice = Number(product.price) || 0;
    const productOriginalPrice = product.originalPrice ? Number(product.originalPrice) : undefined;
    const productDescription = String(product.shortDescription || 'Produit authentique de qualité.');
    const productMainImage = product.mainImage ? String(product.mainImage) : undefined;

    // 🏷️ Calcul automatique des informations SEO avec vérifications TypeScript
    const discount = productOriginalPrice && productOriginalPrice > productPrice 
      ? Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
      : 0;
    
    const discountText = discount > 0 ? ` - ${discount}% de réduction` : '';
    const savings = discount > 0 && productOriginalPrice ? productOriginalPrice - productPrice : 0;
    
    // 🎯 Titre SEO optimisé (max 60 caractères)
    const title = `${productName} ${productBrand} - ${productPrice} DH${discountText} | BeautyDiscount.ma`;
    
    // 📝 Description SEO optimisée (max 160 caractères)
    const description = `Achetez ${productName} de ${productBrand} à ${productPrice} DH au Maroc. ${productDescription} Livraison gratuite dès 300 DH.${savings > 0 ? ` Économisez ${savings} DH !` : ''}`.slice(0, 160);

    // 🏷️ Mots-clés dynamiques intelligents
    const keywords = [
      productName.toLowerCase(),
      productBrand.toLowerCase(),
      'maroc',
      'cosmétiques',
      'beauté',
      'prix discount',
      'livraison gratuite',
      'casablanca',
      // Ajout automatique de la catégorie si disponible
      ...(Array.isArray(product.categories) && product.categories.length > 0 && product.categories[0]?.category 
        ? [String(product.categories[0].category).toLowerCase()] 
        : []
      ),
      // Mots-clés extraits du nom du produit
      ...productName.toLowerCase().split(' ').filter((word: string) => word.length > 3)
    ].filter(Boolean);

    return {
      title,
      description,
      keywords: [...new Set(keywords)], // Supprime les doublons
      
      // ✅ CORRECTION : metadataBase obligatoire
      metadataBase: new URL(
        process.env.NODE_ENV === 'production' 
          ? 'https://beautydiscount.ma' 
          : 'http://localhost:3000'
      ),
      
      // 🌍 Open Graph pour réseaux sociaux
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'fr_MA',
        url: `https://beautydiscount.ma/product/${resolvedParams.slug}`,
        siteName: 'BeautyDiscount.ma',
        images: productMainImage ? [
          {
            url: productMainImage,
            width: 1200,
            height: 1200,
            alt: `${productName} ${productBrand} - BeautyDiscount.ma`
          }
        ] : [
          {
            url: 'https://beautydiscount.ma/og-default-product.jpg',
            width: 1200,
            height: 630,
            alt: 'BeautyDiscount.ma - Cosmétiques au Maroc'
          }
        ]
      },
      
      // 🐦 Twitter Cards
      twitter: {
        card: 'summary_large_image',
        site: '@beautydiscountma',
        title,
        description,
        images: productMainImage ? [productMainImage] : ['https://beautydiscount.ma/og-default-product.jpg']
      },
      
      // 🔗 URL canonique (évite le contenu dupliqué)
      alternates: {
        canonical: `https://beautydiscount.ma/product/${resolvedParams.slug}`
      },
      
      // 📍 Données géographiques pour le Maroc
      other: {
        'product:price:amount': productPrice.toString(),
        'product:price:currency': 'MAD',
        'product:brand': productBrand,
        'product:availability': product.inStock !== false ? 'in stock' : 'out of stock',
        'product:condition': 'new',
        'geo.region': 'MA',
        'geo.placename': 'Maroc',
        'geo.position': '33.5731;-7.5898' // Coordonnées Casablanca
      }
    };

  } catch (error) {
    console.error('Erreur génération métadonnées produit:', error);
    
    // 🚨 Métadonnées de secours
    return {
      title: 'Produit BeautyDiscount.ma - Cosmétiques au Maroc',
      description: 'Découvrez notre sélection de produits de beauté et cosmétiques de grandes marques à prix discount au Maroc.',
    };
  }
}

/**
 * Server Component - Page Produit
 */
const ProductPage: React.FC<{ 
  params: Promise<{ slug: string }> // ✅ CORRECTION Next.js 15
}> = async ({ params }) => {
  // ✅ CORRECTION : Await params
  const resolvedParams = await params;
  
  // Charger les données initiales côté serveur pour le SEO
  let initialProductData: ProductData | null = null;
  
  try {
    const productsRef = collection(db, 'products');
    const productQuery = query(productsRef, where('slug', '==', resolvedParams.slug));
    const productSnapshot = await getDocs(productQuery);

    if (!productSnapshot.empty) {
      const productDoc = productSnapshot.docs[0];
      const rawData = productDoc.data();
      
      // ✅ CORRECTION : Sérialiser les données Firebase
      initialProductData = serializeProductData(rawData, productDoc.id);

      console.log('🚀 Données produit initiales:', initialProductData);
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement initial du produit:', error);
  }

  // Vérification finale avant passage au Client Component
  if (initialProductData) {
    const hasComplexObjects = Object.values(initialProductData).some(value => 
      value !== null && 
      typeof value === 'object' && 
      !Array.isArray(value) &&
      typeof value !== 'string'
    );

    if (hasComplexObjects) {
      console.error('⚠️  ATTENTION: Des objets complexes détectés dans le produit!', initialProductData);
      // Nettoyer si nécessaire
      initialProductData = JSON.parse(JSON.stringify(initialProductData));
    }
  }

  return (
    <ProductPageClient 
      slug={resolvedParams.slug}
      initialProductData={initialProductData}
    />
  );
};

export default ProductPage;