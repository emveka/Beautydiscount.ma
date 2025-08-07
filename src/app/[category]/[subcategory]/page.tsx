// app/[category]/[subcategory]/page.tsx - SERVER COMPONENT (types corrigés)
import React from 'react';
import { Metadata } from 'next';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import SubcategoryPageClient from './SubcategoryPageClient';

/**
 * ✅ TYPES FIREBASE CORRECTS
 */
interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

interface RawFirebaseDocument {
  [key: string]: unknown;
  id?: string;
  name?: string;
  title?: string;
  slug?: string;
  shortSEOdescription?: string;
  longSEOdescription?: string;
  parentCategory?: string;
  createdAt?: FirebaseTimestamp | Timestamp;
  updatedAt?: FirebaseTimestamp | Timestamp;
}

/**
 * Interface pour les données sérialisées (sans objets Firebase complexes)
 */
interface CategoryData {
  id: string;
  name: string;
  title: string;
  slug: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SubcategoryData {
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
 * ✅ CORRECTION : Fonction utilitaire pour sérialiser les données Firebase avec types corrects
 */
function serializeCategoryData(data: RawFirebaseDocument): CategoryData {
  const result: CategoryData = {
    id: typeof data.id === 'string' ? data.id : '',
    name: typeof data.name === 'string' ? data.name : '',
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    shortSEOdescription: typeof data.shortSEOdescription === 'string' ? data.shortSEOdescription : '',
    longSEOdescription: typeof data.longSEOdescription === 'string' ? data.longSEOdescription : '',
  };
  
  // Traiter les timestamps pour CategoryData
  if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt !== null) {
    if ('toDate' in data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = data.createdAt as FirebaseTimestamp;
      result.createdAt = timestamp.toDate().toISOString();
    } else if ('seconds' in data.createdAt && typeof (data.createdAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = data.createdAt as { seconds: number; nanoseconds?: number };
      result.createdAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }

  if (data.updatedAt && typeof data.updatedAt === 'object' && data.updatedAt !== null) {
    if ('toDate' in data.updatedAt && typeof (data.updatedAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = data.updatedAt as FirebaseTimestamp;
      result.updatedAt = timestamp.toDate().toISOString();
    } else if ('seconds' in data.updatedAt && typeof (data.updatedAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = data.updatedAt as { seconds: number; nanoseconds?: number };
      result.updatedAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }
  
  return result;
}

function serializeSubcategoryData(data: RawFirebaseDocument): SubcategoryData {
  const result: SubcategoryData = {
    id: typeof data.id === 'string' ? data.id : '',
    name: typeof data.name === 'string' ? data.name : '',
    title: typeof data.title === 'string' ? data.title : '',
    slug: typeof data.slug === 'string' ? data.slug : '',
    shortSEOdescription: typeof data.shortSEOdescription === 'string' ? data.shortSEOdescription : '',
    longSEOdescription: typeof data.longSEOdescription === 'string' ? data.longSEOdescription : '',
    parentCategory: typeof data.parentCategory === 'string' ? data.parentCategory : '',
  };
  
  // Traiter les timestamps pour SubcategoryData
  if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt !== null) {
    if ('toDate' in data.createdAt && typeof (data.createdAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = data.createdAt as FirebaseTimestamp;
      result.createdAt = timestamp.toDate().toISOString();
    } else if ('seconds' in data.createdAt && typeof (data.createdAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = data.createdAt as { seconds: number; nanoseconds?: number };
      result.createdAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }

  if (data.updatedAt && typeof data.updatedAt === 'object' && data.updatedAt !== null) {
    if ('toDate' in data.updatedAt && typeof (data.updatedAt as { toDate?: unknown }).toDate === 'function') {
      const timestamp = data.updatedAt as FirebaseTimestamp;
      result.updatedAt = timestamp.toDate().toISOString();
    } else if ('seconds' in data.updatedAt && typeof (data.updatedAt as { seconds?: unknown }).seconds === 'number') {
      const timestamp = data.updatedAt as { seconds: number; nanoseconds?: number };
      result.updatedAt = new Date(timestamp.seconds * 1000).toISOString();
    }
  }
  
  return result;
}

/**
 * ✅ CORRECTION : Suppression des fonctions inutiles
 */

/**
 * 🆕 MÉTADONNÉES SEO DYNAMIQUES POUR SOUS-CATÉGORIES (types corrigés)
 */
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ category: string; subcategory: string }> 
}): Promise<Metadata> {
  try {
    // ✅ CORRECTION : Await params avant utilisation
    const resolvedParams = await params;
    
    // Charger la catégorie parente
    const categoriesRef = collection(db, 'categories');
    const categoryQuery = query(categoriesRef, where('slug', '==', resolvedParams.category));
    const categorySnapshot = await getDocs(categoryQuery);

    // Charger la sous-catégorie
    const subcategoriesRef = collection(db, 'subcategories');
    const subcategoryQuery = query(
      subcategoriesRef,
      where('slug', '==', resolvedParams.subcategory),
      where('parentCategory', '==', resolvedParams.category)
    );
    const subcategorySnapshot = await getDocs(subcategoryQuery);

    if (categorySnapshot.empty || subcategorySnapshot.empty) {
      return {
        title: 'Sous-catégorie non trouvée | BeautyDiscount.ma',
        description: 'Cette sous-catégorie n\'existe pas sur BeautyDiscount.ma',
        robots: { index: false, follow: false }
      };
    }

    const categoryDoc = categorySnapshot.docs[0];
    const subcategoryDoc = subcategorySnapshot.docs[0];
    
    // ✅ TYPES SÛRS pour les données Firebase
    const categoryData = categoryDoc.data() as Record<string, unknown>;
    const subcategoryData = subcategoryDoc.data() as Record<string, unknown>;

    const categoryName = typeof categoryData.name === 'string' ? categoryData.name : 'Catégorie';
    const subcategoryName = typeof subcategoryData.name === 'string' ? subcategoryData.name : 'Sous-catégorie';
    const subcategoryDescription = typeof subcategoryData.shortSEOdescription === 'string' ? subcategoryData.shortSEOdescription : '';

    const title = `${subcategoryName} - ${categoryName} | BeautyDiscount.ma`;
    const description = `Découvrez notre sélection ${subcategoryName.toLowerCase()} dans la catégorie ${categoryName.toLowerCase()} au Maroc. ${subcategoryDescription} Livraison gratuite dès 300 DH.`;

    return {
      title,
      description,
      keywords: [
        subcategoryName.toLowerCase(),
        categoryName.toLowerCase(),
        'maroc',
        'cosmétiques',
        'beauté',
        'Kératine',
        'Lissage Brésilien'
      ],
      // ✅ CORRECTION : Ajouter metadataBase
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
        url: `https://beautydiscount.ma/${resolvedParams.category}/${resolvedParams.subcategory}`,
        siteName: 'BeautyDiscount.ma'
      },
      alternates: {
        canonical: `https://beautydiscount.ma/${resolvedParams.category}/${resolvedParams.subcategory}`
      }
    };
  } catch (error) {
    console.error('Erreur dans generateMetadata (subcategory):', error);
    return {
      title: 'Cosmétiques BeautyDiscount.ma',
      description: 'Découvrez notre sélection de cosmétiques au Maroc'
    };
  }
}

/**
 * Server Component - Page Sous-Catégorie (types corrigés)
 */
const SubcategoryPage: React.FC<{ 
  params: Promise<{ category: string; subcategory: string }> 
}> = async ({ params }) => {
  // ✅ CORRECTION : Await params avant utilisation
  const resolvedParams = await params;
  
  // Charger les données initiales côté serveur pour le SEO
  let initialCategoryData: CategoryData | null = null;
  let initialSubcategoryData: SubcategoryData | null = null;
  
  try {
    // 1. Charger la catégorie parente
    const categoriesRef = collection(db, 'categories');
    const categoryQuery = query(categoriesRef, where('slug', '==', resolvedParams.category));
    const categorySnapshot = await getDocs(categoryQuery);

    if (!categorySnapshot.empty) {
      const categoryDoc = categorySnapshot.docs[0];
      const rawCategoryData: RawFirebaseDocument = {
        id: categoryDoc.id,
        ...categoryDoc.data()
      };
      
      // ✅ CORRECTION : Utilisation de la fonction spécifique
      const serializedData = serializeCategoryData(rawCategoryData);
      initialCategoryData = serializedData;
    }

    // 2. Charger la sous-catégorie
    const subcategoriesRef = collection(db, 'subcategories');
    const subcategoryQuery = query(
      subcategoriesRef,
      where('slug', '==', resolvedParams.subcategory),
      where('parentCategory', '==', resolvedParams.category)
    );
    const subcategorySnapshot = await getDocs(subcategoryQuery);

    if (!subcategorySnapshot.empty) {
      const subcategoryDoc = subcategorySnapshot.docs[0];
      const rawSubcategoryData: RawFirebaseDocument = {
        id: subcategoryDoc.id,
        ...subcategoryDoc.data()
      };
      
      // ✅ CORRECTION : Utilisation de la fonction spécifique
      const serializedData = serializeSubcategoryData(rawSubcategoryData);
      initialSubcategoryData = serializedData;
    }
  } catch (error) {
    console.error('Erreur lors du chargement initial de la sous-catégorie:', error);
  }

  // Rendu du Client Component avec les données initiales sérialisées
  return (
    <SubcategoryPageClient 
      categorySlug={resolvedParams.category}
      subcategorySlug={resolvedParams.subcategory}
      initialCategoryData={initialCategoryData}
      initialSubcategoryData={initialSubcategoryData}
    />
  );
};

export default SubcategoryPage;