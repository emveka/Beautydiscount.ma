// app/admin/conseils-beaute/nouveau/page.tsx - Éditeur complet Firebase
'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Save, 
  Eye, 
  Send, 
  X, 
  Upload, 
  Image as ImageIcon, 
  Tag, 
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Type,
  Loader,
  User
} from 'lucide-react';
import { 
  collection,
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

/**
 * Interface pour les données du formulaire
 */
interface ArticleFormData {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  status: 'draft' | 'published';
  readTime: number;
}

/**
 * Interface pour les catégories
 */
interface TipCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
}

/**
 * Éditeur d'articles - Création uniquement
 */
const NewArticleEditor: React.FC = () => {
  const router = useRouter();
  
  // États pour le formulaire
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    author: 'Admin BeautyDiscount',
    category: '',
    tags: [],
    featured: false,
    status: 'draft',
    readTime: 5
  });

  // États pour l'interface
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentTag, setCurrentTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Catégories disponibles
  const categories: TipCategory[] = [
    { id: '1', name: 'Soins du visage', slug: 'soins-visage', color: 'pink', icon: '✨' },
    { id: '2', name: 'Soins Lissage', slug: 'soins-lissage', color: 'purple', icon: '💄' },
    { id: '3', name: 'Soins des cheveux', slug: 'soins-cheveux', color: 'blue', icon: '💇‍♀️' },
    { id: '4', name: 'Anti-âge', slug: 'anti-age', color: 'green', icon: '⏰' },
    { id: '5', name: 'Beauté naturelle', slug: 'beaute-naturelle', color: 'emerald', icon: '🌿' },
    { id: '6', name: 'Tendances', slug: 'tendances', color: 'red', icon: '🔥' }
  ];

  /**
   * Génère automatiquement le slug à partir du titre
   */
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder uniquement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Éviter les tirets multiples
      .replace(/^-|-$/g, ''); // Supprimer tirets en début/fin
  };

  /**
   * Calcule automatiquement le temps de lecture
   */
  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  };

  /**
   * Met à jour le titre et génère le slug automatiquement
   */
  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
    
    // Effacer l'erreur de titre si elle existe
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: '' }));
    }
  };

  /**
   * Met à jour le contenu et recalcule le temps de lecture
   */
  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
      readTime: calculateReadTime(content)
    }));
    
    // Effacer l'erreur de contenu si elle existe
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: '' }));
    }
  };

  /**
   * Upload d'image vers Firebase Storage
   */
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifications
    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('L&apos;image ne peut pas dépasser 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide (JPG, PNG, WebP)');
      return;
    }

    try {
      setUploadingImage(true);

      // Créer un nom de fichier unique avec timestamp
      const timestamp = Date.now();
      const fileName = `beauty-tips/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '')}`;
      const imageRef = ref(storage, fileName);

      // Upload le fichier
      const snapshot = await uploadBytes(imageRef, file);
      
      // Obtenir l'URL de téléchargement
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Supprimer l'ancienne image si elle existe
      if (formData.featuredImage && formData.featuredImage.includes('firebase')) {
        try {
          const oldImageRef = ref(storage, formData.featuredImage);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('Impossible de supprimer l&apos;ancienne image:', error);
        }
      }

      // Mettre à jour le formulaire
      setFormData(prev => ({ ...prev, featuredImage: downloadURL }));

      console.log('Image uploadée avec succès:', downloadURL);

    } catch (error) {
      console.error('Erreur upload image:', error);
      alert('Erreur lors de l&apos;upload de l&apos;image. Veuillez réessayer.');
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Supprimer l'image
   */
  const removeImage = async () => {
    if (formData.featuredImage && formData.featuredImage.includes('firebase')) {
      try {
        const imageRef = ref(storage, formData.featuredImage);
        await deleteObject(imageRef);
        console.log('Image supprimée du storage');
      } catch (error) {
        console.warn('Impossible de supprimer l&apos;image du storage:', error);
      }
    }
    setFormData(prev => ({ ...prev, featuredImage: '' }));
  };

  /**
   * Ajoute un tag
   */
  const addTag = () => {
    const trimmedTag = currentTag.trim().toLowerCase();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, trimmedTag]
      }));
      setCurrentTag('');
      
      // Effacer l'erreur de tags si elle existe
      if (errors.tags) {
        setErrors(prev => ({ ...prev, tags: '' }));
      }
    }
  };

  /**
   * Supprime un tag
   */
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  /**
   * Gestion de l'ajout de tag avec Enter
   */
  const handleTagKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  /**
   * Valide le formulaire
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est obligatoire';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Le titre doit contenir au moins 10 caractères';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Le slug est obligatoire';
    } else if (formData.slug.length < 5) {
      newErrors.slug = 'Le slug doit contenir au moins 5 caractères';
    }

    if (!formData.excerpt.trim()) {
      newErrors.excerpt = 'Le résumé est obligatoire';
    } else if (formData.excerpt.length < 50) {
      newErrors.excerpt = 'Le résumé doit contenir au moins 50 caractères';
    } else if (formData.excerpt.length > 200) {
      newErrors.excerpt = 'Le résumé ne peut pas dépasser 200 caractères';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Le contenu est obligatoire';
    } else if (formData.content.length < 200) {
      newErrors.content = 'Le contenu doit contenir au moins 200 caractères';
    }

    if (!formData.category) {
      newErrors.category = 'La catégorie est obligatoire';
    }

    if (formData.tags.length === 0) {
      newErrors.tags = 'Au moins un tag est obligatoire';
    } else if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags autorisés';
    }

    if (!formData.author.trim()) {
      newErrors.author = 'L&apos;auteur est obligatoire';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Sauvegarde l'article dans Firebase
   */
  const saveArticle = async (status: 'draft' | 'published') => {
    if (!validateForm()) {
      // Faire défiler vers la première erreur
      const firstError = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-field="${firstError}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSaving(true);
    try {
      const now = Timestamp.now();
      
      const articleData = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        featuredImage: formData.featuredImage || '',
        author: formData.author.trim(),
        category: formData.category,
        tags: formData.tags,
        featured: formData.featured,
        status,
        readTime: formData.readTime,
        views: 0,
        likes: 0,
        publishedAt: status === 'published' ? now : null,
        createdAt: now,
        updatedAt: now
      };

      console.log('Sauvegarde de l&apos;article:', articleData);

      const docRef = await addDoc(collection(db, 'beauty_tips'), articleData);
      console.log('Article créé avec succès, ID:', docRef.id);

      // Notification de succès
      setShowSuccess(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/admin/conseils-beaute');
      }, 2000);
      
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde de l&apos;article. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Obtient la couleur de la catégorie
   */
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification de succès */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg max-w-md">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-3 text-green-600" />
            <div>
              <div className="font-medium">Article sauvegardé !</div>
              <div className="text-sm text-green-600">Redirection en cours...</div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link 
                href="/admin/conseils-beaute" 
                className="text-gray-500 hover:text-gray-700 mr-4 transition-colors"
              >
                ← Retour aux articles
              </Link>
              <div>
                <div className="flex items-center mb-2">
                  <Sparkles className="w-6 h-6 text-pink-600 mr-2" />
                  <h1 className="text-3xl font-bold text-gray-900">Nouvel article</h1>
                </div>
                <p className="text-gray-600">
                  Créez un nouveau conseil beauté pour vos lecteurs
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showPreview ? 'Masquer aperçu' : 'Aperçu'}
              </button>
              
              <button
                onClick={() => saveArticle('draft')}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Sauvegarde...' : 'Sauver brouillon'}
              </button>
              
              <button
                onClick={() => saveArticle('published')}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {saving ? 'Publication...' : 'Publier maintenant'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Formulaire principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Titre et slug */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-field="title">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l&apos;article *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ex: Routine de soins du visage pour débutants"
                  className={`w-full px-4 py-3 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Un titre accrocheur qui donne envie de lire l&apos;article
                </p>
              </div>

              {/* Slug généré */}
              <div className="mb-4" data-field="slug">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l&apos;article (slug) *
                </label>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2 bg-gray-100 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300">
                    beautydiscount.ma/conseils-beaute/
                  </span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    className={`flex-1 px-3 py-2 text-sm border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors ${
                      errors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.slug && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.slug}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  URL générée automatiquement, modifiable si nécessaire
                </p>
              </div>

              {/* Résumé */}
              <div data-field="excerpt">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résumé de l&apos;article *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  rows={4}
                  placeholder="Rédigez un résumé captivant qui donne envie de lire la suite. Décrivez brièvement les bénéfices que le lecteur va retirer de cet article..."
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none transition-colors ${
                    errors.excerpt ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {errors.excerpt && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.excerpt}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    Ce résumé apparaîtra sur la page d&apos;accueil du blog
                  </p>
                  <p className={`text-sm ${
                    formData.excerpt.length > 200 ? 'text-red-500' : 
                    formData.excerpt.length > 150 ? 'text-yellow-600' : 'text-gray-500'
                  }`}>
                    {formData.excerpt.length}/200
                  </p>
                </div>
              </div>
            </div>

            {/* Image de couverture */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Image de couverture
                <span className="ml-2 text-sm font-normal text-gray-500">(Recommandée)</span>
              </h3>
              
              {formData.featuredImage ? (
                <div className="relative group">
                  <Image
                    src={formData.featuredImage}
                    alt="Aperçu de l'image de couverture"
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <div className="absolute inset-0  group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                    <button
                      onClick={removeImage}
                      disabled={uploadingImage}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 disabled:opacity-50"
                      title="Supprimer l'image"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-400 transition-colors">
                  <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <div className="mb-4">
                    <label className="cursor-pointer">
                      <span className={`inline-flex items-center px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        uploadingImage ? 'cursor-not-allowed' : 'cursor-pointer'
                      }`}>
                        {uploadingImage ? (
                          <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Upload en cours...
                          </>
                        ) : (
                          <>
                            <Upload className="w-5 h-5 mr-2" />
                            Choisir une image
                          </>
                        )}
                      </span>
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p><strong>Formats acceptés :</strong> JPG, PNG, WebP</p>
                    <p><strong>Taille max :</strong> 2MB</p>
                    <p><strong>Dimensions recommandées :</strong> 1200×600px (ratio 2:1)</p>
                  </div>
                </div>
              )}
            </div>

            {/* Éditeur de contenu */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-field="content">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Type className="w-5 h-5 mr-2" />
                Contenu de l&apos;article *
              </h3>

              {/* Aide Markdown */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Aide à la rédaction (Markdown)</h4>
                <div className="grid grid-cols-2 gap-4 text-xs text-blue-700">
                  <div>
                    <p><code>**Texte en gras**</code></p>
                    <p><code>*Texte en italique*</code></p>
                    <p><code># Titre principal</code></p>
                    <p><code>## Sous-titre</code></p>
                  </div>
                  <div>
                    <p><code>- Liste à puces</code></p>
                    <p><code>1. Liste numérotée</code></p>
                    <p><code>[Lien](url)</code></p>
                    <p><code>&gt; Citation</code></p>
                  </div>
                </div>
              </div>

              <textarea
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                rows={25}
                placeholder="Rédigez votre article ici...

Exemple de structure :

# Introduction
Commencez par expliquer pourquoi ce conseil est important...

## Étape 1 : Préparation
Décrivez la première étape en détail...

## Étape 2 : Application
Continuez avec les étapes suivantes...

## Conseils supplémentaires
- **Conseil 1** : Explication
- **Conseil 2** : Explication

## Conclusion
Résumez les points clés et encouragez à passer à l&apos;action...

> **Astuce d&apos;expert** : Partagez une astuce professionnelle"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none font-mono text-sm transition-colors ${
                  errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              
              {errors.content && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.content}
                </p>
              )}
              
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <span>{formData.content.length} caractères • {formData.content.trim().split(/\s+/).filter(w => w.length > 0).length} mots</span>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-medium">{formData.readTime} min de lecture</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Paramètres de publication */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Publication
              </h3>
              
              <div className="space-y-4">
                <div data-field="author">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auteur *
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Nom de l'auteur"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 transition-colors ${
                      errors.author ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {errors.author && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.author}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData(prev => ({ ...prev, featured: e.target.checked }))}
                      className="mr-3 w-4 h-4 text-pink-600 border-gray-300 rounded focus:ring-pink-500"
                    />
                    <Star className="w-4 h-4 mr-2 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Article en vedette
                    </span>
                  </label>
                  <p className="text-sm text-gray-500 ml-9 mt-1">
                    L&apos;article apparaîtra dans la section &ldquo;À la une&rdquo; du blog
                  </p>
                </div>
              </div>
            </div>

            {/* Catégorie */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-field="category">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Catégorie *
              </h3>
              
              <div className="space-y-3">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center cursor-pointer p-3 rounded-lg border-2 border-transparent hover:border-gray-200 transition-colors">
                    <input
                      type="radio"
                      name="category"
                      value={category.slug}
                      checked={formData.category === category.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="mr-3 w-4 h-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                    />
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(category.slug)}`}>
                      <span className="mr-2">{category.icon}</span>
                      {category.name}
                    </span>
                  </label>
                ))}
              </div>
              
              {errors.category && (
                <p className="mt-3 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.category}
                </p>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" data-field="tags">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                Tags * ({formData.tags.length}/10)
              </h3>
              
              <div className="mb-4">
                <div className="flex">
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    placeholder="Ajouter un tag..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!currentTag.trim() || formData.tags.length >= 10}
                    className="px-4 py-2 bg-pink-600 text-white rounded-r-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ajouter
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Appuyez sur Entrée ou cliquez sur Ajouter
                </p>
              </div>

              {/* Tags ajoutés */}
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-pink-600 transition-colors"
                        title="Supprimer ce tag"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {errors.tags && (
                <p className="text-sm text-red-600 flex items-center mb-3">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.tags}
                </p>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700 mb-2">💡 Suggestions de tags :</p>
                <div className="flex flex-wrap gap-1">
                  {['routine', 'débutant', 'naturel', 'anti-âge', 'diy', 'tendance', 'hydratation', 'nettoyage', 'masque', 'sérum'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => {
                        if (!formData.tags.includes(suggestion) && formData.tags.length < 10) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, suggestion]
                          }));
                        }
                      }}
                      disabled={formData.tags.includes(suggestion) || formData.tags.length >= 10}
                      className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full hover:border-pink-300 hover:text-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Aperçu rapide */}
            {showPreview && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Aperçu de l&apos;article
                </h3>
                
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  {formData.featuredImage && (
                    <Image
                      src={formData.featuredImage}
                      alt="Aperçu"
                      width={400}
                      height={200}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="mb-3">
                    {formData.category && (
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(formData.category)}`}>
                        {categories.find(cat => cat.slug === formData.category)?.icon} {categories.find(cat => cat.slug === formData.category)?.name}
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">
                    {formData.title || 'Titre de l&apos;article'}
                  </h4>
                  
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    {formData.excerpt || 'Résumé de l&apos;article qui apparaîtra sur la page d&apos;accueil...'}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-200 pt-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <User className="w-3 h-3 mr-1" />
                        {formData.author}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formData.readTime} min
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>👁 0</span>
                      <span>❤️ 0</span>
                    </div>
                  </div>

                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-200">
                      {formData.tags.slice(0, 5).map((tag) => (
                        <span key={tag} className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-md">
                          #{tag}
                        </span>
                      ))}
                      {formData.tags.length > 5 && (
                        <span className="text-xs text-gray-500">+{formData.tags.length - 5} autres</span>
                      )}
                    </div>
                  )}

                  {formData.featured && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        <Star className="w-3 h-3 mr-1" />
                        Article en vedette
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Conseils de rédaction */}
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-100">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-pink-600" />
                Conseils de rédaction
              </h3>
              
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span><strong>Structure :</strong> Utilisez des titres (# ##) pour organiser votre contenu</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span><strong>Lisibilité :</strong> Écrivez des paragraphes courts et aérés</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span><strong>Conseils pratiques :</strong> Donnez des étapes actionables</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span><strong>SEO :</strong> Utilisez des mots-clés pertinents dans les tags</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-pink-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                  <span><strong>Engagement :</strong> Terminez par une question ou un appel à l&apos;action</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions bottom pour mobile */}
        <div className="mt-8 lg:hidden">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col space-y-3">
              <button
                onClick={() => saveArticle('draft')}
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {saving ? 'Sauvegarde...' : 'Sauver comme brouillon'}
              </button>
              
              <button
                onClick={() => saveArticle('published')}
                disabled={saving}
                className="w-full inline-flex items-center justify-center px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                {saving ? 'Publication en cours...' : 'Publier l&apos;article'}
              </button>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200 text-center">
              <p className="text-xs text-gray-500">
                💡 Vous pouvez sauvegarder un brouillon et le publier plus tard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewArticleEditor;