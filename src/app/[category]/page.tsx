// app/[category]/page.tsx - SERVER COMPONENT (correction finale)
import React from 'react';
import { Metadata } from 'next';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CategoryPageClient from './CategoryPageClient';

/**
 * Interface pour les données de catégorie Firebase (version sérialisée UNIQUEMENT)
 */
interface CategoryData {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  subcategories?: string[];
  imageUrl?: string;
  mainImage?: string;
  // ✅ CORRECTION : UNIQUEMENT des strings, pas d'objets Firebase
  createdAt?: string;
  updatedAt?: string;
}

/**
 * ✅ CORRECTION : Fonction de sérialisation robuste
 */
function convertFirebaseDocumentToPlainObject(docData: Record<string, unknown>): CategoryData {
  console.log('🔍 Données brutes Firebase:', docData); // Debug

  const result: CategoryData = {
    id: String(docData.id || ''),
    name: String(docData.name || ''),
    title: String(docData.title || ''),
    slug: String(docData.slug || ''),
    shortSEOdescription: String(docData.shortSEOdescription || ''),
    longSEOdescription: String(docData.longSEOdescription || ''),
    subcategories: Array.isArray(docData.subcategories) ? docData.subcategories.map(String) : [],
    imageUrl: docData.imageUrl ? String(docData.imageUrl) : undefined,
    mainImage: docData.mainImage ? String(docData.mainImage) : undefined,
  };

  // ✅ CORRECTION : Conversion explicite des timestamps
  if (docData.createdAt) {
    if (typeof docData.createdAt === 'object' && docData.createdAt !== null && 'toDate' in docData.createdAt) {
      // Timestamp Firebase avec méthode toDate
      const timestamp = docData.createdAt as { toDate(): Date };
      result.createdAt = timestamp.toDate().toISOString();
    } else if (typeof docData.createdAt === 'object' && docData.createdAt !== null && 'seconds' in docData.createdAt) {
      // Timestamp Firebase avec propriété seconds
      const timestamp = docData.createdAt as { seconds: number; nanoseconds?: number };
      result.createdAt = new Date(timestamp.seconds * 1000).toISOString();
    } else if (typeof docData.createdAt === 'string') {
      // Déjà une string
      result.createdAt = docData.createdAt;
    }
  }

  if (docData.updatedAt) {
    if (typeof docData.updatedAt === 'object' && docData.updatedAt !== null && 'toDate' in docData.updatedAt) {
      const timestamp = docData.updatedAt as { toDate(): Date };
      result.updatedAt = timestamp.toDate().toISOString();
    } else if (typeof docData.updatedAt === 'object' && docData.updatedAt !== null && 'seconds' in docData.updatedAt) {
      const timestamp = docData.updatedAt as { seconds: number; nanoseconds?: number };
      result.updatedAt = new Date(timestamp.seconds * 1000).toISOString();
    } else if (typeof docData.updatedAt === 'string') {
      result.updatedAt = docData.updatedAt;
    }
  }

  console.log('✅ Données sérialisées:', result); // Debug

  return result;
}

/**
 * 🆕 MÉTADONNÉES SEO DYNAMIQUES - SERVER COMPONENT
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ category: string }> 
}): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    
    const categoriesRef = collection(db, 'categories');
    const categoryQuery = query(categoriesRef, where('slug', '==', resolvedParams.category));
    const categorySnapshot = await getDocs(categoryQuery);

    if (categorySnapshot.empty) {
      return {
        title: 'Catégorie non trouvée | BeautyDiscount.ma',
        description: 'Cette catégorie n\'existe pas sur BeautyDiscount.ma',
        robots: { index: false, follow: false }
      };
    }

    const categoryDoc = categorySnapshot.docs[0];
    const rawData = categoryDoc.data();

    const categoryName = String(rawData.name || 'Catégorie');
    const categoryDescription = String(rawData.shortSEOdescription || '');
    const categoryMainImage = rawData.mainImage ? String(rawData.mainImage) : undefined;

    const title = `${categoryName} - Cosmétiques au Maroc | BeautyDiscount.ma`;
    const description = `Découvrez notre sélection ${categoryName.toLowerCase()} de grandes marques à prix discount au Maroc. ${categoryDescription} Livraison gratuite dès 300 DH.`;

    return {
      title,
      description,
      keywords: [
        categoryName.toLowerCase(),
        'maroc',
        'cosmétiques',
        'beauté',
        'prix discount',
        'livraison gratuite',
        'casablanca'
      ],
      metadataBase: new URL(
        process.env.NODE_ENV === 'production' 
          ? 'https://beautydiscount.ma' 
          : 'http://localhost:3000'
      ),
      openGraph: {
        title,
        description,
        type: 'website',
        locale: 'fr_MA',
        url: `https://beautydiscount.ma/${resolvedParams.category}`,
        siteName: 'BeautyDiscount.ma',
        images: categoryMainImage ? [
          {
            url: categoryMainImage,
            width: 1200,
            height: 630,
            alt: `${categoryName} - BeautyDiscount.ma`
          }
        ] : []
      },
      alternates: {
        canonical: `https://beautydiscount.ma/${resolvedParams.category}`
      }
    };
  } catch (error) {
    console.error('Erreur dans generateMetadata:', error);
    return {
      title: 'Cosmétiques BeautyDiscount.ma',
      description: 'Découvrez notre sélection de cosmétiques au Maroc'
    };
  }
}

/**
 * Server Component - Page Catégorie
 */
const CategoryPage: React.FC<{ 
  params: Promise<{ category: string }> 
}> = async ({ params }) => {
  const resolvedParams = await params;
  
  // Charger les données initiales côté serveur pour le SEO
  let initialCategoryData: CategoryData | null = null;
  
  try {
    const categoriesRef = collection(db, 'categories');
    const categoryQuery = query(categoriesRef, where('slug', '==', resolvedParams.category));
    const categorySnapshot = await getDocs(categoryQuery);

    if (!categorySnapshot.empty) {
      const categoryDoc = categorySnapshot.docs[0];
      
      // ✅ CORRECTION CRITIQUE : Conversion complète en objet plain
      const rawFirebaseData = categoryDoc.data();
      
      initialCategoryData = convertFirebaseDocumentToPlainObject({
        id: categoryDoc.id,
        ...rawFirebaseData
      });

      console.log('🚀 Données finales envoyées au Client:', initialCategoryData); // Debug
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement initial de la catégorie:', error);
  }

  // Vérification finale avant passage au Client Component
  if (initialCategoryData) {
    // ✅ Vérifier qu'il n'y a pas d'objets complexes
    const hasComplexObjects = Object.values(initialCategoryData).some(value => 
      value !== null && 
      typeof value === 'object' && 
      !Array.isArray(value) &&
      typeof value !== 'string'
    );

    if (hasComplexObjects) {
      console.error('⚠️  ATTENTION: Des objets complexes détectés!', initialCategoryData);
      // Nettoyer à nouveau si nécessaire
      initialCategoryData = JSON.parse(JSON.stringify(initialCategoryData));
    }
  }

  return (
    <CategoryPageClient 
      categorySlug={resolvedParams.category}
      initialCategoryData={initialCategoryData}
    />
  );
};

export default CategoryPage;