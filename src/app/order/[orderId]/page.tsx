// app/order/[orderId]/page.tsx - VERSION CORRIGÉE
'use client'
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  Package, 
  Truck, 
  MapPin, 
  Phone, 
  Mail,

  CreditCard,

  Share2,
  ArrowLeft,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useCartStore, Order, useCartActions } from '@/store/cartStore';

/**
 * Page de confirmation de commande - VERSION CORRIGÉE
 * Finalise le processus de checkout en vidant le panier de manière sécurisée
 */
const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const router = useRouter();
  
  // Store Zustand
  const { orders, currentOrder } = useCartStore();
  
  // 🔧 NOUVEAU: Actions de checkout pour finaliser le processus
  const { finishCheckoutProcess } = useCartActions();
  
  // États locaux
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [hasFinishedCheckout, setHasFinishedCheckout] = useState(false);

  // 🔧 CORRECTION: Charger les données ET finaliser le checkout
  useEffect(() => {
    if (!orderId || typeof orderId !== 'string') {
      router.push('/');
      return;
    }

    // Chercher la commande dans le store
    let foundOrder = currentOrder?.id === orderId ? currentOrder : null;
    
    if (!foundOrder) {
      foundOrder = orders.find(o => o.id === orderId) || null;
    }

    if (foundOrder) {
      setOrder(foundOrder);
      
      // 🔧 NOUVEAU: Finaliser le processus de checkout une seule fois
      if (!hasFinishedCheckout) {
        console.log('🎉 Commande confirmée, finalisation du checkout...');
        finishCheckoutProcess(); // Ceci va vider le panier de manière sécurisée
        setHasFinishedCheckout(true);
      }
    } else {
      // Commande non trouvée
      router.push('/');
      return;
    }
    
    setLoading(false);
  }, [orderId, currentOrder, orders, router, finishCheckoutProcess, hasFinishedCheckout]);

  /**
   * Copie le numéro de commande dans le presse-papiers
   */
  const copyOrderNumber = async () => {
    if (!order) return;
    
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  /**
   * Partage la commande (Web Share API ou fallback)
   */
  const shareOrder = async () => {
    if (!order) return;

    const shareData = {
      title: `Commande ${order.orderNumber} - BeautyDiscount.ma`,
      text: `Ma commande de ${order.total.toLocaleString()} DH est confirmée !`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papiers !');
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
    }
  };

  /**
   * Obtient le statut d'avancement de la commande
   */
  const getOrderProgress = () => {
    if (!order) return 0;
    
    switch (order.status) {
      case 'pending': return 25;
      case 'confirmed': return 50;
      case 'shipped': return 75;
      case 'delivered': return 100;
      default: return 0;
    }
  };

  /**
   * Obtient le libellé du statut
   */
  const getStatusLabel = () => {
    if (!order) return '';
    
    switch (order.status) {
      case 'pending': return 'En attente de confirmation';
      case 'confirmed': return 'Commande confirmée';
      case 'shipped': return 'Expédiée';
      case 'delivered': return 'Livrée';
      case 'cancelled': return 'Annulée';
      default: return 'Statut inconnu';
    }
  };

  /**
   * Obtient la couleur du statut
   */
  const getStatusColor = () => {
    if (!order) return 'gray';
    
    switch (order.status) {
      case 'pending': return 'yellow';
      case 'confirmed': return 'blue';
      case 'shipped': return 'purple';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };

  // État de chargement
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Finalisation de votre commande...</h2>
          <p className="text-gray-600">Nous préparons la confirmation de votre commande.</p>
        </div>
      </div>
    );
  }

  // Commande non trouvée
  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Commande non trouvée
          </h1>
          <p className="text-gray-600 mb-6">
            Cette commande n&apos;existe pas ou a été supprimée.
          </p>
          <Link
            href="/"
            className="inline-flex items-center bg-pink-600 text-white px-6 py-3 rounded-lg hover:bg-pink-700 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    );
  }

  const statusColor = getStatusColor();
  const progress = getOrderProgress();

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        
        {/* 🎉 Header de confirmation avec animation */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6 animate-pulse">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            🎉 Commande confirmée !
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto mb-4">
            Merci pour votre commande. Nous avons bien reçu votre demande et nous la traitons rapidement.
          </p>
          
          {/* 🔧 NOUVEAU: Message de confirmation du vidage du panier */}
          {hasFinishedCheckout && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-green-700">
                ✅ Votre panier a été vidé et votre commande est en cours de traitement.
              </p>
            </div>
          )}
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            
            {/* Colonne principale - Détails de la commande */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Informations générales */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900">
                    Commande #{order.orderNumber}
                  </h2>
                  <button
                    onClick={copyOrderNumber}
                    className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                {/* Statut et progression */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Statut</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      statusColor === 'green' ? 'bg-green-100 text-green-800' :
                      statusColor === 'blue' ? 'bg-blue-100 text-blue-800' :
                      statusColor === 'purple' ? 'bg-purple-100 text-purple-800' :
                      statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {getStatusLabel()}
                    </span>
                  </div>
                  
                  {/* Barre de progression */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        statusColor === 'green' ? 'bg-green-500' :
                        statusColor === 'blue' ? 'bg-blue-500' :
                        statusColor === 'purple' ? 'bg-purple-500' :
                        statusColor === 'yellow' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Timeline de livraison */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Suivi de commande</h3>
                  <div className="space-y-3">
                    
                    {/* Étape 1 - Commande reçue */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        progress >= 25 ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {progress >= 25 && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Commande reçue</p>
                        <p className="text-xs text-gray-500">
                          {order.createdAt.toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Étape 2 - Confirmation */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        progress >= 50 ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {progress >= 50 && <CheckCircle className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Commande confirmée</p>
                        <p className="text-xs text-gray-500">
                          {progress >= 50 ? 'Confirmée' : 'En attente de confirmation'}
                        </p>
                      </div>
                    </div>

                    {/* Étape 3 - Expédition */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        progress >= 75 ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {progress >= 75 && <Truck className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Expédition</p>
                        <p className="text-xs text-gray-500">
                          {progress >= 75 ? 'Expédiée' : 'Préparation en cours'}
                        </p>
                      </div>
                    </div>

                    {/* Étape 4 - Livraison */}
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        progress >= 100 ? 'bg-green-500' : 'bg-gray-200'
                      }`}>
                        {progress >= 100 && <Package className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Livraison</p>
                        <p className="text-xs text-gray-500">
                          {progress >= 100 ? 'Livrée' : `Prévue le ${order.estimatedDelivery?.toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Articles commandés */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Articles commandés ({order.items.length})
                </h2>
                
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.productId} className="flex space-x-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                      {/* Image */}
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
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Détails */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <Link 
                              href={`/product/${item.slug}`}
                              className="block hover:text-pink-600 transition-colors duration-200"
                            >
                              <p className="text-xs text-gray-500 uppercase font-medium mb-1">
                                {item.brand}
                              </p>
                              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                                {item.name}
                              </h3>
                            </Link>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>Quantité: {item.quantity}</span>
                              <span>Prix unitaire: {item.price.toLocaleString()} DH</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">
                              {(item.price * item.quantity).toLocaleString()} DH
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Adresse de livraison */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <MapPin className="w-5 h-5 text-pink-600 mr-2" />
                  <h2 className="text-lg font-bold text-gray-900">Adresse de livraison</h2>
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">
                    {order.shippingInfo.firstName} {order.shippingInfo.lastName}
                  </p>
                  <p className="text-gray-700">{order.shippingInfo.address}</p>
                  <p className="text-gray-700">
                    {order.shippingInfo.city}, {order.shippingInfo.region}
                    {order.shippingInfo.postalCode && ` ${order.shippingInfo.postalCode}`}
                  </p>
                  <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{order.shippingInfo.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{order.shippingInfo.email}</span>
                    </div>
                  </div>
                  {order.shippingInfo.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">Instructions :</p>
                      <p className="text-sm text-gray-700">{order.shippingInfo.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar - Récapitulatif */}
            <div className="mt-8 lg:mt-0">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                
                <h2 className="text-lg font-bold text-gray-900 mb-6">
                  Récapitulatif
                </h2>

                {/* Détails financiers */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total</span>
                    <span className="font-medium">{order.subtotal.toLocaleString()} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison</span>
                    <span className="font-medium">
                      {order.shippingCost === 0 ? (
                        <span className="text-green-600">Gratuite</span>
                      ) : (
                        `${order.shippingCost.toLocaleString()} DH`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-base font-bold text-gray-900">Total</span>
                    <span className="text-xl font-bold text-pink-600">
                      {order.total.toLocaleString()} DH
                    </span>
                  </div>
                </div>

                {/* Mode de paiement */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Mode de paiement</p>
                      <p className="text-xs text-gray-600">
                        {order.paymentMethod === 'cod' ? 'Paiement à la livraison' : 'Carte bancaire'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={shareOrder}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-2.5 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partager</span>
                  </button>
                  
                  {/* 🔧 NOUVEAU: Bouton pour continuer les achats avec confirmation du panier vidé */}
                  <Link
                    href="/"
                    className="w-full flex items-center justify-center space-x-2 bg-pink-600 text-white py-2.5 px-4 rounded-lg hover:bg-pink-700 transition-colors duration-200"
                  >
                    <span>Continuer mes achats</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>

                {/* Support */}
                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-xs text-gray-500 mb-2">Besoin d&apos;aide ?</p>
                  <a
                    href="tel:0662185335"
                    className="text-sm text-pink-600 hover:text-pink-700 font-medium"
                  >
                    06 62 18 53 35
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;