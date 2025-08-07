// app/api/sitemap/route.ts - Sitemap XML dynamique optimisé pour BeautyDiscount.ma
import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * 🎯 SITEMAP DYNAMIQUE ULTRA-OPTIMISÉ
 * 
 * BÉNÉFICES SEO :
 * ✅ Google découvre toutes vos pages automatiquement
 * ✅ Indexation rapide des nouveaux produits
 * ✅ Priorisation intelligente des URLs importantes
 * ✅ Données de modification pour un crawl optimal
 * ✅ Limite intelligente pour éviter les timeouts
 */

interface SitemapUrl {
  url: string;
  priority: string;
  changefreq: string;
  lastmod?: string;
}

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beautydiscount.ma';
    const currentDate = new Date().toISOString().split('T')[0];
    
    console.log('🚀 Génération du sitemap...');
    
    // 📊 Chargement parallèle des données Firebase
    const [productsSnapshot, categoriesSnapshot, subcategoriesSnapshot, tipsSnapshot] = await Promise.all([
      // ⚡ Optimisation: Limiter les produits pour éviter les timeouts
      getDocs(query(
        collection(db, 'products'), 
        where('inStock', '==', true),
        orderBy('createdAt', 'desc'),
        limit(2000) // Limite raisonnable pour l'e-commerce
      )),
      getDocs(collection(db, 'categories')),
      getDocs(collection(db, 'subcategories')),
      getDocs(query(
        collection(db, 'beauty_tips'), 
        where('status', '==', 'published'),
        orderBy('publishedAt', 'desc'),
        limit(500) // Articles de blog récents
      ))
    ]);

    // 🏠 Pages statiques avec priorités optimisées pour l'e-commerce
    const staticPages: SitemapUrl[] = [
      { 
        url: '', 
        priority: '1.0', 
        changefreq: 'daily',
        lastmod: currentDate
      },
      { 
        url: '/promotions', 
        priority: '0.9', 
        changefreq: 'daily',
        lastmod: currentDate 
      },
      { 
        url: '/conseils-beaute', 
        priority: '0.8', 
        changefreq: 'weekly',
        lastmod: currentDate 
      },
      { 
        url: '/contact', 
        priority: '0.6', 
        changefreq: 'monthly' 
      },
      { 
        url: '/livraison', 
        priority: '0.5', 
        changefreq: 'monthly' 
      },
      { 
        url: '/retours', 
        priority: '0.5', 
        changefreq: 'monthly' 
      },
      { 
        url: '/mentions-legales', 
        priority: '0.3', 
        changefreq: 'yearly' 
      },
      { 
        url: '/politique-confidentialite', 
        priority: '0.3', 
        changefreq: 'yearly' 
      }
    ];

    // 🏷️ Pages catégories (priorité élevée pour l'e-commerce)
    const categoryPages: SitemapUrl[] = [];
    categoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        categoryPages.push({
          url: `/${data.slug}`,
          priority: '0.8', // Priorité élevée pour les catégories
          changefreq: 'weekly',
          lastmod: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || currentDate
        });
      }
    });

    // 🏷️ Pages sous-catégories
    const subcategoryPages: SitemapUrl[] = [];
    subcategoriesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug && data.parentCategory) {
        subcategoryPages.push({
          url: `/${data.parentCategory}/${data.slug}`,
          priority: '0.7',
          changefreq: 'weekly',
          lastmod: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || currentDate
        });
      }
    });

    // 🛍️ Pages produits avec priorisation intelligente
    const productPages: SitemapUrl[] = [];
    productsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        // 🎯 Priorité plus élevée pour les produits en promotion
        const isOnSale = data.originalPrice && data.originalPrice > data.price;
        const priority = isOnSale ? '0.7' : '0.6';
        
        const lastmod = data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || 
                       data.createdAt?.toDate?.()?.toISOString().split('T')[0] ||
                       currentDate;
        
        productPages.push({
          url: `/product/${data.slug}`,
          priority,
          changefreq: 'weekly',
          lastmod
        });
      }
    });

    // ✍️ Articles de blog
    const blogPages: SitemapUrl[] = [];
    tipsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.slug) {
        const lastmod = data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || 
                       data.publishedAt?.toDate?.()?.toISOString().split('T')[0] ||
                       currentDate;
        
        blogPages.push({
          url: `/conseils-beaute/${data.slug}`,
          priority: '0.6',
          changefreq: 'monthly',
          lastmod
        });
      }
    });

    // 🔧 Génération du XML optimisé
    const generateSitemapXml = (pages: SitemapUrl[]) => {
      return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${pages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${page.lastmod || currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <mobile:mobile/>${page.url.includes('/product/') ? `
    <image:image>
      <image:loc>${baseUrl}/og-product.jpg</image:loc>
    </image:image>` : ''}
  </url>`).join('\n')}
</urlset>`;
    };

    // 🌟 Combiner toutes les pages avec ordre intelligent
    const allPages = [
      ...staticPages,
      ...categoryPages,
      ...subcategoryPages,
      ...productPages.slice(0, 1500), // Limite pour éviter les timeouts
      ...blogPages
    ];

    // 📊 Logs pour monitoring
    console.log(`✅ Sitemap généré avec succès:`);
    console.log(`   📄 Total URLs: ${allPages.length}`);
    console.log(`   🏠 Pages statiques: ${staticPages.length}`);
    console.log(`   🏷️ Catégories: ${categoryPages.length}`);
    console.log(`   🏷️ Sous-catégories: ${subcategoryPages.length}`);
    console.log(`   🛍️ Produits: ${Math.min(productPages.length, 1500)}`);
    console.log(`   ✍️ Articles: ${blogPages.length}`);

    const sitemapXml = generateSitemapXml(allPages);

    return new NextResponse(sitemapXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200', // 24h cache
        'X-Robots-Tag': 'noindex' // Le sitemap ne doit pas être indexé
      }
    });

  } catch (error) {
    console.error('❌ Erreur génération sitemap:', error);
    
    // 🚨 Sitemap de secours en cas d'erreur Firebase
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://beautydiscount.ma</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://beautydiscount.ma/promotions</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(fallbackSitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache plus court en cas d'erreur
      }
    });
  }
}

// 🔄 Méthode pour forcer la régénération (optionnel)
export async function POST() {
  // Cette route peut être appelée via webhook Firebase ou cron job
  // pour régénérer le sitemap quand vous ajoutez des produits
  return GET();
}