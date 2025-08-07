// app/checkout/page.tsx - VERSION SIMPLIFIÉE SANS CONDITIONS
'use client'
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  Phone, 
  User,
  Truck,
  Shield,
  CheckCircle,
  ShoppingBag
} from 'lucide-react';
import { useCartStore, useCartData, ShippingInfo } from '@/store/cartStore';

/**
 * Page Checkout - Version simplifiée sans conditions générales
 */
const CheckoutPage = () => {
  const router = useRouter();
  
  // État du panier
  const { items, subtotal } = useCartData();
  const { shippingInfo, setShippingInfo, createOrder } = useCartStore();

  // Référence pour éviter la redirection pendant la création de commande
  const isCreatingOrderRef = useRef(false);
  const initialItemsRef = useRef(items);

  // Mémorisation des villes marocaines pour éviter les re-créations
  const moroccanCities = useMemo(() => [
    { name: 'Casablanca', cost: 25 },
    { name: 'Rabat', cost: 25 },
    { name: 'Salé', cost: 25 },
    { name: 'Fès', cost: 35 },
    { name: 'Marrakech', cost: 35 },
    { name: 'Agadir', cost: 45 },
    { name: 'Tanger', cost: 40 },
    { name: 'Meknès', cost: 35 },
    { name: 'Oujda', cost: 50 },
    { name: 'Kenitra', cost: 30 },
    { name: 'Tétouan', cost: 40 },
    { name: 'Safi', cost: 40 },
    { name: 'Mohammedia', cost: 25 },
    { name: 'El Jadida', cost: 35 },
    { name: 'Beni Mellal', cost: 40 },
    { name: 'Nador', cost: 50 },
    { name: 'Taza', cost: 45 },
    { name: 'Settat', cost: 30 },
    { name: 'Berrechid', cost: 30 },
    { name: 'Khemisset', cost: 30 },
    { name: 'Khouribga', cost: 35 },
    { name: 'Ouarzazate', cost: 55 },
    { name: 'Errachidia', cost: 60 },
    { name: 'Larache', cost: 40 },
    { name: 'Ksar El Kebir', cost: 40 },
    { name: 'Al Hoceima', cost: 50 },
    { name: 'Guelmim', cost: 60 },
    { name: 'Tiznit', cost: 55 },
    { name: 'Essaouira', cost: 45 },
    { name: 'Dakhla', cost: 80 },
    { name: 'Laâyoune', cost: 70 },
    { name: 'Autre ville', cost: 50 }
  ], []);

  // États locaux
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    city: '',
    address: '',
    notes: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'card'>('cod');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCityData, setSelectedCityData] = useState<{name: string, cost: number} | null>(null);

  // Mémorisation de la fonction de gestion des changements d'input
  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'city') {
      const cityData = moroccanCities.find(c => c.name === value);
      setSelectedCityData(cityData || null);
    }
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [moroccanCities, errors]);

  // Vérification état panier avec toutes les dépendances
  useEffect(() => {
    if (items.length > 0 && initialItemsRef.current.length === 0) {
      initialItemsRef.current = items;
    }

    if (items.length === 0 && initialItemsRef.current.length === 0 && !isCreatingOrderRef.current) {
      router.push('/cart');
    }
  }, [items, router]); // Ajout de 'items' dans les dépendances

  // Charger les données sauvegardées avec toutes les dépendances
  useEffect(() => {
    if (shippingInfo) {
      setFormData({
        firstName: shippingInfo.firstName || '',
        lastName: shippingInfo.lastName || '',
        phone: shippingInfo.phone || '',
        city: shippingInfo.city || '',
        address: shippingInfo.address || '',
        notes: shippingInfo.notes || ''
      });
      
      if (shippingInfo.city) {
        const cityData = moroccanCities.find(c => c.name === shippingInfo.city);
        setSelectedCityData(cityData || null);
      }
    }
  }, [shippingInfo, moroccanCities]); // Ajout de 'moroccanCities' dans les dépendances

  /**
   * Calcule le coût de livraison
   */
  const getShippingCostByCity = useCallback((): number => {
    if (!selectedCityData) return 0;
    return selectedCityData.cost;
  }, [selectedCityData]);

  const dynamicShippingCost = getShippingCostByCity();

  /**
   * Valide le formulaire
   */
  const validateForm = useCallback((): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est obligatoire';
    if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est obligatoire';
    if (!formData.phone.trim()) newErrors.phone = 'Le téléphone est obligatoire';
    else if (!/^(\+212|0)[5-7]\d{8}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Numéro de téléphone marocain invalide';
    }
    if (!formData.city.trim()) newErrors.city = 'La ville est obligatoire';
    if (!formData.address.trim()) newErrors.address = 'L\'adresse est obligatoire';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  /**
   * Soumet la commande
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const currentItems = items.length > 0 ? items : initialItemsRef.current;
    
    if (currentItems.length === 0) {
      alert('Votre panier est vide');
      router.push('/cart');
      return;
    }

    setIsSubmitting(true);
    isCreatingOrderRef.current = true;

    try {
      const shippingInfo: ShippingInfo = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: '',
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        postalCode: '',
        region: formData.city,
        notes: formData.notes
      };
      
      setShippingInfo(shippingInfo);
      const orderId = await createOrder(paymentMethod);
      
      setTimeout(() => {
        router.push(`/order/${orderId}`);
      }, 100);
      
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      alert('Erreur lors de la création de la commande. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
      isCreatingOrderRef.current = false;
    }
  }, [validateForm, items, formData, paymentMethod, setShippingInfo, createOrder, router]);

  // Écran de chargement pendant création commande
  if (isCreatingOrderRef.current) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Création de votre commande...</h2>
          <p className="text-gray-600">Veuillez patienter pendant que nous finalisons votre commande.</p>
        </div>
      </div>
    );
  }

  // Écran de chargement si panier vide
  if (items.length === 0 && initialItemsRef.current.length === 0 && !isCreatingOrderRef.current) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  // Variables d'affichage
  const displayItems = items.length > 0 ? items : initialItemsRef.current;
  const displaySubtotal = items.length > 0 ? subtotal : initialItemsRef.current.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/cart"
            className="inline-flex items-center text-pink-600 hover:text-pink-700 transition-colors duration-200 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au panier
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Finaliser la commande</h1>
          <p className="text-gray-600 mt-1">
            Dernière étape avant de recevoir vos produits
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            
            {/* VERSION MOBILE - Récapitulatif EN PREMIER */}
            <div className="lg:hidden mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4">
                
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Récapitulatif de commande
                </h2>

                {/* Articles mobiles */}
                <div className="space-y-3 mb-4">
                  {displayItems.map((item) => (
                    <div key={item.productId} className="flex space-x-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-600">Qté: {item.quantity}</span>
                          <span className="text-sm font-medium text-pink-600">
                            {(item.price * item.quantity).toLocaleString()} DH
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculs mobiles */}
                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{displaySubtotal.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-medium">
                      {!selectedCityData ? (
                        <span className="text-gray-500">À définir</span>
                      ) : (
                        `${dynamicShippingCost.toLocaleString()} DH`
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold">
                      {!selectedCityData ? (
                        <span className="text-gray-500">À définir</span>
                      ) : (
                        <span className="text-pink-600">
                          {(displaySubtotal + dynamicShippingCost).toLocaleString()} DH
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Colonne principale - Formulaire */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Mode de paiement */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <CreditCard className="w-5 h-5 text-pink-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Mode de paiement</h2>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors duration-200 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'cod')}
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">💵 Paiement à la livraison</div>
                          <div className="text-sm text-gray-600">Payez en espèces lors de la réception</div>
                        </div>
                        <Truck className="w-5 h-5 text-green-600" />
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-not-allowed opacity-50">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      disabled
                      className="w-4 h-4 text-pink-600 focus:ring-pink-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">💳 Carte bancaire</div>
                          <div className="text-sm text-gray-600">Bientôt disponible</div>
                        </div>
                        <CreditCard className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Informations personnelles */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <User className="w-5 h-5 text-pink-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Informations personnelles</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.firstName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Votre prénom"
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.lastName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Votre nom"
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.phone ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="06 12 34 56 78"
                    />
                    {errors.phone && (
                      <p className="text-red-600 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-6">
                  <MapPin className="w-5 h-5 text-pink-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Adresse de livraison</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ville *
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.city ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Sélectionner votre ville</option>
                      {moroccanCities.map(city => (
                        <option key={city.name} value={city.name}>
                          {city.name} {city.name !== 'Autre ville' && `(${city.cost} DH)`}
                        </option>
                      ))}
                    </select>
                    {errors.city && (
                      <p className="text-red-600 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse complète *
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 ${
                        errors.address ? 'border-red-300' : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Numéro, rue, quartier, repères..."
                    />
                    {errors.address && (
                      <p className="text-red-600 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instructions de livraison (optionnel)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      rows={2}
                      placeholder="Étage, code d'accès, heures de préférence..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar - Récapitulatif DESKTOP */}
            <div className="hidden lg:block mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Récapitulatif de commande
                </h2>

                {/* Articles desktop */}
                <div className="space-y-4 mb-6">
                  {displayItems.map((item) => (
                    <div key={item.productId} className="flex space-x-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <Image
                            src={item.imageUrl}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">{item.brand}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-600">Qté: {item.quantity}</span>
                          <span className="text-sm font-medium text-pink-600">
                            {(item.price * item.quantity).toLocaleString()} DH
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Calculs desktop */}
                <div className="space-y-3 mb-6 pt-6 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{displaySubtotal.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-medium">
                      {!selectedCityData ? (
                        <span className="text-gray-500">À définir</span>
                      ) : (
                        `${dynamicShippingCost.toLocaleString()} DH`
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-base font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold">
                        {!selectedCityData ? (
                          <span className="text-gray-500">À définir</span>
                        ) : (
                          <span className="text-pink-600">
                            {(displaySubtotal + dynamicShippingCost).toLocaleString()} DH
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bouton validation desktop */}
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedCityData}
                  className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Validation...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Valider la commande</span>
                    </>
                  )}
                </button>

                {/* Garanties desktop */}
                <div className="mt-6 space-y-3 pt-6 border-t border-gray-200">
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Truck className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Livraison en 24-48h</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span>Commande sécurisée</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-gray-600">
                    <Phone className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <span>Support client 7j/7</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton validation mobile en bas */}
          <div className="lg:hidden mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !selectedCityData}
              className="w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Valider la commande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;