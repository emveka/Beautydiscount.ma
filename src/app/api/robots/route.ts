// app/api/robots/route.ts - Robots.txt optimisé pour l'e-commerce au Maroc
import { NextResponse } from 'next/server';

/**
 * 🤖 ROBOTS.TXT ULTRA-OPTIMISÉ POUR E-COMMERCE
 * 
 * BÉNÉFICES SEO :
 * ✅ Guide Google vers vos pages importantes
 * ✅ Bloque l'indexation des pages privées/inutiles
 * ✅ Optimise le budget crawl de Google
 * ✅ Protège contre le scraping agressif
 * ✅ Spécialement adapté pour le marché marocain
 */

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://beautydiscount.ma';
  
  const robotsTxt = `# 🇲🇦 BeautyDiscount.ma - Robots.txt
# E-commerce de cosmétiques optimisé pour le SEO au Maroc
# Dernière mise à jour: ${new Date().toISOString().split('T')[0]}

# 🌟 RÈGLES GÉNÉRALES - Tous les robots
User-agent: *

# ✅ PAGES AUTORISÉES - Importantes pour le SEO e-commerce
Allow: /
Allow: /product/
Allow: /parfums/
Allow: /maquillage/
Allow: /soins-visage/
Allow: /soins-cheveux/
Allow: /soins-corps/
Allow: /accessoires/
Allow: /promotions
Allow: /conseils-beaute/
Allow: /api/sitemap
Allow: /_next/static/
Allow: /_next/image

# ❌ PAGES INTERDITES - Privées et techniques
Disallow: /admin/
Disallow: /api/
Disallow: /checkout
Disallow: /panier
Disallow: /cart
Disallow: /auth/
Disallow: /login
Disallow: /register
Disallow: /_next/
Disallow: /.*\\.(json|xml)$
Disallow: /*?*sort=*
Disallow: /*?*filter=*
Disallow: /*?*page=*
Disallow: /search?*
Disallow: /*?*utm_*
Disallow: /*?*fbclid=*
Disallow: /*?*gclid=*
Disallow: /404
Disallow: /500
Disallow: /**/amp/

# 🔒 DOSSIERS PRIVÉS
Disallow: /private/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /analytics/

# 🎯 GOOGLEBOT - Moteur principal pour le Maroc
User-agent: Googlebot
Allow: /api/sitemap
Crawl-delay: 1
Request-rate: 1/1s

# 🎯 GOOGLEBOT MOBILE - Priorité mobile-first
User-agent: Googlebot-Mobile
Allow: /
Allow: /api/sitemap
Crawl-delay: 1

# 🎯 BING - Deuxième moteur important
User-agent: Bingbot
Allow: /api/sitemap
Crawl-delay: 2
Request-rate: 1/2s

# 🛡️ PROTECTION CONTRE LE SCRAPING AGRESSIF
User-agent: AhrefsBot
Crawl-delay: 10
Request-rate: 1/10s

User-agent: MJ12bot
Crawl-delay: 10

User-agent: DotBot
Crawl-delay: 20

User-agent: SemrushBot
Crawl-delay: 10

User-agent: MajesticSEO
Crawl-delay: 10

# 🚫 ROBOTS MALVEILLANTS - Complètement bloqués
User-agent: AhrefsBot
Disallow: /

User-agent: SemrushBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: DotBot
Disallow: /

User-agent: BLEXBot
Disallow: /

User-agent: DataForSeoBot
Disallow: /

# 🛒 BOTS E-COMMERCE SPÉCIFIQUES
User-agent: facebookexternalhit
Allow: /product/
Allow: /promotions
Crawl-delay: 1

User-agent: Twitterbot
Allow: /product/
Allow: /conseils-beaute/
Crawl-delay: 1

User-agent: LinkedInBot
Allow: /conseils-beaute/
Crawl-delay: 2

# 🗂️ SITEMAP - Localisation du plan du site
Sitemap: ${baseUrl}/sitemap.xml

# 🇲🇦 SPÉCIAL MAROC - Optimisations locales
# Les moteurs de recherche comprennent la géolocalisation
# grâce au domaine .ma et aux métadonnées

# 📊 STATISTIQUES ESTIMÉES
# Pages indexables: ~2000+ produits + catégories + articles
# Fréquence crawl optimale: 1-2 fois par semaine
# Budget crawl: ~500 pages/jour pour Google

# 🔄 RÉGÉNÉRATION
# Ce fichier est généré automatiquement
# Mise à jour: À chaque déploiement ou changement majeur

# 📞 CONTACT TECHNIQUE
# En cas de problème d'indexation: support@beautydiscount.ma`;

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400', // Cache 24h
      'X-Robots-Tag': 'noindex, nofollow' // Le robots.txt ne doit pas être indexé
    }
  });
}

// 🔄 Endpoint POST pour forcer la régénération (optionnel)
export async function POST() {
  // Permet de régénérer le robots.txt via webhook si nécessaire
  return GET();
}