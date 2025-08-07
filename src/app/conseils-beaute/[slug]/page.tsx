// app/conseils-beaute/[slug]/page.tsx - Page détail avec erreurs corrigées
'use client'
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { 
  ChevronRight, 
  Calendar,
  Clock,
  User,
  Heart,
  Sparkles,
  Tag,
  Eye,
  Share2,
  Facebook,
  Twitter,
  ChevronLeft,
  ArrowUp
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, increment, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour les Timestamps Firebase
 */
interface FirebaseTimestamp {
  toDate(): Date;
  seconds: number;
  nanoseconds: number;
}

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
  readTime: number;
  views: number;
  likes: number;
  publishedAt?: Timestamp | FirebaseTimestamp | Date;
  createdAt?: Timestamp | FirebaseTimestamp | Date;
  updatedAt?: Timestamp | FirebaseTimestamp | Date;
}

/**
 * Interface pour les catégories
 */
interface TipCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
}

/**
 * Page de détail d'un article de conseil beauté
 */
const BeautyTipDetailPage: React.FC = () => {
  const params = useParams();
  const slug = params?.slug as string;

  // États
  const [article, setArticle] = useState<BeautyTip | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BeautyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);

  // Catégories (identiques à la page index)
  const categories: TipCategory[] = [
    { id: '1', name: 'Soins du visage', slug: 'soins-visage', icon: '✨', color: 'pink' },
    { id: '2', name: 'Maquillage', slug: 'maquillage', icon: '💄', color: 'purple' },
    { id: '3', name: 'Soins des cheveux', slug: 'soins-cheveux', icon: '💇‍♀️', color: 'blue' },
    { id: '4', name: 'Anti-âge', slug: 'anti-age', icon: '⏰', color: 'green' },
    { id: '5', name: 'Beauté naturelle', slug: 'beaute-naturelle', icon: '🌿', color: 'emerald' },
    { id: '6', name: 'Tendances', slug: 'tendances', icon: '🔥', color: 'red' }
  ];

  /**
   * Utilitaire pour convertir les Timestamps Firebase (typé correctement)
   */
  const getDate = (timestamp: Timestamp | FirebaseTimestamp | Date | undefined): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }
    return new Date();
  };

  /**
   * Obtient les informations d'une catégorie
   */
  const getCategoryInfo = (slug: string) => {
    return categories.find(cat => cat.slug === slug);
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
   * Charge l'article depuis Firebase
   */
  const loadArticle = async (articleSlug: string): Promise<BeautyTip | null> => {
    try {
      console.log('🔄 Chargement de l\'article:', articleSlug);

      // Requête pour trouver l'article par slug
      const articlesQuery = query(
        collection(db, 'beauty_tips'),
        where('slug', '==', articleSlug),
        where('status', '==', 'published')
      );

      const articlesSnapshot = await getDocs(articlesQuery);

      if (articlesSnapshot.empty) {
        console.log('❌ Article non trouvé:', articleSlug);
        return null;
      }

      const articleDoc = articlesSnapshot.docs[0];
      const articleData = articleDoc.data();

      const article: BeautyTip = {
        id: articleDoc.id,
        title: articleData.title || '',
        slug: articleData.slug || '',
        excerpt: articleData.excerpt || '',
        content: articleData.content || '',
        featuredImage: articleData.featuredImage || '',
        author: articleData.author || 'Auteur inconnu',
        category: articleData.category || '',
        tags: articleData.tags || [],
        featured: articleData.featured || false,
        status: articleData.status || 'draft',
        readTime: articleData.readTime || 5,
        views: articleData.views || 0,
        likes: articleData.likes || 0,
        publishedAt: articleData.publishedAt,
        createdAt: articleData.createdAt,
        updatedAt: articleData.updatedAt
      };

      console.log('✅ Article chargé:', article.title);
      return article;

    } catch (error) {
      console.error('❌ Erreur lors du chargement de l\'article:', error);
      return null;
    }
  };

  /**
   * Charge les articles similaires
   */
  const loadRelatedArticles = async (currentArticle: BeautyTip): Promise<BeautyTip[]> => {
    try {
      console.log('🔄 Chargement des articles similaires...');

      // Articles de la même catégorie
      const relatedQuery = query(
        collection(db, 'beauty_tips'),
        where('status', '==', 'published'),
        where('category', '==', currentArticle.category),
        orderBy('createdAt', 'desc'),
        limit(4)
      );

      const relatedSnapshot = await getDocs(relatedQuery);
      const relatedArticles: BeautyTip[] = [];

      relatedSnapshot.forEach((doc) => {
        // Exclure l'article actuel
        if (doc.id !== currentArticle.id) {
          const data = doc.data();
          relatedArticles.push({
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
        }
      });

      console.log(`✅ ${relatedArticles.length} articles similaires chargés`);
      return relatedArticles.slice(0, 3); // Maximum 3 articles

    } catch (error) {
      console.error('❌ Erreur lors du chargement des articles similaires:', error);
      return [];
    }
  };

  /**
   * Incrémente le nombre de vues
   */
  const incrementViews = async (articleId: string) => {
    try {
      const articleRef = doc(db, 'beauty_tips', articleId);
      await updateDoc(articleRef, {
        views: increment(1)
      });
      console.log('📊 Vue incrémentée pour l\'article');
    } catch (error) {
      console.error('❌ Erreur lors de l\'incrémentation des vues:', error);
    }
  };

  /**
   * Toggle like d'un article
   */
  const toggleLike = async () => {
    if (!article) return;

    try {
      const articleRef = doc(db, 'beauty_tips', article.id);
      const increment_value = liked ? -1 : 1;
      
      await updateDoc(articleRef, {
        likes: increment(increment_value)
      });

      // Mettre à jour l'état local
      setArticle(prev => prev ? {
        ...prev,
        likes: prev.likes + increment_value
      } : null);

      setLiked(!liked);
      console.log(liked ? '💔 Like retiré' : '❤️ Article liké');

    } catch (error) {
      console.error('❌ Erreur lors du toggle like:', error);
    }
  };

  /**
   * Gestion du scroll pour la barre de progression et le bouton "retour en haut"
   */
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      setReadingProgress(scrollPercent);
      setShowScrollTop(scrollTop > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  /**
   * Scroll vers le haut
   */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Partage sur les réseaux sociaux
   */
  const shareOnSocial = (platform: 'facebook' | 'twitter') => {
    if (!article) return;

    const url = window.location.href;
    const title = article.title;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  /**
   * Copier le lien
   */
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Vous pouvez ajouter une notification toast ici
      alert('Lien copié !');
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  /**
   * Formate le contenu Markdown simple (regex corrigée)
   */
  const formatContent = (content: string) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-800 mb-6 mt-8">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-gray-800 mb-4 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-gray-800 mb-3 mt-5">$1</h3>')
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-pink-500 pl-4 py-2 my-4 bg-pink-50 text-gray-700 italic">$1</blockquote>')
      .replace(/^- (.*$)/gim, '<li class="mb-2">$1</li>')
      .replace(/(<li.*<\/li>)/g, '<ul class="list-disc list-inside mb-4 space-y-2">$1</ul>')
      .replace(/\n\n/g, '</p><p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/^/, '<p class="mb-4 text-gray-700 leading-relaxed">')
      .replace(/$/, '</p>');
  };

  // Charger l'article au montage du composant
  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      try {
        setLoading(true);

        // Charger l'article
        const articleData = await loadArticle(slug);
        
        if (!articleData) {
          notFound();
          return;
        }

        setArticle(articleData);

        // Incrémenter les vues
        await incrementViews(articleData.id);

        // Charger les articles similaires
        const related = await loadRelatedArticles(articleData);
        setRelatedArticles(related);

      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [slug]);

  // Vérifier si l'utilisateur a déjà liké (vous pouvez utiliser localStorage ou cookies)
  useEffect(() => {
    if (article) {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
      setLiked(likedArticles.includes(article.id));
    }
  }, [article]);

  // Sauvegarder le like dans localStorage
  useEffect(() => {
    if (article) {
      const likedArticles = JSON.parse(localStorage.getItem('likedArticles') || '[]');
      if (liked && !likedArticles.includes(article.id)) {
        likedArticles.push(article.id);
        localStorage.setItem('likedArticles', JSON.stringify(likedArticles));
      } else if (!liked && likedArticles.includes(article.id)) {
        const updatedLikes = likedArticles.filter((id: string) => id !== article.id);
        localStorage.setItem('likedArticles', JSON.stringify(updatedLikes));
      }
    }
  }, [liked, article]);

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse">
            {/* Breadcrumb skeleton */}
            <div className="h-4 bg-gray-200 rounded w-64 mb-6"></div>
            
            {/* Category skeleton */}
            <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
            
            {/* Title skeleton */}
            <div className="h-12 bg-gray-200 rounded w-full mb-6"></div>
            
            {/* Meta skeleton */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
            
            {/* Image skeleton */}
            <div className="aspect-video bg-gray-200 rounded-lg mb-8"></div>
            
            {/* Content skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return notFound();
  }

  const categoryInfo = getCategoryInfo(article.category);

  return (
    <div className="min-h-screen bg-white">
      {/* Barre de progression de lecture */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div 
          className="h-1 bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-pink-600 transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/conseils-beaute" className="hover:text-pink-600 transition-colors">
            Conseils Beauté
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-800 font-medium truncate">{article.title}</span>
        </nav>

        {/* Retour */}
        <Link
          href="/conseils-beaute"
          className="inline-flex items-center text-gray-600 hover:text-pink-600 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Retour aux articles
        </Link>

        {/* Header de l'article */}
        <header className="mb-8">
          
          {/* Catégorie */}
          {categoryInfo && (
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColorClass(categoryInfo.color, 'bg')} ${getCategoryColorClass(categoryInfo.color, 'text')}`}>
                <span className="mr-2">{categoryInfo.icon}</span>
                {categoryInfo.name}
              </span>
            </div>
          )}

          {/* Titre */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
            {article.title}
          </h1>

          {/* Résumé */}
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            {article.excerpt}
          </p>

          {/* Métadonnées */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-8">
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              <span className="font-medium">{article.author}</span>
            </div>
            
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }).format(getDate(article.publishedAt || article.createdAt))}</span>
            </div>
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>{article.readTime} min de lecture</span>
            </div>
            
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              <span>{article.views} vues</span>
            </div>
          </div>

          {/* Actions sociales */}
          <div className="flex items-center justify-between py-4 border-t border-b border-gray-200 mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLike}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  liked 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{article.likes}</span>
              </button>
            </div>

            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Partager:</span>
              
              <button
                onClick={() => shareOnSocial('facebook')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Partager sur Facebook"
              >
                <Facebook className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => shareOnSocial('twitter')}
                className="p-2 text-gray-600 hover:text-blue-400 hover:bg-blue-50 rounded-lg transition-colors"
                title="Partager sur Twitter"
              >
                <Twitter className="w-4 h-4" />
              </button>
              
              <button
                onClick={copyLink}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copier le lien"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Image de couverture */}
        {article.featuredImage && (
          <div className="aspect-video bg-gray-200 rounded-lg overflow-hidden mb-8">
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>
        )}

        {/* Contenu de l'article */}
        <article className="prose prose-lg max-w-none mb-12">
          <div 
            className="article-content"
            dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
          />
        </article>

        {/* Tags */}
        {article.tags.length > 0 && (
          <div className="mb-12">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Tag className="w-5 h-5 mr-2" />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/conseils-beaute?search=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 hover:bg-pink-100 hover:text-pink-700 text-gray-600 text-sm rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Articles similaires */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Sparkles className="w-6 h-6 mr-2 text-pink-600" />
              Articles similaires
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Link
                  key={relatedArticle.id}
                  href={`/conseils-beaute/${relatedArticle.slug}`}
                  className="group bg-gray-50 rounded-lg overflow-hidden hover:shadow-md transition-all duration-300"
                >
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    {relatedArticle.featuredImage ? (
                      <Image
                        src={relatedArticle.featuredImage}
                        alt={relatedArticle.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                        <Sparkles className="w-12 h-12 text-pink-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-pink-600 transition-colors">
                      {relatedArticle.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {relatedArticle.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {relatedArticle.readTime} min
                      </div>
                      <div className="flex items-center">
                        <Eye className="w-3 h-3 mr-1" />
                        {relatedArticle.views}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Call-to-action */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg p-8 text-white text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Vous avez aimé cet article ?</h2>
            <p className="text-pink-100 mb-6">
              Découvrez nos produits beauté sélectionnés par nos experts et mettez en pratique nos conseils !
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/product"
                className="bg-white text-pink-600 font-semibold px-6 py-3 rounded-lg hover:bg-pink-50 transition-colors"
              >
                Découvrir nos produits
              </Link>
              <Link
                href="/conseils-beaute"
                className="bg-white/20 text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/30 transition-colors"
              >
                Lire d&apos;autres conseils
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Bouton retour en haut */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-pink-600 text-white rounded-full shadow-lg hover:bg-pink-700 transition-all duration-300 flex items-center justify-center"
          title="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Styles pour le contenu formaté */}
      <style jsx global>{`
        .article-content h1 {
          @apply text-3xl font-bold text-gray-800 mb-6 mt-8;
        }
        .article-content h2 {
          @apply text-2xl font-bold text-gray-800 mb-4 mt-6;
        }
        .article-content h3 {
          @apply text-xl font-semibold text-gray-800 mb-3 mt-5;
        }
        .article-content p {
          @apply mb-4 text-gray-700 leading-relaxed;
        }
        .article-content ul {
          @apply list-disc list-inside mb-4 space-y-2;
        }
        .article-content li {
          @apply mb-2 text-gray-700;
        }
        .article-content blockquote {
          @apply border-l-4 border-pink-500 pl-4 py-2 my-4 bg-pink-50 text-gray-700 italic;
        }
        .article-content strong {
          @apply font-semibold text-gray-800;
        }
        .article-content em {
          @apply italic;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default BeautyTipDetailPage;