// app/admin/conseils-beaute/page.tsx - Liste des articles
'use client'
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Star,
  Clock,
  User,
  Calendar,
  Search,
  Heart,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import SimpleAdminNav from '@/components/admin/SimpleAdminNav';

/**
 * Interface pour un article de blog
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
  status: 'draft' | 'published';
  readTime: number;
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
  color: string;
  icon: string;
}

/**
 * Interface pour les données de mise à jour Firebase
 */
// ===== SOLUTION 1: Type Union plus spécifique =====
// Remplacez l'interface FirebaseUpdateData par celle-ci :

interface FirebaseUpdateData {
  [key: string]: string | number | boolean | Timestamp | undefined;
  status?: 'draft' | 'published';
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

/**
 * Page d'administration des conseils beauté
 */
const AdminConseilsBeautePage = () => {
  const [articles, setArticles] = useState<BeautyTip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  // Catégories disponibles
  const categories: TipCategory[] = [
    { id: '1', name: 'Soins du visage', slug: 'soins-visage', color: 'pink', icon: '✨' },
    { id: '2', name: 'Maquillage', slug: 'maquillage', color: 'purple', icon: '💄' },
    { id: '3', name: 'Soins des cheveux', slug: 'soins-cheveux', color: 'blue', icon: '💇‍♀️' },
    { id: '4', name: 'Anti-âge', slug: 'anti-age', color: 'green', icon: '⏰' },
    { id: '5', name: 'Beauté naturelle', slug: 'beaute-naturelle', color: 'emerald', icon: '🌿' },
    { id: '6', name: 'Tendances', slug: 'tendances', color: 'red', icon: '🔥' }
  ];

  // Charger les articles
  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      
      const q = query(collection(db, 'beauty_tips'), orderBy('createdAt', 'desc'));
      
      const querySnapshot = await getDocs(q);
      const articlesData: BeautyTip[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        articlesData.push({
          id: doc.id,
          ...data
        } as BeautyTip);
      });
      
      setArticles(articlesData);
      console.log('✅ Articles chargés:', articlesData.length);
      
    } catch (error) {
      console.error('❌ Erreur chargement articles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonctions utilitaires pour les dates
  const getDate = (timestamp: BeautyTip['createdAt']): Date => {
    if (!timestamp) return new Date();
    if (timestamp instanceof Date) return timestamp;
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp as string | number);
  };

  // Supprimer un article
  const deleteArticle = async (article: BeautyTip) => {
    if (!confirm(`Supprimer l'article "${article.title}" ?`)) return;
    
    try {
      await deleteDoc(doc(db, 'beauty_tips', article.id));
      await loadArticles();
      console.log('✅ Article supprimé');
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Toggle featured
  const toggleFeatured = async (article: BeautyTip) => {
    try {
      await updateDoc(doc(db, 'beauty_tips', article.id), {
        featured: !article.featured,
        updatedAt: Timestamp.now()
      });
      await loadArticles();
      console.log('✅ Statut vedette mis à jour');
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  // Changer le statut de publication
  const changeStatus = async (article: BeautyTip, newStatus: 'draft' | 'published') => {
    try {
      const updateData: FirebaseUpdateData = {
        status: newStatus,
        updatedAt: Timestamp.now()
      };
      
      if (newStatus === 'published' && article.status === 'draft') {
        updateData.publishedAt = Timestamp.now();
      }
      
      await updateDoc(doc(db, 'beauty_tips', article.id), updateData);
      await loadArticles();
      console.log('✅ Statut mis à jour');
    } catch (error) {
      console.error('❌ Erreur changement statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  // Filtrer les articles
  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || article.status === statusFilter;
    const matchesCategory = !categoryFilter || article.category === categoryFilter;
    const matchesFeatured = !featuredFilter || 
      (featuredFilter === 'featured' && article.featured) ||
      (featuredFilter === 'regular' && !article.featured);
    
    return matchesSearch && matchesStatus && matchesCategory && matchesFeatured;
  });

  // Trier les articles
  const sortedArticles = [...filteredArticles].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return getDate(b.createdAt).getTime() - getDate(a.createdAt).getTime();
      case 'oldest':
        return getDate(a.createdAt).getTime() - getDate(b.createdAt).getTime();
      case 'views':
        return (b.views || 0) - (a.views || 0);
      case 'likes':
        return (b.likes || 0) - (a.likes || 0);
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  // Obtenir la couleur de la catégorie
  const getCategoryColor = (categorySlug: string) => {
    const category = categories.find(cat => cat.slug === categorySlug);
    const colorMap = {
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      red: 'bg-red-100 text-red-700 border-red-200'
    };
    return colorMap[category?.color as keyof typeof colorMap] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Obtenir le nom de la catégorie
  const getCategoryName = (slug: string) => {
    return categories.find(cat => cat.slug === slug)?.name || slug;
  };

  // Obtenir l'icône de la catégorie
  const getCategoryIcon = (slug: string) => {
    return categories.find(cat => cat.slug === slug)?.icon || '📝';
  };

  // Statistiques
  const stats = {
    total: articles.length,
    published: articles.filter(a => a.status === 'published').length,
    draft: articles.filter(a => a.status === 'draft').length,
    featured: articles.filter(a => a.featured).length,
    totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
    totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleAdminNav />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2">Chargement des articles...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <Sparkles className="w-8 h-8 text-indigo-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">Conseils Beauté</h1>
              </div>
              <p className="text-gray-600">
                {stats.total} article(s) • {stats.published} publié(s) • {stats.draft} brouillon(s)
              </p>
            </div>
            <Link
              href="/admin/conseils-beaute/nouveau"
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Nouvel Article</span>
            </Link>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="bg-gray-100 p-3 rounded-lg">
                <Sparkles className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Publiés</p>
                <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.draft}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Edit className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vedettes</p>
                <p className="text-2xl font-bold text-purple-600">{stats.featured}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vues</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Likes</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalLikes}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, auteur, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les statuts</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={featuredFilter}
                onChange={(e) => setFeaturedFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Tous les articles</option>
                <option value="featured">Articles vedettes</option>
                <option value="regular">Articles normaux</option>
              </select>
            </div>

            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="recent">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="views">Plus vus</option>
                <option value="likes">Plus aimés</option>
                <option value="alphabetical">A-Z</option>
              </select>
            </div>
          </div>
          
          {(searchTerm || statusFilter || categoryFilter || featuredFilter) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {sortedArticles.length} résultat(s) trouvé(s)
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('');
                    setCategoryFilter('');
                    setFeaturedFilter('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Liste des articles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {sortedArticles.length === 0 ? (
            <div className="p-12 text-center">
              <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {articles.length === 0 ? 'Aucun article' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600 mb-6">
                {articles.length === 0 
                  ? 'Commencez par créer votre premier article de blog beauté !'
                  : 'Aucun article ne correspond aux filtres sélectionnés.'
                }
              </p>
              {articles.length === 0 && (
                <Link
                  href="/admin/conseils-beaute/nouveau"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Créer un article</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedArticles.map((article) => (
                <div key={article.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start space-x-4">
                    
                    {/* Image de l'article */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {article.featuredImage ? (
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                          <Sparkles className="w-8 h-8 text-indigo-400" />
                        </div>
                      )}
                    </div>

                    {/* Contenu principal */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          
                          {/* Titre et badges */}
                          <div className="flex items-start space-x-3 mb-2">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                              {article.title}
                            </h3>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {article.featured && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                                  <Star className="w-3 h-3 mr-1" />
                                  Vedette
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                article.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {article.status === 'published' ? '✓ Publié' : '📝 Brouillon'}
                              </span>
                            </div>
                          </div>

                          {/* Extrait */}
                          <p className="text-gray-600 text-sm leading-relaxed mb-3 line-clamp-2">
                            {article.excerpt}
                          </p>

                          {/* Métadonnées */}
                          <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-3">
                            <div className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              {article.author}
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {getDate(article.createdAt).toLocaleDateString('fr-FR')}
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {article.readTime} min
                            </div>
                            <div className="flex items-center">
                              <Eye className="w-4 h-4 mr-1" />
                              {article.views || 0}
                            </div>
                            <div className="flex items-center">
                              <Heart className="w-4 h-4 mr-1" />
                              {article.likes || 0}
                            </div>
                          </div>

                          {/* Catégorie et tags */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getCategoryColor(article.category)}`}>
                              <span className="mr-1">{getCategoryIcon(article.category)}</span>
                              {getCategoryName(article.category)}
                            </span>
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                #{tag}
                              </span>
                            ))}
                            {article.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{article.tags.length - 3} tags
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => toggleFeatured(article)}
                            className={`p-2 rounded-lg transition-colors ${
                              article.featured 
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={article.featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                          >
                            <Star className="w-4 h-4" />
                          </button>

                          {article.status === 'draft' ? (
                            <button
                              onClick={() => changeStatus(article, 'published')}
                              className="p-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              title="Publier"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => changeStatus(article, 'draft')}
                              className="p-2 text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                              title="Mettre en brouillon"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          <Link
                            href={`/admin/conseils-beaute/${article.id}/edit`}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => deleteArticle(article)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {article.status === 'published' && (
                            <a
                              href={`/conseils-beaute/${article.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                              title="Voir sur le site"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions en bas pour mobile */}
        <div className="mt-8 lg:hidden">
          <Link
            href="/admin/conseils-beaute/nouveau"
            className="w-full bg-indigo-600 text-white px-6 py-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Créer un nouvel article</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminConseilsBeautePage;