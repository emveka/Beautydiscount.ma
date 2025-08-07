import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 🔧 VOTRE CONFIG EXISTANTE (conservée)
    formats: ['image/webp', 'image/avif'], // Formats optimisés
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840], // Tailles d'écran
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Tailles d'images
    minimumCacheTTL: 60, // Cache des images
    dangerouslyAllowSVG: true, // Autoriser les SVG
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // 🔧 VOTRE CONFIG EXISTANTE (corrigée)
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // ❌ SUPPRESSION de optimizeCss qui cause l'erreur critters
    // optimizeCss: true, 
    scrollRestoration: true, // Restaure la position de scroll
  },
  
  // 🔧 VOTRE CONFIG EXISTANTE (conservée)
  compress: true,
  
  // 🆕 AJOUTS SEO CRITIQUES
  
  // 🤖 Headers SEO et sécurité
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 🔒 Sécurité (améliore le SEO indirectement)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // 🚀 Performance (Core Web Vitals)
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
        ]
      },
      {
        // 📊 Cache optimisé pour les assets statiques
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // 🗺️ Cache pour le sitemap (important pour SEO)
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=43200'
          },
          {
            key: 'Content-Type',
            value: 'application/xml'
          }
        ]
      }
    ];
  },

  // 🗂️ Redirections pour le sitemap et robots.txt
  async rewrites() {
    return [
      {
        source: '/sitemap.xml',
        destination: '/api/sitemap'
      },
      {
        source: '/robots.txt',
        destination: '/api/robots'
      }
    ];
  },

  // 🔄 Redirections SEO - CONDITIONNELLES selon l'environnement
  async redirects() {
    // 🔍 Détection de l'environnement
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 🚀 Redirections UNIQUEMENT en production
    if (isProduction) {
      return [
        // Redirection www vers non-www (UNIQUEMENT en production)
        {
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'www.beautydiscount.ma',
            },
          ],
          destination: 'https://beautydiscount.ma/:path*',
          permanent: true,
        },
        // Redirections URLs avec trailing slash (UNIQUEMENT en production)
        {
          source: '/:path((?!api).*)/', // Exclut les routes API
          destination: '/:path*',
          permanent: true,
        },
      ];
    }
    
    // 🛠️ En développement : aucune redirection problématique
    if (isDevelopment) {
      return [
        // Vous pouvez ajouter des redirections de test ici si besoin
      ];
    }

    // 🔧 Par défaut (autres environnements) : redirections minimales
    return [];
  },

  // 🚀 Optimisations supplémentaires
  poweredByHeader: false, // Supprime le header "powered by Next.js"
  
  // 📊 Configuration pour les analytics et monitoring
  env: {
    // 🔧 URLs conditionnelles selon l'environnement
    NEXT_PUBLIC_SITE_URL: process.env.NODE_ENV === 'production' 
      ? 'https://beautydiscount.ma' 
      : 'http://localhost:3000',
    NEXT_PUBLIC_SITE_NAME: 'BeautyDiscount.ma',
  },

  // 🔧 Configuration Webpack pour optimisations
  webpack: (config, { dev, isServer }) => {
    // Optimisation pour la production
    if (!dev && !isServer) {
      // Réduction de la taille du bundle
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Séparer les vendors pour un meilleur cache
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;