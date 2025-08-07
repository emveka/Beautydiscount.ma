// app/admin/products/page.tsx - Version corrigée (erreurs fixées)
'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, deleteDoc, doc, addDoc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Plus, Edit, Trash2, Eye, Save, X, Package, Star, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import SimpleAdminNav from '@/components/admin/SimpleAdminNav';
import ImageUpload from '@/components/admin/ImageUpload';

interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  categories: Array<{
    category: string;
    subcategory?: string;
  }>;
  price?: number;
  originalPrice?: number;
  discount?: number;
  prixAchat?: number;
  title?: string;
  shortSEOdescription?: string;
  longSEOdescription?: string;
  shortDescription?: string;
  images?: string[];
  mainImage?: string;
  inStock?: boolean;
  quantity?: number;
  sku?: string;
  codeBarre?: string;
  contenance?: string;
  specifications?: Record<string, string>;
  featured?: boolean;
  canonicalPath: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

interface ProductForm {
  name: string;
  brand: string;
  categories: Array<{
    category: string;
    subcategory?: string;
  }>;
  price: string;
  originalPrice: string;
  prixAchat: string;
  title: string;
  shortSEOdescription: string;
  longSEOdescription: string;
  shortDescription: string;
  images: string[];
  mainImage: string;
  inStock: boolean;
  quantity: string;
  sku: string;
  codeBarre: string;
  contenance: string;
  specifications: Record<string, string>;
  featured: boolean;
}

interface Category {
  id: string;
  slug: string;
  name: string;
}

interface Subcategory {
  id: string;
  slug: string;
  name: string;
  parentCategory: string;
}

interface Brand {
  id: string;
  slug: string;
  name: string;
}

const AdminProductsPage = () => {
  // États
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<ProductForm>({
    name: '',
    brand: '',
    categories: [],
    price: '',
    originalPrice: '',
    prixAchat: '',
    title: '',
    shortSEOdescription: '',
    longSEOdescription: '',
    shortDescription: '',
    images: [],
    mainImage: '',
    inStock: true,
    quantity: '',
    sku: '',
    codeBarre: '',
    contenance: '',
    specifications: {},
    featured: false
  });

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [productsSnapshot, categoriesSnapshot, subcategoriesSnapshot, brandsSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('name'))),
        getDocs(query(collection(db, 'categories'), orderBy('name'))),
        getDocs(query(collection(db, 'subcategories'), orderBy('name'))),
        getDocs(query(collection(db, 'brands'), orderBy('name')))
      ]);
      
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      
      const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Subcategory[];
      
      const brandsData = brandsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Brand[];
      
      setProducts(productsData);
      setCategories(categoriesData);
      setSubcategories(subcategoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Générer le slug avec marque
  const generateSlugWithBrand = (brand: string, name: string) => {
    const combinedText = `${brand} ${name}`;
    return combinedText
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

  // Calculer la réduction
  const calculateDiscount = (original: number, current: number) => {
    if (!original || !current || original <= current) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  // ✅ Gestion formulaire avec types spécifiques
  const handleInputChange = (field: keyof ProductForm, value: string | boolean | string[] | Array<{category: string; subcategory?: string}> | Record<string, string>) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-générer title depuis nom + marque
      if (field === 'name' || field === 'brand') {
        if (updated.name && updated.brand) {
          updated.title = `${updated.name} ${getBrandName(updated.brand)} | BeautyDiscount.ma`;
        }
      }
      
      return updated;
    });
  };

  // Ajouter une catégorie
  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, { category: '', subcategory: '' }]
    }));
  };

  // Supprimer une catégorie
  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
  };

  // Modifier une catégorie
  const updateCategory = (index: number, field: 'category' | 'subcategory', value: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  // Sauvegarder
  const saveProduct = async () => {
    if (!formData.name.trim() || !formData.brand || formData.categories.length === 0) {
      alert('Le nom, la marque et au moins une catégorie sont obligatoires');
      return;
    }

    try {
      const price = parseFloat(formData.price) || 0;
      const originalPrice = parseFloat(formData.originalPrice) || 0;
      const discount = calculateDiscount(originalPrice, price);
      const slug = generateSlugWithBrand(getBrandName(formData.brand), formData.name);
      
      const productData = {
        name: formData.name,
        slug: slug,
        brand: formData.brand,
        categories: formData.categories.filter(cat => cat.category),
        ...(price > 0 && { price }),
        ...(originalPrice > 0 && { originalPrice }),
        ...(discount > 0 && { discount }),
        ...(parseFloat(formData.prixAchat) > 0 && { prixAchat: parseFloat(formData.prixAchat) }),
        ...(formData.title && { title: formData.title }),
        ...(formData.shortSEOdescription && { shortSEOdescription: formData.shortSEOdescription }),
        ...(formData.longSEOdescription && { longSEOdescription: formData.longSEOdescription }),
        ...(formData.shortDescription && { shortDescription: formData.shortDescription }),
        ...(formData.images.length > 0 && { images: formData.images }),
        ...(formData.mainImage && { mainImage: formData.mainImage }),
        inStock: formData.inStock,
        ...(parseInt(formData.quantity) > 0 && { quantity: parseInt(formData.quantity) }),
        ...(formData.sku && { sku: formData.sku }),
        ...(formData.codeBarre && { codeBarre: formData.codeBarre }),
        ...(formData.contenance && { contenance: formData.contenance }),
        ...(Object.keys(formData.specifications).length > 0 && { specifications: formData.specifications }),
        featured: formData.featured,
        canonicalPath: `/products/${slug}`,
        updatedAt: Timestamp.now()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData);
      } else {
        await addDoc(collection(db, 'products'), {
          ...productData,
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

  // Supprimer
  const deleteProduct = async (product: Product) => {
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
    
    try {
      await deleteDoc(doc(db, 'products', product.id));
      await loadData();
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // Toggle featured
  const toggleFeatured = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        featured: !product.featured,
        updatedAt: Timestamp.now()
      });
      await loadData();
    } catch (error) {
      console.error('Erreur mise à jour:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  // Actions formulaire
  const openForm = (product?: Product) => {
    setEditingProduct(product || null);
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        categories: product.categories || [],
        price: product.price?.toString() || '',
        originalPrice: product.originalPrice?.toString() || '',
        prixAchat: product.prixAchat?.toString() || '',
        title: product.title || '',
        shortSEOdescription: product.shortSEOdescription || '',
        longSEOdescription: product.longSEOdescription || '',
        shortDescription: product.shortDescription || '',
        images: product.images || [],
        mainImage: product.mainImage || '',
        inStock: product.inStock ?? true,
        quantity: product.quantity?.toString() || '',
        sku: product.sku || '',
        codeBarre: product.codeBarre || '',
        contenance: product.contenance || '',
        specifications: product.specifications || {},
        featured: product.featured || false
      });
    } else {
      setFormData({
        name: '', brand: '', categories: [], price: '', originalPrice: '', prixAchat: '',
        title: '', shortSEOdescription: '', longSEOdescription: '', shortDescription: '',
        images: [], mainImage: '', inStock: true, quantity: '', sku: '', codeBarre: '',
        contenance: '', specifications: {}, featured: false
      });
    }
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  // Filtrer les produits
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || 
      product.categories.some(cat => cat.category === filterCategory);
    
    const matchesBrand = !filterBrand || product.brand === filterBrand;
    
    const matchesStock = !filterStock || 
      (filterStock === 'instock' && product.inStock) ||
      (filterStock === 'outofstock' && !product.inStock);
    
    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  // Stats
  const totalProducts = products.length;
  const inStockProducts = products.filter(p => p.inStock).length;
  const outOfStockProducts = totalProducts - inStockProducts;
  const featuredProducts = products.filter(p => p.featured).length;

  // Obtenir le nom de la catégorie/marque
  const getCategoryName = (slug: string) => categories.find(c => c.slug === slug)?.name || slug;
  const getBrandName = (slug: string) => brands.find(b => b.slug === slug)?.name || slug;

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
      {/* Navigation */}
      <SimpleAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Produits</h1>
              <p className="text-gray-600 mt-1">
                {totalProducts} produit(s) • {filteredProducts.length} affiché(s)
              </p>
            </div>
            <button
              onClick={() => openForm()}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nouveau produit</span>
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total produits</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En stock</p>
                <p className="text-3xl font-bold text-green-600">{inStockProducts}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rupture stock</p>
                <p className="text-3xl font-bold text-red-600">{outOfStockProducts}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Produits vedettes</p>
                <p className="text-3xl font-bold text-yellow-600">{featuredProducts}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Toutes catégories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterBrand}
                onChange={(e) => setFilterBrand(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Toutes marques</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.slug}>{brand.name}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={filterStock}
                onChange={(e) => setFilterStock(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Tous stocks</option>
                <option value="instock">En stock</option>
                <option value="outofstock">Rupture</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('');
                  setFilterBrand('');
                  setFilterStock('');
                }}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des produits */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Produits ({filteredProducts.length})
            </h2>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {products.length === 0 ? 'Aucun produit' : 'Aucun résultat'}
              </h3>
              <p className="text-gray-600">
                {products.length === 0 
                  ? 'Créez votre premier produit pour commencer !'
                  : 'Aucun produit ne correspond aux filtres sélectionnés.'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Marque
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégories
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      {/* Colonne Produit */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {product.mainImage || (product.images && product.images[0]) ? (
                              <Image 
                                src={product.mainImage || product.images![0]} 
                                alt={product.name}
                                width={48}
                                height={48}
                                className="object-contain rounded"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {product.name}
                              </div>
                              {product.featured && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                            </div>
                            {product.contenance && (
                              <div className="text-sm text-gray-500">{product.contenance}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Colonne Marque */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {getBrandName(product.brand)}
                        </span>
                      </td>

                      {/* Colonne Prix */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          {product.price ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-pink-600">
                                {product.price.toFixed(2)} DH
                              </span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-xs text-gray-400 line-through">
                                  {product.originalPrice.toFixed(2)} DH
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">Non défini</span>
                          )}
                          {product.discount && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 mt-1">
                              -{product.discount}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonne Stock */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.inStock 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              product.inStock ? 'bg-green-400' : 'bg-red-400'
                            }`}></span>
                            {product.inStock ? 'En stock' : 'Rupture'}
                          </span>
                          {product.quantity && (
                            <div className="text-xs text-gray-500 mt-1">
                              Qté: {product.quantity}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Colonne Catégories */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {product.categories.slice(0, 2).map((cat, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                              {getCategoryName(cat.category)}
                              {cat.subcategory && (
                                <span className="text-blue-600"> › {cat.subcategory}</span>
                              )}
                            </span>
                          ))}
                          {product.categories.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                              +{product.categories.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonne Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => toggleFeatured(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.featured 
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                                : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                            }`}
                            title={product.featured ? 'Retirer des vedettes' : 'Mettre en vedette'}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openForm(product)}
                            className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteProduct(product)}
                            className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Formulaire */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingProduct ? 'Modifier le produit' : 'Nouveau produit'}
                  </h2>
                  <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Formulaire */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Colonne 1 - Infos de base */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Informations de base *
                    </h3>
                    
                    {/* Nom */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du produit *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="Ex: Rouge à lèvres mat"
                        required
                      />
                    </div>

                    {/* Marque */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marque *
                      </label>
                      <select
                        value={formData.brand}
                        onChange={(e) => handleInputChange('brand', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        required
                      >
                        <option value="">Sélectionner une marque</option>
                        {brands.map(brand => (
                          <option key={brand.id} value={brand.slug}>{brand.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Aperçu du slug */}
                    {formData.name && formData.brand && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <label className="block text-sm font-medium text-blue-700 mb-1">
                          Aperçu de l&apos;URL
                        </label>
                        <div className="text-sm text-blue-600 font-mono">
                          beautydiscount.ma/products/{generateSlugWithBrand(getBrandName(formData.brand), formData.name)}
                        </div>
                      </div>
                    )}

                    {/* Catégories */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Catégories *
                      </label>
                      {formData.categories.map((cat, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <select
                            value={cat.category}
                            onChange={(e) => updateCategory(index, 'category', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="">Catégorie</option>
                            {categories.map(category => (
                              <option key={category.id} value={category.slug}>{category.name}</option>
                            ))}
                          </select>
                          <select
                            value={cat.subcategory || ''}
                            onChange={(e) => updateCategory(index, 'subcategory', e.target.value)}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                          >
                            <option value="">Sous-catégorie</option>
                            {subcategories
                              .filter(sub => sub.parentCategory === cat.category)
                              .map(subcategory => (
                                <option key={subcategory.id} value={subcategory.slug}>{subcategory.name}</option>
                              ))}
                          </select>
                          <button
                            onClick={() => removeCategory(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addCategory}
                        className="text-pink-600 hover:text-pink-700 text-sm"
                      >
                        + Ajouter une catégorie
                      </button>
                    </div>

                    {/* Prix */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix de vente (DH)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="299.00"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix d&apos;achat (DH)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.prixAchat}
                          onChange={(e) => handleInputChange('prixAchat', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="150.00"
                        />
                      </div>
                    </div>

                    {/* Prix original et contenance */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Prix original (DH)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.originalPrice}
                          onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="399.00"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Pour calculer la réduction
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Contenance
                        </label>
                        <input
                          type="text"
                          value={formData.contenance}
                          onChange={(e) => handleInputChange('contenance', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="50ml, 100g..."
                        />
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité en stock
                        </label>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => handleInputChange('quantity', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="100"
                        />
                      </div>
                      <div className="flex items-center space-x-4 pt-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.inStock}
                            onChange={(e) => handleInputChange('inStock', e.target.checked)}
                            className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">En stock</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.featured}
                            onChange={(e) => handleInputChange('featured', e.target.checked)}
                            className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">Produit vedette</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Colonne 2 - Descriptions et SEO */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Descriptions et SEO
                    </h3>

                    {/* Description courte */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description courte
                      </label>
                      <textarea
                        value={formData.shortDescription}
                        onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
                        rows={2}
                        placeholder="Description courte pour les listes..."
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.shortDescription.length}/350 caractères
                      </div>
                    </div>

                    {/* Title SEO */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title SEO
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="Auto-généré depuis nom + marque"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.title.length}/60 caractères
                      </div>
                    </div>

                    {/* Description courte SEO */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description courte SEO
                      </label>
                      <textarea
                        value={formData.shortSEOdescription}
                        onChange={(e) => handleInputChange('shortSEOdescription', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y"
                        rows={3}
                        placeholder="Meta description pour Google..."
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.shortSEOdescription.length}/350 caractères
                      </div>
                    </div>

                    {/* Description longue SEO */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description longue SEO
                      </label>
                      <textarea
                        value={formData.longSEOdescription}
                        onChange={(e) => handleInputChange('longSEOdescription', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-y min-h-[100px]"
                        rows={4}
                        placeholder="Description détaillée pour la page produit..."
                        style={{ whiteSpace: 'pre-wrap' }}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        {formData.longSEOdescription.length} caractères
                      </div>
                    </div>

                    {/* Références */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          SKU
                        </label>
                        <input
                          type="text"
                          value={formData.sku}
                          onChange={(e) => handleInputChange('sku', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="REF-001"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Code-barres
                        </label>
                        <input
                          type="text"
                          value={formData.codeBarre}
                          onChange={(e) => handleInputChange('codeBarre', e.target.value)}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="123456789012"
                        />
                      </div>
                    </div>

                    {/* Images avec composant d'upload */}
                    <ImageUpload
                      images={formData.images}
                      mainImage={formData.mainImage}
                      onImagesChange={(images) => handleInputChange('images', images)}
                      onMainImageChange={(mainImage) => handleInputChange('mainImage', mainImage)}
                      productName={formData.name || 'nouveau-produit'}
                    />

                    {/* Prévisualisation Google */}
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
                            beautydiscount.ma › products › {formData.name && formData.brand ? generateSlugWithBrand(getBrandName(formData.brand), formData.name) : '...'}
                          </div>
                          <div className="text-gray-600 text-sm mt-1 whitespace-pre-wrap break-words">
                            {formData.shortSEOdescription}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveProduct}
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? 'Modifier' : 'Créer'}</span>
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

export default AdminProductsPage;