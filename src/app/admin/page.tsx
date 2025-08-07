// app/admin/page.tsx - Dashboard Admin avec Conseils Beauté ET Navigation
'use client'
import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore'; // ← AJOUTÉ pour afficher l'utilisateur connecté
import { 
  Package, 
  ShoppingBag, 
  Tag,
  Star,
  Plus,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Sparkles,    // 🆕 Pour conseils beauté
  Edit,        // 🆕 Pour écriture
  Eye,         // 🆕 Pour vues
  Heart        // 🆕 Pour likes
} from 'lucide-react';
import Link from 'next/link';
import SimpleAdminNav from '@/components/admin/SimpleAdminNav'; // ← AJOUTÉ

/**
 * Dashboard Admin avec Conseils Beauté intégrés
 * Navigation claire vers Products, Categories, Brands, ET Blog
 */
const AdminDashboard = () => {
  const { user } = useAuthStore(); // ← AJOUTÉ pour afficher l'utilisateur connecté
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    brands: 0,
    orders: 0,
    // 🆕 Nouvelles statistiques pour le blog
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalViews: 0,
    totalLikes: 0
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques de base
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [
        productsSnap, 
        categoriesSnap, 
        brandsSnap, 
        ordersSnap,
        articlesSnap  // 🆕 Collection beauty_tips
      ] = await Promise.all([
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'brands')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'beauty_tips')) // 🆕 Articles blog
      ]);

      // 🆕 Calculer les stats des articles
      const articles = articlesSnap.docs.map(doc => doc.data());
      const publishedArticles = articles.filter(article => article.status === 'published');
      const draftArticles = articles.filter(article => article.status === 'draft');
      const totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
      const totalLikes = articles.reduce((sum, article) => sum + (article.likes || 0), 0);

      setStats({
        products: productsSnap.size,
        categories: categoriesSnap.size,
        brands: brandsSnap.size,
        orders: ordersSnap.size,
        // 🆕 Stats du blog
        totalArticles: articlesSnap.size,
        publishedArticles: publishedArticles.length,
        draftArticles: draftArticles.length,
        totalViews,
        totalLikes
      });
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleAdminNav /> {/* ← Navigation même pendant le chargement */}
        <div className="flex items-center justify-center h-96">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="text-gray-600">Chargement du dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* ← ← ← NAVIGATION AJOUTÉE ← ← ← */}
      <SimpleAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header avec info utilisateur */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Administration
              </h1>
              <p className="text-gray-600 mt-1">
                Gérez votre boutique BeautyDiscount.ma
                {user && (
                  <span className="ml-2 text-sm">
                    • Connecté en tant que <strong className="text-pink-600">{user.displayName || user.email}</strong>
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {user && (
                <p className="text-xs text-gray-400 mt-1">
                  🔐 Connexion Firebase sécurisée
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques principales - Ligne 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Produits</p>
                <p className="text-2xl font-bold text-gray-900">{stats.products}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Tag className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Catégories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Marques</p>
                <p className="text-2xl font-bold text-gray-900">{stats.brands}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <ShoppingBag className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Commandes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.orders}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🆕 Statistiques Blog - Ligne 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-indigo-100 p-3 rounded-lg">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Articles Blog</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-emerald-100 p-3 rounded-lg">
                <Edit className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Publiés</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.publishedArticles}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Eye className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vues Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalViews.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Likes Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalLikes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation principale avec Conseils Beauté */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          
          {/* Produits */}
          <Link 
            href="/admin/products"
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-blue-500 p-4 rounded-xl group-hover:bg-blue-600 transition-colors">
                <Package className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Produits</h3>
            <p className="text-gray-600 mb-4">
              Gérez votre catalogue de produits, prix et descriptions
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-600 font-medium">
                {stats.products} produits
              </span>
              <div className="flex space-x-2">
                <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">
                  Ajouter
                </div>
                <div className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">
                  Modifier
                </div>
              </div>
            </div>
          </Link>

          {/* Catégories */}
          <Link 
            href="/admin/categories"
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-purple-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-purple-500 p-4 rounded-xl group-hover:bg-purple-600 transition-colors">
                <Tag className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Catégories</h3>
            <p className="text-gray-600 mb-4">
              Organisez vos produits par catégories et sous-catégories
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-600 font-medium">
                {stats.categories} catégories
              </span>
              <div className="flex space-x-2">
                <div className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs">
                  Créer
                </div>
                <div className="bg-purple-50 text-purple-600 px-2 py-1 rounded text-xs">
                  Organiser
                </div>
              </div>
            </div>
          </Link>

          {/* Marques */}
          <Link 
            href="/admin/brands"
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-pink-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-pink-500 p-4 rounded-xl group-hover:bg-pink-600 transition-colors">
                <Star className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-pink-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Marques</h3>
            <p className="text-gray-600 mb-4">
              Gérez les marques et leurs descriptions SEO
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-pink-600 font-medium">
                {stats.brands} marques
              </span>
              <div className="flex space-x-2">
                <div className="bg-pink-50 text-pink-600 px-2 py-1 rounded text-xs">
                  Ajouter
                </div>
                <div className="bg-pink-50 text-pink-600 px-2 py-1 rounded text-xs">
                  SEO
                </div>
              </div>
            </div>
          </Link>

          {/* 🆕 Conseils Beauté */}
          <Link 
            href="/admin/conseils-beaute"
            className="group bg-white rounded-xl shadow-sm border border-gray-100 p-8 hover:shadow-lg hover:border-indigo-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="bg-indigo-500 p-4 rounded-xl group-hover:bg-indigo-600 transition-colors">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Conseils Beauté</h3>
            <p className="text-gray-600 mb-4">
              Rédigez et publiez des articles de blog beauté
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-indigo-600 font-medium">
                {stats.totalArticles} articles
              </span>
              <div className="flex space-x-2">
                <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs">
                  Écrire
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-xs">
                  Publier
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Actions rapides avec nouvelles actions blog */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Actions Rapides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <Link
              href="/admin/products"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
            >
              <div className="bg-blue-100 p-2 rounded">
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nouveau Produit</p>
                <p className="text-sm text-gray-500">Ajouter au catalogue</p>
              </div>
            </Link>

            <Link
              href="/admin/categories"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
            >
              <div className="bg-purple-100 p-2 rounded">
                <Tag className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nouvelle Catégorie</p>
                <p className="text-sm text-gray-500">Organiser le catalogue</p>
              </div>
            </Link>

            <Link
              href="/admin/brands"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all"
            >
              <div className="bg-pink-100 p-2 rounded">
                <Star className="w-4 h-4 text-pink-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nouvelle Marque</p>
                <p className="text-sm text-gray-500">Ajouter une marque</p>
              </div>
            </Link>

            {/* 🆕 Nouvel Article */}
            <Link
              href="/admin/conseils-beaute/nouveau"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              <div className="bg-indigo-100 p-2 rounded">
                <Edit className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Nouvel Article</p>
                <p className="text-sm text-gray-500">Conseil beauté</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all"
            >
              <div className="bg-green-100 p-2 rounded">
                <ShoppingBag className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Voir Commandes</p>
                <p className="text-sm text-gray-500">Gérer les commandes</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Section informative avec stats blog */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Conseils */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-bold">Conseils de Gestion</h3>
            </div>
            <ul className="space-y-2 text-blue-100">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                Ajoutez des descriptions SEO pour améliorer votre référencement
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                Publiez régulièrement des conseils beauté pour engager vos clients
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                Organisez vos produits en catégories cohérentes
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                Mettez à jour régulièrement votre catalogue
              </li>
            </ul>
          </div>

          {/* Statistiques avec blog */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-6 h-6 text-gray-600 mr-2" />
              <h3 className="text-lg font-bold text-gray-900">Aperçu Rapide</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Catalogue complet</span>
                <span className="font-bold text-gray-900">
                  {stats.products + stats.categories + stats.brands} éléments
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Articles publiés</span>
                <span className="font-bold text-indigo-600">{stats.publishedArticles}</span>
              </div>
              {stats.draftArticles > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Brouillons en attente</span>
                  <span className="font-bold text-yellow-600">{stats.draftArticles}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Commandes reçues</span>
                <span className="font-bold text-green-600">{stats.orders}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Statut système</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                  ✓ Opérationnel
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            BeautyDiscount.ma - Administration • {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;