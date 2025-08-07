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
    "telephone": "+212-6-XX-XX-XX-XX",
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
          BeautyDiscount.ma - Cosmétiques, Parfums et Produits de Beauté à Prix Discount au Maroc
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
            titleColor="text-gray-900"
            maxCategories={6}
          />
        </section>

        {/* 🆕 Section Nouveautés */}
        <section 
          aria-label="Dernières nouveautés cosmétiques"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Nouveautés Beauté 2025</h2>
            <p>Découvrez les derniers produits cosmétiques arrivés en magasin</p>
          </header>
          
          <ProductCategoryHome 
            title="Nouveautés"
            categoryLink="/nouveautes"
            category="accessoires"
            backgroundColor="bg-gray-50"
            titleColor="text-gray-900"
            viewAllText="Voir toutes les nouveautés"
          />
        </section>

        {/* 📝 Section Contenu SEO (optionnelle mais recommandée) */}
        <section 
          aria-label="À propos de BeautyDiscount.ma"
          className="py-4 bg-white"
        >
          <div className="container mx-auto px-4 max-w-4xl">
            <header className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Votre Boutique Beauté N°1 au Maroc
              </h2>
            </header>
            
            <div className="prose max-w-none text-gray-600 text-center">
              <p className="text-lg leading-relaxed mb-4">
                <strong>BeautyDiscount.ma</strong> est votre destination privilégiée pour tous vos produits de beauté au Maroc. 
                Nous proposons une large gamme de <strong>cosmétiques, parfums, soins du visage et du corps</strong> des plus grandes marques internationales à des prix imbattables.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mt-8 text-sm">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">🚚 Livraison Rapide</h3>
                  <p>Livraison rapide partout au Maroc. Express à Casablanca et Rabat.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">✨ Marques Authentiques</h3>
                  <p>Produits 100% authentiques des plus grandes marques cosmétiques mondiales.</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">💰 Prix Discount</h3>
                  <p>Les meilleurs prix du marché marocain avec des promotions régulières.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🔥 Section Meilleures Ventes */}
        <section 
          aria-label="Produits les plus vendus"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Meilleures Ventes Cosmétiques</h2>
            <p>Les produits de beauté préférés de nos clients marocains</p>
          </header>
          
          <ProductCategoryHome 
            title="Meilleures Ventes"
            categoryLink="/lissage-bresilien"
            category="lissage-bresilien" 
            backgroundColor="bg-gray-50"
            titleColor="text-gray-900"
            viewAllText="Voir tous les best-sellers"
          />
        </section>

        {/* 💰 Section Promotions */}
        <section 
          aria-label="Offres promotionnelles et réductions"
          className="py-4"
        >
          <header className="sr-only">
            <h2>Promotions et Réductions Beauté</h2>
            <p>Profitez de nos offres exceptionnelles sur les cosmétiques de marque</p>
          </header>
          
          <ProductCategoryHome 
            title="Promotions"
            categoryLink="/promotions"
            category="soins-capillaires"
            backgroundColor="bg-gray-50"
            titleColor="text-pink-900"
            viewAllText="Voir toutes les promos"
          />
        </section>

        

      </main>
    </>
  );
}