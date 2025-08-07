// store/cartStore.ts - VERSION COMPLÈTE avec support achat isolé
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Interface pour un article du panier
 */
export interface CartItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  quantity: number;
  slug: string;
  inStock: boolean;
}

/**
 * Interface pour les informations de livraison
 */
export interface ShippingInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  region: string;
  notes?: string;
}

/**
 * Interface pour une commande Firebase
 */
export interface Order {
  id: string;
  items: CartItem[];
  shippingInfo: ShippingInfo;
  subtotal: number;
  shippingCost: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'card';
  orderNumber: string;
  createdAt: Date;
  estimatedDelivery?: Date;
  // Champs Firebase supplémentaires
  customerEmail?: string;
  customerPhone: string;
  customerName: string;
  trackingNumber?: string;
  notes?: string;
}

/**
 * Interface pour le state du store
 */
interface CartState {
  // État du panier
  items: CartItem[];
  isOpen: boolean;
  
  // État de la commande
  shippingInfo: ShippingInfo | null;
  currentOrder: Order | null;
  orders: Order[];
  
  // États de chargement
  isCreatingOrder: boolean;
  orderError: string | null;
  
  // État pour éviter le vidage prématuré
  isProcessingCheckout: boolean;
  
  // Actions du panier
  addItem: (item: Omit<CartItem, 'quantity'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  
  // 🆕 NOUVELLE ACTION: Remplacer le panier avec un seul produit (pour achat isolé)
  replaceCartWithSingleItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
  
  // Actions de commande avec Firebase
  setShippingInfo: (info: ShippingInfo) => void;
  createOrder: (paymentMethod: 'cod' | 'card') => Promise<string>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  loadUserOrders: (customerPhone: string) => Promise<void>;
  
  // Actions pour gérer le processus de checkout
  startCheckoutProcess: () => void;
  finishCheckoutProcess: () => void;
  
  // Getters calculés
  getCartTotal: () => number;
  getCartSubtotal: () => number;
  getCartItemsCount: () => number;
  getShippingCost: () => number;
}

/**
 * Configuration des coûts de livraison
 */
const SHIPPING_CONFIG = {
  standardShippingCost: 30,   // Coût standard: 30 DH
  regions: {
    'Casablanca': 25,
    'Rabat': 25,
    'Salé': 25,
    'Fès': 35,
    'Marrakech': 35,
    'Agadir': 45,
    'Tanger': 40,
    'Meknès': 35,
    'Oujda': 50,
    'Kenitra': 30,
    'Tétouan': 40,
    'Safi': 40,
    'Mohammedia': 25,
    'El Jadida': 35,
    'Beni Mellal': 40,
    'Nador': 50,
    'Taza': 45,
    'Settat': 30,
    'Berrechid': 30,
    'Khemisset': 30,
    'Khouribga': 35,
    'Ouarzazate': 55,
    'Errachidia': 60,
    'Larache': 40,
    'Ksar El Kebir': 40,
    'Al Hoceima': 50,
    'Guelmim': 60,
    'Tiznit': 55,
    'Essaouira': 45,
    'Dakhla': 80,
    'Laâyoune': 70,
    'Autre ville': 50
  }
};

/**
 * Store Zustand pour la gestion du panier et des commandes avec Firebase
 * 🆕 VERSION COMPLÈTE avec support pour l'achat isolé
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      // État initial
      items: [],
      isOpen: false,
      shippingInfo: null,
      currentOrder: null,
      orders: [],
      isCreatingOrder: false,
      orderError: null,
      isProcessingCheckout: false,

      /**
       * Ajoute un item au panier (comportement normal)
       * Si l'item existe déjà, incrémente la quantité
       */
      addItem: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(i => i.productId === item.productId);
        
        if (existingItemIndex > -1) {
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += 1;
          set({ items: updatedItems });
          console.log('➕ Quantité augmentée pour:', item.name);
        } else {
          const newItem: CartItem = {
            ...item,
            quantity: 1
          };
          set({ items: [...items, newItem] });
          console.log('🆕 Nouvel item ajouté:', item.name);
        }
      },

      /**
       * Supprime un item du panier
       */
      removeItem: (productId) => {
        const { items } = get();
        const itemToRemove = items.find(item => item.productId === productId);
        set({ items: items.filter(item => item.productId !== productId) });
        console.log('🗑️ Item supprimé:', itemToRemove?.name);
      },

      /**
       * Met à jour la quantité d'un item
       */
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        
        const { items } = get();
        const updatedItems = items.map(item =>
          item.productId === productId
            ? { ...item, quantity }
            : item
        );
        set({ items: updatedItems });
        console.log('📊 Quantité mise à jour pour:', productId, 'nouvelle quantité:', quantity);
      },

      /**
       * 🔧 MODIFICATION: Vide le panier (version simplifiée)
       * Supprime la protection de checkout - vide toujours quand demandé
       */
      clearCart: () => {
        const itemCount = get().items.length;
        set({ items: [] });
        console.log(`🗑️ Panier vidé (${itemCount} items supprimés)`);
      },

      /**
       * 🆕 NOUVELLE ACTION: Remplace le panier avec un seul produit
       * Utilisé pour l'achat direct - ignore le contenu existant du panier
       */
      replaceCartWithSingleItem: (item, quantity) => {
        console.log('🔄 Remplacement du panier avec produit unique:', {
          name: item.name,
          quantity: quantity,
          price: item.price
        });
        
        const newItem: CartItem = {
          ...item,
          quantity: quantity
        };
        
        set({ items: [newItem] });
        console.log('✅ Panier remplacé avec succès - Contenu:', [newItem]);
      },

      /**
       * Bascule l'état d'ouverture du panier
       */
      toggleCart: () => {
        set(state => ({ isOpen: !state.isOpen }));
      },

      /**
       * Marque le début du processus de checkout
       */
      startCheckoutProcess: () => {
        console.log('🔄 Début du processus de checkout - Protection du panier activée');
        set({ isProcessingCheckout: true });
      },

      /**
       * Termine le processus de checkout et vide le panier
       */
      finishCheckoutProcess: () => {
        console.log('✅ Fin du processus de checkout - Vidage sécurisé du panier');
        set({ 
          isProcessingCheckout: false,
          items: [] // Maintenant on peut vider en sécurité
        });
      },

      /**
       * Sauvegarde les informations de livraison
       */
      setShippingInfo: (info) => {
        set({ shippingInfo: info });
        console.log('📍 Informations de livraison sauvegardées:', info.city);
      },

      /**
       * Crée une commande dans Firebase
       */
      createOrder: async (paymentMethod) => {
        const { items, shippingInfo } = get();
        
        console.log('🚀 Début createOrder avec:', {
          itemsCount: items.length,
          hasShippingInfo: !!shippingInfo,
          paymentMethod
        });
        
        if (!shippingInfo || items.length === 0) {
          throw new Error('Informations manquantes pour créer la commande');
        }

        set({ 
          isCreatingOrder: true, 
          orderError: null,
          isProcessingCheckout: true
        });

        try {
          // Générer un numéro de commande unique
          const orderNumber = `BD-${Date.now().toString().slice(-8)}`;
          const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          console.log('🔢 Numéro de commande généré:', orderNumber);
          
          // Calculer les totaux
          const subtotal = get().getCartSubtotal();
          const shippingCost = get().getShippingCost();
          const total = subtotal + shippingCost;
          
          console.log('💰 Calculs:', { subtotal, shippingCost, total });
          
          // Sauvegarder les items avant potentielle perte
          const itemsToSave = [...items];
          
          // Préparer les données pour Firebase
          const orderData = {
            orderNumber,
            items: itemsToSave.map(item => ({
              productId: item.productId,
              name: item.name,
              brand: item.brand,
              price: item.price,
              originalPrice: item.originalPrice || null,
              imageUrl: item.imageUrl,
              quantity: item.quantity,
              slug: item.slug,
              inStock: item.inStock
            })),
            shippingInfo: {
              firstName: shippingInfo.firstName,
              lastName: shippingInfo.lastName,
              email: shippingInfo.email || '',
              phone: shippingInfo.phone,
              address: shippingInfo.address,
              city: shippingInfo.city,
              postalCode: shippingInfo.postalCode || '',
              region: shippingInfo.region || shippingInfo.city,
              notes: shippingInfo.notes || ''
            },
            subtotal,
            shippingCost,
            total,
            status: 'pending' as const,
            paymentMethod,
            customerEmail: shippingInfo.email || '',
            customerPhone: shippingInfo.phone,
            customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            createdAt: Timestamp.now(),
            estimatedDelivery: Timestamp.fromDate(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)),
            notes: `Commande créée via site web - Paiement: ${paymentMethod === 'cod' ? 'À la livraison' : 'Carte bancaire'}`
          };

          console.log('📤 Sauvegarde dans Firebase...');
          
          // Sauvegarder dans Firebase
          const docRef = await addDoc(collection(db, 'orders'), orderData);
          const firebaseOrderId = docRef.id;
          
          console.log('✅ Commande sauvegardée avec ID Firebase:', firebaseOrderId);
          
          // Créer l'objet Order local
          const newOrder: Order = {
            id: firebaseOrderId,
            items: itemsToSave,
            shippingInfo: { ...shippingInfo },
            subtotal,
            shippingCost,
            total,
            status: 'pending',
            paymentMethod,
            orderNumber,
            createdAt: new Date(),
            estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            customerPhone: shippingInfo.phone,
            customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`
          };

          // Mettre à jour le state
          set(state => ({
            currentOrder: newOrder,
            orders: [newOrder, ...state.orders],
            isCreatingOrder: false
          }));

          console.log('✅ Store mis à jour, commande créée avec succès');
          return firebaseOrderId;

        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde Firebase:', error);
          set({ 
            isCreatingOrder: false, 
            orderError: 'Erreur lors de la création de la commande',
            isProcessingCheckout: false
          });
          throw error;
        }
      },

      /**
       * Met à jour le statut d'une commande dans Firebase
       */
      updateOrderStatus: async (orderId, status) => {
        try {
          await updateDoc(doc(db, 'orders', orderId), {
            status,
            updatedAt: Timestamp.now()
          });

          set(state => ({
            orders: state.orders.map(order =>
              order.id === orderId ? { ...order, status } : order
            ),
            currentOrder: state.currentOrder?.id === orderId 
              ? { ...state.currentOrder, status }
              : state.currentOrder
          }));

          console.log('✅ Statut de commande mis à jour:', orderId, status);

        } catch (error) {
          console.error('❌ Erreur mise à jour statut:', error);
          throw error;
        }
      },

      /**
       * Charge les commandes d'un client depuis Firebase
       */
      loadUserOrders: async (customerPhone) => {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(
            ordersRef,
            where('customerPhone', '==', customerPhone),
            orderBy('createdAt', 'desc')
          );
          
          const querySnapshot = await getDocs(q);
          const userOrders: Order[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            userOrders.push({
              id: doc.id,
              items: data.items || [],
              shippingInfo: data.shippingInfo || {},
              subtotal: data.subtotal || 0,
              shippingCost: data.shippingCost || 0,
              total: data.total || 0,
              status: data.status || 'pending',
              paymentMethod: data.paymentMethod || 'cod',
              orderNumber: data.orderNumber || '',
              createdAt: data.createdAt?.toDate() || new Date(),
              estimatedDelivery: data.estimatedDelivery?.toDate(),
              customerPhone: data.customerPhone || '',
              customerName: data.customerName || ''
            });
          });

          set({ orders: userOrders });
          console.log('✅ Commandes utilisateur chargées:', userOrders.length);

        } catch (error) {
          console.error('❌ Erreur chargement commandes:', error);
          throw error;
        }
      },

      // Getters calculés
      getCartSubtotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartTotal: () => {
        return get().getCartSubtotal() + get().getShippingCost();
      },

      getCartItemsCount: () => {
        const { items } = get();
        return items.reduce((count, item) => count + item.quantity, 0);
      },

      getShippingCost: () => {
        const { shippingInfo, items } = get();
        const subtotal = get().getCartSubtotal();
        
        // Si le panier est vide, pas de frais de livraison
        if (items.length === 0 || subtotal === 0) {
          return 0;
        }
        
        // 🔧 CORRECTION: Retourner 0 si aucune ville n'est sélectionnée
        // L'utilisateur doit d'abord choisir sa ville dans le checkout
        if (!shippingInfo?.city && !shippingInfo?.region) {
          return 0; // Pas de frais de livraison tant que la ville n'est pas renseignée
        }
        
        // Rechercher le coût de livraison par ville/région
        if (shippingInfo?.city && SHIPPING_CONFIG.regions[shippingInfo.city as keyof typeof SHIPPING_CONFIG.regions]) {
          return SHIPPING_CONFIG.regions[shippingInfo.city as keyof typeof SHIPPING_CONFIG.regions];
        }
        
        if (shippingInfo?.region && SHIPPING_CONFIG.regions[shippingInfo.region as keyof typeof SHIPPING_CONFIG.regions]) {
          return SHIPPING_CONFIG.regions[shippingInfo.region as keyof typeof SHIPPING_CONFIG.regions];
        }
        
        // Si la ville existe mais n'est pas dans notre liste, utiliser le coût standard
        return SHIPPING_CONFIG.standardShippingCost;
      }
    }),
    {
      name: 'beauty-discount-cart',
      partialize: (state) => ({
        // Ne persister que les données non-sensibles
        items: state.items,
        shippingInfo: state.shippingInfo,
        isProcessingCheckout: state.isProcessingCheckout,
      })
    }
  )
);

/**
 * Hook pour utiliser seulement les actions du panier (évite les re-renders)
 */
export const useCartActions = () => {
  const addItem = useCartStore(state => state.addItem);
  const removeItem = useCartStore(state => state.removeItem);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  const toggleCart = useCartStore(state => state.toggleCart);
  const startCheckoutProcess = useCartStore(state => state.startCheckoutProcess);
  const finishCheckoutProcess = useCartStore(state => state.finishCheckoutProcess);
  
  // 🆕 NOUVEAU: Action pour remplacer le panier avec un seul produit
  const replaceCartWithSingleItem = useCartStore(state => state.replaceCartWithSingleItem);
  
  return {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    toggleCart,
    startCheckoutProcess,
    finishCheckoutProcess,
    replaceCartWithSingleItem // 🆕 Action pour achat isolé
  };
};

/**
 * Hook pour les données du panier (lecture seule)
 */
export const useCartData = () => {
  const items = useCartStore(state => state.items);
  const isOpen = useCartStore(state => state.isOpen);
  const getCartTotal = useCartStore(state => state.getCartTotal);
  const getCartSubtotal = useCartStore(state => state.getCartSubtotal);
  const getCartItemsCount = useCartStore(state => state.getCartItemsCount);
  const getShippingCost = useCartStore(state => state.getShippingCost);
  const isProcessingCheckout = useCartStore(state => state.isProcessingCheckout);
  
  return {
    items,
    isOpen,
    total: getCartTotal(),
    subtotal: getCartSubtotal(),
    itemsCount: getCartItemsCount(),
    shippingCost: getShippingCost(),
    isProcessingCheckout
  };
};

/**
 * Hook pour les commandes et états de chargement
 */
export const useOrderData = () => {
  const orders = useCartStore(state => state.orders);
  const currentOrder = useCartStore(state => state.currentOrder);
  const isCreatingOrder = useCartStore(state => state.isCreatingOrder);
  const orderError = useCartStore(state => state.orderError);
  const createOrder = useCartStore(state => state.createOrder);
  const updateOrderStatus = useCartStore(state => state.updateOrderStatus);
  const loadUserOrders = useCartStore(state => state.loadUserOrders);
  const setShippingInfo = useCartStore(state => state.setShippingInfo);
  
  return {
    orders,
    currentOrder,
    isCreatingOrder,
    orderError,
    createOrder,
    updateOrderStatus,
    loadUserOrders,
    setShippingInfo
  };
};