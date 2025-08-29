// app/page.tsx - Version SEO optimisée avec structure sémantique
import { Metadata } from 'next';
import Banner from '@/components/home/Banner';
import ProductCategoryHome from '@/components/home/ProductCategoryHome';
import CategoryHomeOptimized from '@/components/home/CategoryHomeOptimized';

export const metadata: Metadata = {
  title: 'BeautyDiscount.ma - Cosmétiques et Parfums à Prix Réduits au Maroc',
  description: 'Découvrez les meilleures offres beauté : parfums, maquillage, soins visage et corps des plus grandes marques à prix discount au Maroc. Livraison gratuite dès 300 DH.',
  keywords: [
    'cosmétiques maroc', 
    'parfums discount', 
    'maquillage pas cher', 
    'soins beauté maroc', 
    'beautydiscount',
    'casablanca',
    'rabat'
  ],
  openGraph: {
    title: 'BeautyDiscount.ma - Cosmétiques et Parfums à Prix Réduits',
    description: 'Découvrez les meilleures offres beauté : parfums, maquillage, soins visage et corps des plus grandes marques à prix discount au Maroc.',
    type: 'website',
    locale: 'fr_MA',
    url: 'https://beautydiscount.ma',
    siteName: 'BeautyDiscount.ma',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'BeautyDiscount.ma - Cosmétiques au Maroc'
      }
    ]
  },
  alternates: {
    canonical: 'https://beautydiscount.ma'
  },
  other: {
    'geo.region': 'MA',
    'geo.placename': 'Maroc',
    'geo.position': '33.5731;-7.5898' // Coordonnées Casablanca
  }
};

// 🎯 Schema.org JSON-LD pour la page d'accueil
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BeautyDiscount.ma",
  "alternateName": "Beauty Discount Maroc",
  "url": "https://beautydiscount.ma",
  "description": "Site e-commerce spécialisé dans la vente de cosmétiques, parfums et produits de beauté à prix discount au Maroc",
  "inLanguage": "fr-MA",
  "areaServed": {
    "@type": "Country",
    "name": "Maroc"
  },
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://beautydiscount.ma/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BeautyDiscount.ma",
  "url": "https://beautydiscount.ma",
  "logo": "https://beautydiscount.ma/logo.png",
  "sameAs": [
    "https://facebook.com/beautydiscountma",
    "https://instagram.com/beautydiscountma"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+212-6-62-18-53-35",
    "contactType": "Customer Service",
    "areaServed": "MA",
    "availableLanguage": ["French", "Arabic"]
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "MA",
    "addressRegion": "Casablanca-Settat",
    "addressLocality": "Casablanca"
  }
};

export default function HomePage() {
  return (
    <>
      {/* 📊 Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* 🏠 Page d'accueil avec structure sémantique */}
      <main className="min-h-screen bg-gray-50">
        
        {/* 🎯 H1 principal - Important pour SEO */}
        <h1 className="sr-only">
          BeautyDiscount.ma - Cosmétiques, Produits Capillaires, Kératine & Protéines à Prix Discount au Maroc
        </h1>

        {/* 🎨 Section Hero/Banner */}
        <section 
          aria-label="Offres promotionnelles et nouveautés"
          className="relative"
        >
          <Banner />
        </section>

        {/* 🏷️ Section Catégories Principales */}
        <section 
          aria-label="Catégories de produits cosmétiques"
          className="py-2"
        >
          <header className="sr-only">
            <h2>Nos Catégories de Produits Beauté</h2>
          </header>
          
          <CategoryHomeOptimized 
            title="Découvrez nos catégories"
            subtitle="Parfums, maquillage, soins du visage et corps - Toutes les grandes marques"
            backgroundColor="bg-gray-50"
            titleColor="text-rose-400"
            maxCategories={6}
          />
        </section>

        {/* 🆕 Section Lissages Proteines kératine */}
        <section 
          aria-label="Lissage Protéine kératine"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Lissages, Kératine et Protéine Capillaires</h2>
            <p>Découvrez nos produits pour lissage brésilien, tanin et petits kits pour lissages ainsi que les lisseurs professionnels</p>
          </header>
          
          <ProductCategoryHome 
            title="Lissages, Kératines, Protéines"
            categoryLink="/lissages"
            category="lissages"
            backgroundColor="bg-gray-50"
            titleColor="text-rose-400"
            viewAllText="Voir tout"
            randomize={true}  // 🔄 activer le mélange
          />
        </section>

        {/* 📝 Section Contenu SEO - Version redesignée plus jolie */}
<section
  aria-label="À propos de BeautyDiscount.ma"
  className="py-12 bg-gradient-to-br from-gray-50 via-white to-pink-50/30 relative overflow-hidden"
>
  {/* Éléments décoratifs en arrière-plan */}
  <div className="absolute top-0 left-0 w-32 h-32 bg-pink-100/40 rounded-full -translate-x-16 -translate-y-16"></div>
  <div className="absolute bottom-0 right-0 w-40 h-40 bg-rose-100/30 rounded-full translate-x-20 translate-y-20"></div>
  <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-pink-300 rounded-full animate-pulse"></div>
  <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-rose-400 rounded-full animate-pulse delay-1000"></div>
  
  {/* Utilise le même container que les autres sections */}
  <div className="container mx-auto px-2 md:px-4 relative z-10">
    <div className="text-center mb-8">
      {/* Titre avec soulignement rose personnalisé */}
      <div className="inline-block mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 relative">
          Votre Boutique Beauté N°1 au Maroc
          {/* Soulignement rose décoratif */}
          <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-0.5 bg-gradient-to-r from-transparent via-pink-500 to-transparent"></div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-transparent"></div>
        </h2>
      </div>
     
      {/* Conteneur avec effet de carte subtil */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-lg border border-white/50 relative">
          {/* Petit accent décoratif en haut */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-1 bg-gradient-to-r from-pink-400 to-rose-500 rounded-full"></div>
          
          <p className="text-base md:text-lg text-gray-600 leading-relaxed mb-6">
            <strong>BeautyDiscount.ma</strong> est votre destination privilégiée pour tous vos produits capillaires et de beauté au Maroc.
            Nous proposons une large gamme de <strong>cosmétiques, kératine, soins du visage et du corps</strong> des plus grandes marques internationales à des prix imbattables.
            Profitez de notre <strong>livraison dans tout le Maroc</strong> avec possibilité de <strong>paiement à la livraison</strong> pour votre tranquillité d&apos;esprit.
          </p>
          
          {/* Petits éléments décoratifs en bas */}
          <div className="flex justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
            <div className="w-2 h-2 bg-rose-300 rounded-full"></div>
            <div className="w-2 h-2 bg-pink-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* 🔥 Section Produits Capillaires */}
        <section 
          aria-label="Nos Produits Capillaires"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Nos Produits Capillaires</h2>
            <p>Vos produits Shampooings, Masques , huiles et sérms pour vos cheveux au maroc</p>
          </header>
          
          <ProductCategoryHome 
            title="Nos Produits Capillaires"
            categoryLink="/soins-capillaires"
            category="soins-capillaires" 
            backgroundColor="bg-gray-50"
            titleColor="text-rose-400"
            viewAllText="Voir tout"
            randomize={true}  // 🔄 activer le mélange
          />
        </section>

        {/* 💰 Section Cosmétiques Coréens */}
        <section 
          aria-label="Nos produits Cosmétiques Coréens"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Nos produits Cosmétiques Coréens</h2>
            <p>Profitez de nos produits cosmétiques coréens comme les sérums, masques et routines K-beauty</p>
          </header>
          
          <ProductCategoryHome 
            title="Cosmétique Coréen"
            categoryLink="/cosmetique-coreen"
            category="cosmetique-coreen"
            backgroundColor="bg-gray-50"
            titleColor="text-rose-400"
            viewAllText="Voir tout"
            randomize={true}  // 🔄 activer le mélange
          />
        </section>

        {/* 🆕 Section Pack Capillaires */}
        <section 
          aria-label="Nos Packs Capillaires"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Nos Packs Capillaires</h2>
            <p>Découvrez nos packs disponibles de vos produits préférés</p>
          </header>
          
          <ProductCategoryHome 
            title="Nos Packs Capillaires"
            categoryLink="/soins-capillaires/pack-capillaires"
            category="pack-capillaires"
            backgroundColor="bg-gray-50"
            titleColor="text-rose-400"
            viewAllText="Voir tout"
            randomize={true}  // 🔄 activer le mélange
          />
        </section>


      </main>
    </>
  );
}