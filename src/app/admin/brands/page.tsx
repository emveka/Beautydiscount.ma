// app/admin/brands/page.tsx - Version avec navigation
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Eye, Save, X, } from 'lucide-react';
import SimpleAdminNav from '@/components/admin/SimpleAdminNav'; // ✅ Import ajouté

interface Brand {
  id: string;
  slug: string;
  name: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface BrandForm {
  name: string;
  slug: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
}

const AdminBrandsPage = () => {
  // États (votre code existant)
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  
  const [formData, setFormData] = useState<BrandForm>({
    name: '',
    slug: '',
    title: '',
    shortSEOdescription: '',
    longSEOdescription: ''
  });

  // Toutes vos fonctions existantes (loadBrands, generateSlug, etc.)
  const loadBrands = useCallback(async () => {
    try {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, 'brands'), orderBy('name')));
      const brandsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Brand[];
      
      setBrands(brandsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  // Vos autres fonctions (generateSlug, handleInputChange, saveBrand, deleteBrand, etc.)
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
      .replace(/^-+|-+$/g, '');  
  };

  const handleInputChange = (field: keyof BrandForm, value: string) => {
    setFormData(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      if (field === 'name') {
        updated.slug = generateSlug(value);
        updated.title = `${value} - | BeautyDiscount.ma`;
      }
      
      return updated;
    });
  };

  const saveBrand = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Le nom et le slug sont obligatoires');
      return;
    }

    try {
      const brandData = {
        ...formData,
        updatedAt: Timestamp.now()
      };

      if (editingBrand) {
        await updateDoc(doc(db, 'brands', editingBrand.id), brandData);
      } else {
        await addDoc(collection(db, 'brands'), {
          ...brandData,
          createdAt: Timestamp.now()
        });
      }

      await loadBrands();
      closeForm();
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const deleteBrand = async (brand: Brand) => {
    if (!confirm(`Supprimer la marque "${brand.name}" ?`)) return;
    
    try {
      await deleteDoc(doc(db, 'brands', brand.id));
      await loadBrands();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const openForm = (brand?: Brand) => {
    setEditingBrand(brand || null);
    setFormData(brand ? {
      name: brand.name,
      slug: brand.slug,
      title: brand.title,
      shortSEOdescription: brand.shortSEOdescription,
      longSEOdescription: brand.longSEOdescription
    } : {
      name: '', slug: '', title: '', shortSEOdescription: '', longSEOdescription: ''
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBrand(null);
  };

  // ✅ Loading avec navigation
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

  // ✅ Interface principale avec navigation
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation ajoutée */}
      <SimpleAdminNav />
      
      {/* Contenu principal avec padding approprié */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des Marques</h1>
            <p className="text-gray-600">
              {brands.length} marque(s)
            </p>
          </div>
          <button
            onClick={() => openForm()}
            className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle marque</span>
          </button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total marques</p>
                <p className="text-2xl font-bold text-gray-900">{brands.length}</p>
              </div>
              <div className="text-pink-600">📋</div>
            </div>
          </div>
        </div>

        {/* Liste des marques */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Toutes les marques</h2>
          </div>
          
          {brands.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Aucune marque trouvée. Créez votre première marque !
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {brands.map((brand) => (
                <div key={brand.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium text-gray-900">{brand.name}</h3>
                          <span className="text-sm text-gray-500">/{brand.slug}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 truncate">
                          {brand.shortSEOdescription}
                        </p>
                        <div className="text-xs text-gray-500 mt-2">
                          <span className="font-medium">Title:</span> {brand.title}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openForm(brand)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBrand(brand)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Formulaire - reste identique */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingBrand ? 'Modifier la marque' : 'Nouvelle marque'}
                  </h2>
                  <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Formulaire */}
                <div className="space-y-4">
                  {/* Nom */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de la marque *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Ex: L'Oréal"
                      maxLength={50}
                    />
                  </div>

                  {/* Slug */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Slug URL *
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => handleInputChange('slug', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="loreal"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      URL: /marques/{formData.slug}
                    </div>
                  </div>

                  {/* Title SEO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title SEO *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Auto-généré depuis le nom"
                      maxLength={60}
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {formData.title.length}/60 caractères
                    </div>
                  </div>

                  {/* Description courte SEO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description courte SEO *
                    </label>
                    <textarea
                      value={formData.shortSEOdescription}
                      onChange={(e) => handleInputChange('shortSEOdescription', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={3}
                      placeholder="Découvrez tous les produits L'Oréal : maquillage, soins visage et cheveux. Livraison gratuite au Maroc."
                      maxLength={160}
                    />
                  </div>

                  {/* Description longue SEO */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description longue SEO *
                    </label>
                    <textarea
                      value={formData.longSEOdescription}
                      onChange={(e) => handleInputChange('longSEOdescription', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={4}
                      placeholder="L'Oréal, leader mondial de la beauté, vous propose une gamme complète de produits..."
                      maxLength={500}
                    />
                  </div>

                  {/* Prévisualisation */}
                  {formData.title && formData.shortSEOdescription && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        <Eye className="w-4 h-4 inline mr-1" />
                        Prévisualisation Google
                      </h4>
                      <div className="bg-white p-3 rounded border">
                        <div className="text-blue-600 text-lg hover:underline cursor-pointer">
                          {formData.title}
                        </div>
                        <div className="text-green-700 text-sm">
                          beautydiscount.ma › marques › {formData.slug}
                        </div>
                        <div className="text-gray-600 text-sm mt-1">
                          {formData.shortSEOdescription}
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
                    onClick={saveBrand}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingBrand ? 'Modifier' : 'Créer'}</span>
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

export default AdminBrandsPage;