// app/conseils-beaute/page.tsx - Version Firebase (sans mocks)
'use client'
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronRight, 
  Filter, 
  Search,
  Calendar,
  Clock,
  User,
  Heart,
  BookOpen,
  Sparkles,
  Tag,
  Eye,
  X
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour les articles de conseils beauté depuis Firebase
 */
interface BeautyTip {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage?: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  status: 'published' | 'draft';
  readTime: number; // en minutes
  views: number;
  likes: number;
  publishedAt?: Timestamp | { toDate(): Date } | Date;
  createdAt?: Timestamp | { toDate(): Date } | Date;
  updatedAt?: Timestamp | { toDate(): Date } | Date;
}

/**
 * Interface pour les catégories de conseils
 */
interface TipCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  articleCount: number;
}

/**
 * Page Conseils Beauté - Version Firebase
 */
const BeautyTipsPage: React.FC = () => {
  // États pour l'interface utilisateur
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'popular' | 'trending'>('newest');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // États pour les données Firebase
  const [articles, setArticles] = useState<BeautyTip[]>([]);
  const [categories, setCategories] = useState<TipCategory[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<BeautyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Catégories par défaut (peuvent être stockées dans Firebase ou en dur)
  const defaultCategories: Omit<TipCategory, 'articleCount'>[] = [
    {
      id: '1',
      name: 'Soins du visage',
      slug: 'soins-visage',
      description: 'Routines et conseils pour une peau éclatante',
      icon: '✨',
      color: 'pink'
    },
    {
      id: '2',
      name: 'Maquillage',
      slug: 'maquillage',
      description: 'Techniques et tendances makeup',
      icon: '💄',
      color: 'purple'
    },
    {
      id: '3',
      name: 'Soins des cheveux',
      slug: 'soins-cheveux',
      description: 'Conseils pour des cheveux en bonne santé',
      icon: '💇‍♀️',
      color: 'blue'
    },
    {
      id: '4',
      name: 'Anti-âge',
      slug: 'anti-age',
      description: 'Solutions pour préserver la jeunesse de votre peau',
      icon: '⏰',
      color: 'green'
    },
    {
      id: '5',
      name: 'Beauté naturelle',
      slug: 'beaute-naturelle',
      description: 'Recettes et astuces bio',
      icon: '🌿',
      color: 'emerald'
    },
    {
      id: '6',
      name: 'Tendances',
      slug: 'tendances',
      description: 'Les dernières tendances beauté',
      icon: '🔥',
      color: 'red'
    }
  ];

  /**
   * Utilitaire pour convertir les Timestamps Firebase
   */
  const getDate = (timestamp: BeautyTip['publishedAt'] | BeautyTip['createdAt']): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp as string | number);
  };

  /**
   * Charge les articles depuis Firebase
   */
  const loadArticles = async () => {
    try {
      console.log('🔄 Chargement des articles depuis Firebase...');
      
      // Requête pour récupérer tous les articles publiés, triés par date de création
      const articlesQuery = query(
        collection(db, 'beauty_tips'),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc')
      );

      const articlesSnapshot = await getDocs(articlesQuery);
      const articlesData: BeautyTip[] = [];

      articlesSnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          featuredImage: data.featuredImage || '',
          author: data.author || 'Auteur inconnu',
          category: data.category || '',
          tags: data.tags || [],
          featured: data.featured || false,
          status: data.status || 'draft',
          readTime: data.readTime || 5,
          views: data.views || 0,
          likes: data.likes || 0,
          publishedAt: data.publishedAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      console.log(`✅ ${articlesData.length} articles chargés depuis Firebase`);
      return articlesData;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des articles:', error);
      throw new Error('Impossible de charger les articles');
    }
  };

  /**
   * Charge les données depuis Firebase
   */
  useEffect(() => {
    const loadBlogData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Charger les articles depuis Firebase
        const articlesData = await loadArticles();

        // Calculer le nombre d'articles par catégorie
        const categoriesWithCount = defaultCategories.map(cat => ({
          ...cat,
          articleCount: articlesData.filter(article => article.category === cat.slug).length
        }));

        // Filtrer les articles en vedette
        const featuredArticlesData = articlesData.filter(article => article.featured);

        // Mettre à jour les états
        setArticles(articlesData);
        setCategories(categoriesWithCount);
        setFeaturedArticles(featuredArticlesData);

        console.log('📊 Statistiques:');
        console.log(`- Total articles: ${articlesData.length}`);
        console.log(`- Articles vedettes: ${featuredArticlesData.length}`);
        console.log(`- Catégories avec articles: ${categoriesWithCount.filter(cat => cat.articleCount > 0).length}`);

      } catch (err) {
        console.error('❌ Erreur lors du chargement du blog:', err);
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    loadBlogData();
  }, []);

  /**
   * Filtre et trie les articles selon les critères sélectionnés
   */
  const filteredAndSortedArticles = useMemo(() => {
    let filtered = [...articles];

    // Filtrer par catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.excerpt.toLowerCase().includes(query) ||
        article.author.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Trier selon le critère sélectionné
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'trending':
        filtered.sort((a, b) => b.likes - a.likes);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => {
          const dateA = getDate(a.publishedAt || a.createdAt);
          const dateB = getDate(b.publishedAt || b.createdAt);
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }

    return filtered;
  }, [articles, selectedCategory, searchQuery, sortBy]);

  /**
   * Formate la date de publication
   */
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  /**
   * Obtient la classe de couleur pour une catégorie
   */
  const getCategoryColorClass = (color: string, variant: 'bg' | 'text' | 'border' = 'bg') => {
    const colorMap = {
      pink: { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200' },
      purple: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      blue: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      green: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
      emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
      red: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' }
    };
    return colorMap[color as keyof typeof colorMap]?.[variant] || colorMap.pink[variant];
  };

  /**
   * Obtient les informations d'une catégorie
   */
  const getCategoryInfo = (slug: string) => {
    return categories.find(cat => cat.slug === slug);
  };

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-12">
              <div className="h-12 bg-gray-200 rounded w-96 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>

            {/* Filters skeleton */}
            <div className="bg-white rounded-lg p-6 mb-8">
              <div className="flex gap-4">
                <div className="h-12 bg-gray-200 rounded flex-1 max-w-md"></div>
                <div className="h-12 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                {/* Featured articles skeleton */}
                <div className="mb-12">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="bg-white rounded-lg overflow-hidden">
                        <div className="aspect-video bg-gray-200"></div>
                        <div className="p-6 space-y-3">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Articles list skeleton */}
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg overflow-hidden">
                      <div className="md:flex">
                        <div className="md:w-80 aspect-video bg-gray-200"></div>
                        <div className="flex-1 p-6 space-y-3">
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                          <div className="h-6 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Sidebar skeleton */}
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-lg p-6">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="space-y-3">
                      {Array.from({ length: 4 }).map((_, j) => (
                        <div key={j} className="h-4 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Gestion d'erreur
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Erreur de chargement</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Réessayer
              </button>
              <Link 
                href="/" 
                className="block w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-pink-600 transition-colors duration-200">
            Accueil
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium">Conseils Beauté</span>
        </nav>

        {/* Header du blog */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
              Conseils Beauté
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez nos conseils d&apos;experts, astuces beauté et tendances pour révéler votre éclat naturel
          </p>
          {articles.length > 0 && (
            <p className="text-sm text-gray-500 mt-4">
              {articles.length} article{articles.length > 1 ? 's' : ''} disponible{articles.length > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Message si aucun article */}
        {articles.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucun article disponible</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Nos conseils beauté arrivent bientôt ! Revenez prochainement pour découvrir nos astuces et tendances.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Découvrir nos produits
            </Link>
          </div>
        )}

        {/* Contenu si des articles existent */}
        {articles.length > 0 && (
          <>
            {/* Barre de recherche et filtres */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                {/* Barre de recherche */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Rechercher un conseil..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* Filtres */}
                <div className="flex items-center space-x-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular' | 'trending')}
                    className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="newest">Plus récents</option>
                    <option value="popular">Plus vus</option>
                    <option value="trending">Tendance</option>
                  </select>

                  {/* Bouton filtres mobile */}
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Filter className="w-4 h-4" />
                    <span>Catégories</span>
                  </button>
                </div>
              </div>

              {/* Filtres actifs */}
              {(selectedCategory !== 'all' || searchQuery.trim()) && (
                <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Filtres actifs:</span>
                  {selectedCategory !== 'all' && (
                    <span className="inline-flex items-center space-x-1 bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                      <span>{getCategoryInfo(selectedCategory)?.name}</span>
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="hover:text-pink-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {searchQuery.trim() && (
                    <span className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      <span>&quot;{searchQuery}&quot;</span>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="hover:text-blue-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="grid lg:grid-cols-4 gap-8">
              
              {/* Contenu principal */}
              <div className="lg:col-span-3">
                
                {/* Articles en vedette */}
                {selectedCategory === 'all' && !searchQuery.trim() && featuredArticles.length > 0 && (
                  <div className="mb-12">
                    <div className="flex items-center mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mr-3">À la une</h2>
                      <div className="flex-1 h-px bg-gradient-to-r from-pink-500 to-transparent"></div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {featuredArticles.slice(0, 4).map((article) => (
                        <article key={article.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
                          <div className="aspect-video bg-gray-200 relative overflow-hidden">
                            {article.featuredImage ? (
                              <Image
                                src={article.featuredImage}
                                alt={article.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                                <Sparkles className="w-16 h-16 text-pink-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                            <div className="absolute top-4 left-4">
                              {getCategoryInfo(article.category) && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColorClass(getCategoryInfo(article.category)!.color, 'bg')} ${getCategoryColorClass(getCategoryInfo(article.category)!.color, 'text')}`}>
                                  {getCategoryInfo(article.category)!.icon} {getCategoryInfo(article.category)!.name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 hover:text-pink-600 transition-colors">
                              <Link href={`/conseils-beaute/${article.slug}`}>
                                {article.title}
                              </Link>
                            </h3>
                            
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {article.excerpt}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                  <User className="w-4 h-4 mr-1" />
                                  {article.author}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {article.readTime} min
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <div className="flex items-center">
                                  <Eye className="w-4 h-4 mr-1" />
                                  {article.views}
                                </div>
                                <div className="flex items-center">
                                  <Heart className="w-4 h-4 mr-1" />
                                  {article.likes}
                                </div>
                              </div>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tous les articles */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedCategory === 'all' ? 'Tous les articles' : `Articles - ${getCategoryInfo(selectedCategory)?.name}`}
                    </h2>
                    <span className="text-sm text-gray-500">
                      {filteredAndSortedArticles.length} article{filteredAndSortedArticles.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {filteredAndSortedArticles.length > 0 ? (
                    <div className="grid gap-6">
                      {filteredAndSortedArticles.map((article) => (
                        <article key={article.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100">
                          <div className="md:flex">
                            <div className="md:w-80 aspect-video md:aspect-square bg-gray-200 relative overflow-hidden flex-shrink-0">
                              {article.featuredImage ? (
                                <Image
                                  src={article.featuredImage}
                                  alt={article.title}
                                  fill
                                  className="object-cover"
                                  sizes="320px"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <Sparkles className="w-12 h-12 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                            </div>
                            
                            <div className="flex-1 p-6">
                              <div className="flex items-center justify-between mb-3">
                                {getCategoryInfo(article.category) && (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getCategoryColorClass(getCategoryInfo(article.category)!.color, 'bg')} ${getCategoryColorClass(getCategoryInfo(article.category)!.color, 'text')}`}>
                                    {getCategoryInfo(article.category)!.icon} {getCategoryInfo(article.category)!.name}
                                  </span>
                                )}
                                <time className="text-sm text-gray-500 flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {formatDate(getDate(article.publishedAt || article.createdAt))}
                                </time>
                              </div>
                              
                              <h3 className="text-xl font-bold text-gray-800 mb-3 hover:text-pink-600 transition-colors">
                                <Link href={`/conseils-beaute/${article.slug}`}>
                                  {article.title}
                                </Link>
                              </h3>
                              
                              <p className="text-gray-600 mb-4 line-clamp-2">
                                {article.excerpt}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <User className="w-4 h-4 mr-1" />
                                    {article.author}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {article.readTime} min de lecture
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <div className="flex items-center">
                                    <Eye className="w-4 h-4 mr-1" />
                                    {article.views}
                                  </div>
                                  <div className="flex items-center">
                                    <Heart className="w-4 h-4 mr-1" />
                                    {article.likes}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Tags */}
                              {article.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {article.tags.slice(0, 3).map((tag) => (
                                    <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </span>
                                  ))}
                                  {article.tags.length > 3 && (
                                    <span className="text-xs text-gray-500">
                                      +{article.tags.length - 3} tags
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-800 mb-2">Aucun article trouvé</h3>
                      <p className="text-gray-600 mb-4">
                        {searchQuery.trim() 
                          ? `Aucun article ne correspond à "${searchQuery}"`
                          : 'Aucun article dans cette catégorie pour le moment'
                        }
                      </p>
                      {(selectedCategory !== 'all' || searchQuery.trim()) && (
                        <button
                          onClick={() => {
                            setSelectedCategory('all');
                            setSearchQuery('');
                          }}
                          className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                        >
                          Voir tous les articles
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="hidden lg:block space-y-6">
                
                {/* Catégories */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Catégories
                  </h3>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory === 'all'
                          ? 'bg-pink-100 text-pink-700 border border-pink-200'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Tous les articles</span>
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {articles.length}
                        </span>
                      </div>
                    </button>
                    
                    {categories.filter(cat => cat.articleCount > 0).map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.slug)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                          selectedCategory === category.slug
                            ? `${getCategoryColorClass(category.color, 'bg')} ${getCategoryColorClass(category.color, 'text')} border ${getCategoryColorClass(category.color, 'border')}`
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <span className="text-lg mr-2">{category.icon}</span>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                            {category.articleCount}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-7">{category.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Articles populaires */}
                {articles.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Heart className="w-5 h-5 mr-2" />
                      Articles populaires
                    </h3>
                    
                    <div className="space-y-4">
                      {articles
                        .sort((a, b) => b.views - a.views)
                        .slice(0, 5)
                        .map((article, index) => (
                          <Link 
                            key={article.id}
                            href={`/conseils-beaute/${article.slug}`}
                            className="block group"
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-800 group-hover:text-pink-600 transition-colors line-clamp-2">
                                  {article.title}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                                  <div className="flex items-center">
                                    <Eye className="w-3 h-3 mr-1" />
                                    {article.views}
                                  </div>
                                  <div className="flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {article.readTime} min
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))}
                    </div>
                  </div>
                )}

                {/* Newsletter */}
                <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-sm p-6 text-white">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Restez informée</h3>
                    <p className="text-sm text-pink-100 mb-4">
                      Recevez nos derniers conseils beauté directement dans votre boîte mail
                    </p>
                    <div className="space-y-3">
                      <input
                        type="email"
                        placeholder="Votre email"
                        className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 placeholder-pink-100 text-white focus:outline-none focus:bg-white/30"
                      />
                      <button className="w-full bg-white text-pink-600 font-medium py-2 px-4 rounded-lg hover:bg-pink-50 transition-colors">
                        S&apos;abonner
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tags populaires */}
                {articles.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Tag className="w-5 h-5 mr-2" />
                      Tags populaires
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(articles.flatMap(article => article.tags)))
                        .slice(0, 15)
                        .map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setSearchQuery(tag)}
                            className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-pink-100 hover:text-pink-700 text-gray-600 text-sm rounded-full transition-colors"
                          >
                            {tag}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Modal Catégories Mobile */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setMobileFiltersOpen(false)}></div>
            
            <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Catégories</h3>
                  <button
                    onClick={() => setMobileFiltersOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setSelectedCategory('all');
                      setMobileFiltersOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-pink-100 text-pink-700 border border-pink-200'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Tous les articles</span>
                      <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {articles.length}
                      </span>
                    </div>
                  </button>
                  
                  {categories.filter(cat => cat.articleCount > 0).map((category) => (
                    <button
                      key={category.id}
                      onClick={() => {
                        setSelectedCategory(category.slug);
                        setMobileFiltersOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory === category.slug
                          ? `${getCategoryColorClass(category.color, 'bg')} ${getCategoryColorClass(category.color, 'text')} border ${getCategoryColorClass(category.color, 'border')}`
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{category.icon}</span>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-sm bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          {category.articleCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-7">{category.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BeautyTipsPage;