// app/admin/orders/page.tsx - Version corrigée (erreurs fixées)
'use client'
import React, { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore'; // ✅ Supprimé 'where' non utilisé
import { db } from '@/lib/firebase';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  X, 
  Eye,
  Phone,
  MapPin,
  Calendar,
  CreditCard
  // ✅ Supprimé Edit, Filter, Search non utilisés
} from 'lucide-react';
import Image from 'next/image'; // ✅ Ajouté pour remplacer <img>
import SimpleAdminNav from '@/components/admin/SimpleAdminNav';

/**
 * Interface pour une commande Firebase
 */
interface Order {
  id: string;
  orderNumber: string;
  items: Array<{
    productId: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
    imageUrl: string;
  }>;
  shippingInfo: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    notes?: string;
  };
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card';
  customerPhone: string;
  customerName: string;
  createdAt: Timestamp | { toDate(): Date } | Date; // ✅ Type plus spécifique au lieu de 'any'
  estimatedDelivery?: Timestamp | { toDate(): Date } | Date; // ✅ Type plus spécifique au lieu de 'any'
  trackingNumber?: string;
  notes?: string;
}

/**
 * Page d'administration des commandes
 */
const AdminOrdersPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Filtres
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Charger les commandes depuis Firebase
  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersData.push({
          id: doc.id,
          ...data
        } as Order);
      });
      
      setOrders(ordersData);
      console.log('✅ Commandes chargées:', ordersData.length);
      
    } catch (error) {
      console.error('❌ Erreur chargement commandes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour le statut d'une commande
  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      setUpdatingStatus(orderId);
      
      await updateDoc(doc(db, 'orders', orderId), {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      // Mettre à jour l'état local
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      console.log('✅ Statut mis à jour:', orderId, newStatus);
      
    } catch (error) {
      console.error('❌ Erreur mise à jour statut:', error);
      alert('Erreur lors de la mise à jour du statut');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // ✅ Fonction utilitaire pour convertir la date
  const getOrderDate = (timestamp: Order['createdAt']): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp && typeof timestamp === 'object' && 'toDate' in timestamp) {
      return timestamp.toDate();
    }
    return new Date(timestamp as string | number);
  };

  // Filtrer les commandes
  const filteredOrders = orders.filter(order => {
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesSearch = !searchTerm || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);
    
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = getOrderDate(order.createdAt);
      const filterDate = new Date(dateFilter);
      matchesDate = orderDate.toDateString() === filterDate.toDateString();
    }
    
    return matchesStatus && matchesSearch && matchesDate;
  });

  // Obtenir la couleur du statut
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtenir l'icône du statut
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <Package className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Statistiques
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + o.total, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <SimpleAdminNav />
        <div className="p-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2">Chargement des commandes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleAdminNav />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Commandes</h1>
          <p className="text-gray-600">
            {filteredOrders.length} commande(s) sur {orders.length} au total
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-gray-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Confirmées</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Expédiées</p>
                <p className="text-2xl font-bold text-purple-600">{stats.shipped}</p>
              </div>
              <Truck className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Livrées</p>
                <p className="text-2xl font-bold text-green-600">{stats.delivered}</p>
              </div>
              <Package className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">CA Total</p>
                <p className="text-lg font-bold text-pink-600">{stats.totalRevenue.toLocaleString()} DH</p>
              </div>
              <CreditCard className="w-8 h-8 text-pink-600" />
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Rechercher (N° commande, nom, tél...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmées</option>
                <option value="shipped">Expédiées</option>
                <option value="delivered">Livrées</option>
                <option value="cancelled">Annulées</option>
              </select>
            </div>
            
            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            
            <div>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setDateFilter('');
                }}
                className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-200"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        {/* Liste des commandes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Commande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Articles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    {/* Commande */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.paymentMethod === 'cod' ? '💵 Paiement livraison' : '💳 Carte bancaire'}
                        </div>
                      </div>
                    </td>

                    {/* Client */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Phone className="w-3 h-3 mr-1" />
                          {order.customerPhone}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {order.shippingInfo.city}
                        </div>
                      </div>
                    </td>

                    {/* Articles */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {order.items.length} article{order.items.length > 1 ? 's' : ''}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="truncate max-w-xs">
                            {item.quantity}× {item.name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-xs text-gray-400">
                            +{order.items.length - 2} autres...
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Total */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {order.total.toLocaleString()} DH
                      </div>
                      <div className="text-xs text-gray-500">
                        Livraison: {order.shippingCost === 0 ? 'Gratuite' : `${order.shippingCost} DH`}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">
                            {order.status === 'pending' && 'En attente'}
                            {order.status === 'confirmed' && 'Confirmée'}
                            {order.status === 'shipped' && 'Expédiée'}
                            {order.status === 'delivered' && 'Livrée'}
                            {order.status === 'cancelled' && 'Annulée'}
                          </span>
                        </span>
                      </div>
                      
                      {/* Sélecteur de statut */}
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        disabled={updatingStatus === order.id}
                        className="mt-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      >
                        <option value="pending">En attente</option>
                        <option value="confirmed">Confirmée</option>
                        <option value="shipped">Expédiée</option>
                        <option value="delivered">Livrée</option>
                        <option value="cancelled">Annulée</option>
                      </select>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getOrderDate(order.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Calendar className="w-3 h-3 mr-1" />
                        {getOrderDate(order.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="text-pink-600 hover:text-pink-900 mr-3"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Aucune commande trouvée avec ces filtres.
            </div>
          )}
        </div>

        {/* Modal détails commande */}
        {showOrderModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                
                {/* Header modal */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Commande #{selectedOrder.orderNumber}
                  </h2>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Informations client */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Informations client
                    </h3>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Nom complet</p>
                      <p className="text-sm text-gray-900">{selectedOrder.customerName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Téléphone</p>
                      <p className="text-sm text-gray-900">
                        <a href={`tel:${selectedOrder.customerPhone}`} className="text-pink-600 hover:text-pink-700">
                          {selectedOrder.customerPhone}
                        </a>
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Adresse de livraison</p>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.shippingInfo.address}<br />
                        {selectedOrder.shippingInfo.city}
                      </p>
                    </div>
                    
                    {selectedOrder.shippingInfo.notes && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Instructions</p>
                        <p className="text-sm text-gray-900">{selectedOrder.shippingInfo.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Détails commande */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">
                      Détails commande
                    </h3>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Statut</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-1">
                          {selectedOrder.status === 'pending' && 'En attente'}
                          {selectedOrder.status === 'confirmed' && 'Confirmée'}
                          {selectedOrder.status === 'shipped' && 'Expédiée'}
                          {selectedOrder.status === 'delivered' && 'Livrée'}
                          {selectedOrder.status === 'cancelled' && 'Annulée'}
                        </span>
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date de commande</p>
                      <p className="text-sm text-gray-900">
                        {getOrderDate(selectedOrder.createdAt).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700">Mode de paiement</p>
                      <p className="text-sm text-gray-900">
                        {selectedOrder.paymentMethod === 'cod' ? '💵 Paiement à la livraison' : '💳 Carte bancaire'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Articles commandés */}
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mb-4">
                    Articles commandés
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                        {/* ✅ Utilisation d'Image Next.js */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden relative">
                          {item.imageUrl && (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-500">{item.brand}</p>
                          <p className="text-sm text-gray-600">
                            Quantité: {item.quantity} × {item.price.toLocaleString()} DH
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {(item.quantity * item.price).toLocaleString()} DH
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Récapitulatif financier */}
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Récapitulatif</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sous-total</span>
                      <span className="font-medium">{selectedOrder.subtotal.toLocaleString()} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Livraison</span>
                      <span className="font-medium">
                        {selectedOrder.shippingCost === 0 ? 'Gratuite' : `${selectedOrder.shippingCost.toLocaleString()} DH`}
                      </span>
                    </div>
                    <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-pink-600">{selectedOrder.total.toLocaleString()} DH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrdersPage;