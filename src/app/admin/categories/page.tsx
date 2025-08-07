// app/admin/categories/page.tsx - Version corrigée (erreurs fixées)
'use client'
import React, { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // ✅ Supprimé deleteObject non utilisé
import { db, storage } from '@/lib/firebase';
import { Plus, Edit, Trash2, Eye, Save, X, Upload } from 'lucide-react'; // ✅ Supprimé ImageIcon non utilisé
import Image from 'next/image'; // ✅ Ajouté pour remplacer les <img>
import SimpleAdminNav from '@/components/admin/SimpleAdminNav';

interface Category {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  imageUrl?: string;
  subcategories?: string[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface Subcategory {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  parentCategory: string;
  imageUrl?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface CategoryForm {
  name: string;
  slug: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  imageUrl?: string;
}

interface SubcategoryForm {
  name: string;
  slug: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  parentCategory: string;
  imageUrl?: string;
}

const AdminCategoriesPage = () => {
  // États
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'category' | 'subcategory'>('category');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  
  const [formData, setFormData] = useState<CategoryForm>({
    name: '',
    slug: '',
    title: '',
    shortSEOdescription: '',
    longSEOdescription: '',
    imageUrl: ''
  });
  
  const [subFormData, setSubFormData] = useState<SubcategoryForm>({
    name: '',
    slug: '',
    title: '',
    shortSEOdescription: '',
    longSEOdescription: '',
    parentCategory: '',
    imageUrl: ''
  });

  // Charger les données
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [categoriesSnapshot, subcategoriesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'categories'), orderBy('name'))),
        getDocs(query(collection(db, 'subcategories'), orderBy('name')))
      ]);
      
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subcategory[];
      
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fonction pour uploader une image
  const uploadImage = async (file: File, folder: 'categories' | 'subcategories'): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  // Gestionnaire d'upload d'image
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifications
    if (file.size > 5 * 1024 * 1024) { // 5MB max
      alert('L\'image ne doit pas dépasser 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }

    try {
      setUploading(true);
      const imageUrl = await uploadImage(file, formType === 'category' ? 'categories' : 'subcategories');
      
      if (formType === 'category') {
        setFormData(prev => ({ ...prev, imageUrl }));
      } else {
        setSubFormData(prev => ({ ...prev, imageUrl }));
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload de l\'image');
    } finally {
      setUploading(false);
    }
  };

  // Générer le slug
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[àáâãäå]/g, 'a')
      .replace(/[èéêë]/g, 'e')
      .replace(/[ìíîï]/g, 'i')
      .replace(/[òóôõö]/g, 'o')
      .replace(/[ùúûü]/g, 'u')
      .replace(/[ç]/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, ''); // ✅ Corrigé: supprimé l'argument de trim()
  };

  // Gestion formulaires
  const handleCategoryChange = (field: keyof CategoryForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value) })
    }));
  };

  const handleSubcategoryChange = (field: keyof SubcategoryForm, value: string) => {
    setSubFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && { slug: generateSlug(value) })
    }));
  };

  // Sauvegardes
  const saveCategory = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Le nom et le slug sont obligatoires');
      return;
    }

    try {
      const categoryData = {
        ...formData,
        subcategories: editingCategory?.subcategories || [],
        updatedAt: Timestamp.now()
      };

      if (editingCategory) {
        await updateDoc(doc(db, 'categories', editingCategory.id), categoryData);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: Timestamp.now()
        });
      }

      await loadData();
      closeForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const saveSubcategory = async () => {
    if (!subFormData.name.trim() || !subFormData.slug.trim() || !subFormData.parentCategory) {
      alert('Tous les champs sont obligatoires');
      return;
    }

    try {
      const subcategoryData = {
        ...subFormData,
        updatedAt: Timestamp.now()
      };

      if (editingSubcategory) {
        await updateDoc(doc(db, 'subcategories', editingSubcategory.id), subcategoryData);
      } else {
        await addDoc(collection(db, 'subcategories'), {
          ...subcategoryData,
          createdAt: Timestamp.now()
        });
      }

      await loadData();
      closeForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  // Suppressions
  const deleteCategory = async (category: Category) => {
    if (!confirm(`Supprimer "${category.name}" ?`)) return;
    
    try {
      await deleteDoc(doc(db, 'categories', category.id));
      await loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const deleteSubcategory = async (subcategory: Subcategory) => {
    if (!confirm(`Supprimer "${subcategory.name}" ?`)) return;
    
    try {
      await deleteDoc(doc(db, 'subcategories', subcategory.id));
      await loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Actions formulaires
  const openCategoryForm = (category?: Category) => {
    setFormType('category');
    setEditingCategory(category || null);
    setFormData(category ? {
      name: category.name,
      slug: category.slug,
      title: category.title,
      shortSEOdescription: category.shortSEOdescription,
      longSEOdescription: category.longSEOdescription,
      imageUrl: category.imageUrl || ''
    } : {
      name: '', slug: '', title: '', shortSEOdescription: '', longSEOdescription: '', imageUrl: ''
    });
    setShowForm(true);
  };

  const openSubcategoryForm = (subcategory?: Subcategory) => {
    setFormType('subcategory');
    setEditingSubcategory(subcategory || null);
    setSubFormData(subcategory ? {
      name: subcategory.name,
      slug: subcategory.slug,
      title: subcategory.title,
      shortSEOdescription: subcategory.shortSEOdescription,
      longSEOdescription: subcategory.longSEOdescription,
      parentCategory: subcategory.parentCategory,
      imageUrl: subcategory.imageUrl || ''
    } : {
      name: '', slug: '', title: '', shortSEOdescription: '', longSEOdescription: '', parentCategory: '', imageUrl: ''
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
    setEditingSubcategory(null);
  };

  const getCategoryName = (slug: string) => {
    return categories.find(cat => cat.slug === slug)?.name || slug;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleAdminNav />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Catégories</h1>
            <p className="text-gray-600">
              {categories.length} catégorie(s) • {subcategories.length} sous-catégorie(s)
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => openCategoryForm()}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle catégorie</span>
            </button>
            <button
              onClick={() => openSubcategoryForm()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle sous-catégorie</span>
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'categories'
                ? 'bg-pink-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📂 Catégories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'subcategories'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📁 Sous-catégories ({subcategories.length})
          </button>
        </div>

        {/* Contenu */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              {activeTab === 'categories' ? 'Catégories principales' : 'Sous-catégories'}
            </h2>
          </div>
          
          {(activeTab === 'categories' ? categories : subcategories).length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucun élément trouvé. Créez votre premier élément !
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeTab === 'categories' ? (
                // Liste catégories
                categories.map((category) => (
                  <div key={category.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* ✅ Prévisualisation de l'image avec Image Next.js */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {category.imageUrl ? (
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-pink-200 to-pink-100 flex items-center justify-center">
                              <span className="text-pink-600 font-bold text-lg">
                                {category.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{category.name}</h3>
                            <span className="text-sm text-gray-500">/{category.slug}</span>
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {subcategories.filter(sub => sub.parentCategory === category.slug).length} sous-catégories
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{category.shortSEOdescription}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Title:</span> {category.title}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openCategoryForm(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCategory(category)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                // Liste sous-catégories
                subcategories.map((subcategory) => (
                  <div key={subcategory.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {/* ✅ Prévisualisation de l'image avec Image Next.js */}
                        <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 relative">
                          {subcategory.imageUrl ? (
                            <Image
                              src={subcategory.imageUrl}
                              alt={subcategory.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-200 to-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">
                                {subcategory.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{subcategory.name}</h3>
                            <span className="text-sm text-gray-500">/{subcategory.parentCategory}/{subcategory.slug}</span>
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              {getCategoryName(subcategory.parentCategory)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{subcategory.shortSEOdescription}</p>
                          <div className="text-xs text-gray-500 mt-2">
                            <span className="font-medium">Title:</span> {subcategory.title}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openSubcategoryForm(subcategory)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteSubcategory(subcategory)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {formType === 'category' 
                      ? (editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie')
                      : (editingSubcategory ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie')
                    }
                  </h2>
                  <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Formulaire */}
                <div className="space-y-4">
                  {/* Section Upload d'image */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image de la catégorie
                    </label>
                    
                    {/* Prévisualisation actuelle */}
                    {((formType === 'category' && formData.imageUrl) || 
                      (formType === 'subcategory' && subFormData.imageUrl)) && (
                      <div className="mb-3">
                        {/* ✅ Utilisation d'Image Next.js */}
                        <div className="w-20 h-20 rounded-full border-2 border-gray-200 overflow-hidden relative">
                          <Image
                            src={formType === 'category' ? formData.imageUrl! : subFormData.imageUrl!}
                            alt="Prévisualisation"
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Input de fichier */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                        uploading 
                          ? 'border-gray-200 bg-gray-50' 
                          : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                      }`}>
                        {uploading ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-pink-600"></div>
                            <span className="text-sm text-gray-600">Upload en cours...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center space-y-2">
                            <Upload className="w-8 h-8 text-gray-400" />
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-pink-600">Cliquez pour uploader</span> ou glissez une image
                            </div>
                            <div className="text-xs text-gray-500">
                              PNG, JPG, GIF jusqu&apos;à 5MB
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {formType === 'subcategory' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégorie parent *
                      </label>
                      <select
                        value={subFormData.parentCategory}
                        onChange={(e) => handleSubcategoryChange('parentCategory', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner une catégorie</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formType === 'category' ? formData.name : subFormData.name}
                      onChange={(e) => formType === 'category' 
                        ? handleCategoryChange('name', e.target.value)
                        : handleSubcategoryChange('name', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Ex: Soins Visage"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      value={formType === 'category' ? formData.slug : subFormData.slug}
                      onChange={(e) => formType === 'category' 
                        ? handleCategoryChange('slug', e.target.value)
                        : handleSubcategoryChange('slug', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="soins-visage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title SEO *
                    </label>
                    <input
                      type="text"
                      value={formType === 'category' ? formData.title : subFormData.title}
                      onChange={(e) => formType === 'category' 
                        ? handleCategoryChange('title', e.target.value)
                        : handleSubcategoryChange('title', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Titre SEO optimisé"
                      maxLength={60}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description courte SEO *
                    </label>
                    <textarea
                      value={formType === 'category' ? formData.shortSEOdescription : subFormData.shortSEOdescription}
                      onChange={(e) => formType === 'category' 
                        ? handleCategoryChange('shortSEOdescription', e.target.value)
                        : handleSubcategoryChange('shortSEOdescription', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={3}
                      placeholder="Meta description pour Google"
                      maxLength={160}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description longue SEO *
                    </label>
                    <textarea
                      value={formType === 'category' ? formData.longSEOdescription : subFormData.longSEOdescription}
                      onChange={(e) => formType === 'category' 
                        ? handleCategoryChange('longSEOdescription', e.target.value)
                        : handleSubcategoryChange('longSEOdescription', e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={4}
                      placeholder="Description détaillée pour la page"
                      maxLength={500}
                    />
                  </div>

                  {/* Prévisualisation */}
                  {((formType === 'category' && formData.title && formData.shortSEOdescription) ||
                    (formType === 'subcategory' && subFormData.title && subFormData.shortSEOdescription)) && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        <Eye className="w-4 h-4 inline mr-1" />
                        Prévisualisation Google
                      </h4>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                          {formType === 'category' ? formData.title : subFormData.title}
                        </div>
                        <div className="text-green-700 text-sm">
                          beautydiscount.ma › {formType === 'category' 
                            ? formData.slug 
                            : `${subFormData.parentCategory} › ${subFormData.slug}`
                          }
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {formType === 'category' ? formData.shortSEOdescription : subFormData.shortSEOdescription}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={formType === 'category' ? saveCategory : saveSubcategory}
                    disabled={uploading}
                    className={`text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      formType === 'category' 
                        ? 'bg-pink-600 hover:bg-pink-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {uploading ? 'Upload...' : (
                        formType === 'category' 
                          ? (editingCategory ? 'Modifier' : 'Créer') 
                          : (editingSubcategory ? 'Modifier' : 'Créer')
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategoriesPage;