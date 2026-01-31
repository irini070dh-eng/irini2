
import React, { useState, useEffect, createContext, useContext } from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';
import { 
  Language, 
  CartItem, 
  Order, 
  OrderStatus, 
  PaymentStatus, 
  PaymentMethod, 
  DeliveryType, 
  CustomerInfo,
  MenuItem,
  RestaurantSettings,
  DELIVERY_CONFIG,
  DEFAULT_RESTAURANT_SETTINGS,
  StaffNote,
  Driver,
  DriverStatus,
  Reservation,
  ReservationStatus
} from './types';
import { MENU_ITEMS } from './constants';
import { 
  sendOrderConfirmationEmail, 
  sendReservationConfirmationEmail,
  sendReservationRejectionEmail 
} from './services/emailService';
import { menuService, ordersService, reservationService, driversService, settingsService, siteContentService, SiteContent, DbOrder, OrderItem as DbOrderItem, Reservation as DbReservation, MenuItem as DbMenuItem, DbDriver } from './services/supabaseClient';

// Contexts
interface LanguageContextType {
  language: Language;
  setLanguage: (l: Language) => void;
  isRTL: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface CartContextType {
  cart: CartItem[];
  addToCart: (id: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  itemCount: number;
}

export const CartContext = createContext<CartContextType | undefined>(undefined);

interface OrdersContextType {
  orders: Order[];
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  updatePaymentStatus: (orderId: string, status: PaymentStatus) => void;
  getOrder: (orderId: string) => Order | undefined;
  getPaidOrders: () => Order[];
  getActiveOrders: () => Order[];
  addStaffNote: (orderId: string, text: string, author: string) => void;
  assignDriver: (orderId: string, driverId: string | null) => void;
  startDelivery: (orderId: string, estimatedMinutes: number) => Promise<void>;
}

export const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

interface DriversContextType {
  drivers: Driver[];
  addDriver: (name: string, phone: string) => Promise<void>;
  updateDriver: (driverId: string, updates: { name?: string; phone?: string }) => Promise<void>;
  updateDriverStatus: (driverId: string, status: DriverStatus) => Promise<void>;
  removeDriver: (driverId: string) => Promise<void>;
  getAvailableDrivers: () => Driver[];
}

export const DriversContext = createContext<DriversContextType | undefined>(undefined);

interface CreateOrderParams {
  customer: CustomerInfo;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
}

interface CheckoutContextType {
  createOrder: (params: CreateOrderParams) => Promise<string>;
  currentOrderId: string | null;
  setCurrentOrderId: (id: string | null) => void;
}

export const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

// Menu Management Context
interface MenuContextType {
  menuItems: MenuItem[];
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void | Promise<void>;
  addMenuItem: (item: MenuItem) => void | Promise<void>;
  deleteMenuItem: (id: string) => void | Promise<void>;
  toggleAvailability: (id: string) => void | Promise<void>;
  getAvailableItems: () => MenuItem[];
}

export const MenuContext = createContext<MenuContextType | undefined>(undefined);

// Settings Context
interface SettingsContextType {
  settings: RestaurantSettings;
  updateSettings: (updates: Partial<RestaurantSettings>) => Promise<void>;
  resetSettings: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Reservations Context
interface CreateReservationParams {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  numberOfGuests: number;
  specialRequests?: string;
}

interface ReservationsContextType {
  reservations: Reservation[];
  createReservation: (params: CreateReservationParams) => Promise<string>;
  updateReservationStatus: (id: string, status: ReservationStatus) => void;
  sendConfirmation: (id: string, adminNotes?: string) => Promise<void>;
  sendRejection: (id: string, alternativeTime?: string) => Promise<void>;
  addAdminNote: (id: string, note: string) => void;
  getReservation: (id: string) => Reservation | undefined;
  getPendingReservations: () => Reservation[];
  getConfirmedReservations: () => Reservation[];
  getReservationsForDate: (date: string) => Reservation[];
}

export const ReservationsContext = createContext<ReservationsContextType | undefined>(undefined);

// Site Content Context - for dynamic content from Supabase
export interface SiteContentContextType {
  content: Record<string, Record<string, SiteContent>>;
  getContent: (section: string, key: string) => SiteContent | undefined;
  getImageUrl: (section: string, key: string, fallback?: string) => string;
  getText: (section: string, key: string, language: Language, fallback?: string) => string;
  isLoading: boolean;
  refreshContent: () => Promise<void>;
}

export const SiteContentContext = createContext<SiteContentContextType | undefined>(undefined);

const Root = () => {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    return (saved as Language) || 'nl';
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    if (!saved) return [];
    return JSON.parse(saved).map((o: any) => ({
      ...o, 
      createdAt: new Date(o.createdAt),
      updatedAt: o.updatedAt ? new Date(o.updatedAt) : new Date(o.createdAt),
      payment: o.payment || { method: 'cash', status: 'unpaid', amount: o.total },
      delivery: o.delivery || { type: 'delivery', fee: 0 },
      subtotal: o.subtotal || o.total,
      deliveryFee: o.deliveryFee || 0
    }));
  });

  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Menu Management State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menuItems');
    if (saved) {
      return JSON.parse(saved);
    }
    // Initialize with default menu items, adding isAvailable: true
    return MENU_ITEMS.map(item => ({ ...item, isAvailable: true }));
  });

  // Settings State
  const [settings, setSettings] = useState<RestaurantSettings>(() => {
    const saved = localStorage.getItem('restaurantSettings');
    return saved ? JSON.parse(saved) : DEFAULT_RESTAURANT_SETTINGS;
  });

  // Drivers State
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('drivers');
    if (!saved) {
      // Initialize with 3 default drivers
      return [
        { id: 'DRV-001', name: 'Nikos Papadopoulos', phone: '+31612345678', status: 'available', activeDeliveries: 0 },
        { id: 'DRV-002', name: 'Dimitris Kostas', phone: '+31687654321', status: 'available', activeDeliveries: 0 },
        { id: 'DRV-003', name: 'Yannis Stavros', phone: '+31698765432', status: 'offline', activeDeliveries: 0 }
      ];
    }
    return JSON.parse(saved);
  });

  // Reservations State
  const [reservations, setReservations] = useState<Reservation[]>(() => {
    const saved = localStorage.getItem('reservations');
    if (!saved) return [];
    return JSON.parse(saved).map((r: any) => ({
      ...r,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      confirmationSentAt: r.confirmationSentAt ? new Date(r.confirmationSentAt) : undefined
    }));
  });

  // Site Content State
  const [siteContent, setSiteContent] = useState<Record<string, Record<string, SiteContent>>>({});
  const [siteContentLoading, setSiteContentLoading] = useState(true);

  // Load site content from Supabase
  useEffect(() => {
    const loadSiteContent = async () => {
      try {
        const allContent = await siteContentService.getAll();
        // Organize by section -> key
        const organized: Record<string, Record<string, SiteContent>> = {};
        allContent.forEach(item => {
          if (!organized[item.section]) {
            organized[item.section] = {};
          }
          organized[item.section][item.key] = item;
        });
        setSiteContent(organized);
        console.log('🖼️ Loaded', allContent.length, 'site content items from Supabase');
      } catch (error) {
        console.error('❌ Failed to load site content:', error);
      } finally {
        setSiteContentLoading(false);
      }
    };
    
    loadSiteContent();
  }, []);

  // Site Content Helper Functions
  const getContent = (section: string, key: string): SiteContent | undefined => {
    return siteContent[section]?.[key];
  };

  const getImageUrl = (section: string, key: string, fallback: string = ''): string => {
    return siteContent[section]?.[key]?.value_image_url || fallback;
  };

  const getText = (section: string, key: string, lang: Language, fallback: string = ''): string => {
    const item = siteContent[section]?.[key];
    if (!item) return fallback;
    
    // Try language-specific text first
    const langKey = `value_text_${lang}` as keyof SiteContent;
    const langText = item[langKey] as string | undefined;
    if (langText) return langText;
    
    // Fallback to default value_text
    return item.value_text || fallback;
  };

  const refreshSiteContent = async () => {
    setSiteContentLoading(true);
    try {
      const allContent = await siteContentService.getAll();
      const organized: Record<string, Record<string, SiteContent>> = {};
      allContent.forEach(item => {
        if (!organized[item.section]) {
          organized[item.section] = {};
        }
        organized[item.section][item.key] = item;
      });
      setSiteContent(organized);
    } catch (error) {
      console.error('❌ Failed to refresh site content:', error);
    } finally {
      setSiteContentLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('lang', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('menuItems', JSON.stringify(menuItems));
  }, [menuItems]);

  // Load menu items from Supabase on mount
  useEffect(() => {
    const loadMenuFromSupabase = async () => {
      try {
        const dbMenuItems = await menuService.getAll();
        if (dbMenuItems.length > 0) {
          const frontendMenuItems = dbMenuItems.map(dbMenuItemToFrontend);
          setMenuItems(frontendMenuItems);
          console.log('🍽️ Loaded', dbMenuItems.length, 'menu items from Supabase');
        } else {
          console.log('📝 No menu items in Supabase, using local/default items');
        }
      } catch (error) {
        console.error('❌ Failed to load menu from Supabase:', error);
        // Keep using localStorage/default menu items as fallback
      }
    };
    
    loadMenuFromSupabase();
  }, []);

  useEffect(() => {
    localStorage.setItem('restaurantSettings', JSON.stringify(settings));
  }, [settings]);

  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettingsFromSupabase = async () => {
      try {
        const dbSettings = await settingsService.getAll();
        
        if (Object.keys(dbSettings).length > 0) {
          // Merge database settings with defaults
          const general = dbSettings.general || {};
          const deliveryZones = dbSettings.delivery_zones || dbSettings.delivery_config || {};
          const openingHours = dbSettings.opening_hours || {};
          const notifications = dbSettings.notifications || {};
          const payments = dbSettings.payments || {};
          
          setSettings(prev => ({
            ...prev,
            name: (general as any).name || prev.name,
            address: (general as any).address || prev.address,
            postalCode: (general as any).postalCode || prev.postalCode,
            city: (general as any).city || prev.city,
            phone: (general as any).phone || prev.phone,
            email: (general as any).email || prev.email,
            openingHours: Object.keys(openingHours).length > 0 
              ? openingHours as typeof prev.openingHours 
              : prev.openingHours,
            deliveryZones: {
              ...prev.deliveryZones,
              fee: (deliveryZones as any).fee ?? (deliveryZones as any).deliveryFee ?? prev.deliveryZones.fee,
              minOrder: (deliveryZones as any).minOrder ?? (deliveryZones as any).minOrderAmount ?? prev.deliveryZones.minOrder,
              freeFrom: (deliveryZones as any).freeFrom ?? (deliveryZones as any).freeDeliveryFrom ?? prev.deliveryZones.freeFrom,
              postalCodes: (deliveryZones as any).postalCodes || prev.deliveryZones.postalCodes
            },
            notifications: {
              ...prev.notifications,
              soundEnabled: (notifications as any).soundEnabled ?? prev.notifications.soundEnabled,
              emailEnabled: (notifications as any).emailEnabled ?? prev.notifications.emailEnabled,
              emailAddress: (notifications as any).emailAddress || prev.notifications.emailAddress
            },
            payments: {
              ...prev.payments,
              ideal: (payments as any).ideal ?? prev.payments.ideal,
              card: (payments as any).card ?? prev.payments.card,
              cash: (payments as any).cash ?? prev.payments.cash,
              bancontact: (payments as any).bancontact ?? prev.payments.bancontact
            }
          }));
          
          console.log('⚙️ Loaded settings from Supabase');
        } else {
          console.log('📝 No settings in Supabase, using local/default settings');
        }
      } catch (error) {
        console.error('❌ Failed to load settings from Supabase:', error);
      }
    };
    
    loadSettingsFromSupabase();
    
    // Subscribe to real-time settings updates
    const channel = settingsService.subscribeToSettings((key, value) => {
      console.log('🔄 Settings updated:', key);
      
      // Apply the specific setting update
      setSettings(prev => {
        if (key === 'general') {
          return {
            ...prev,
            name: (value as any).name || prev.name,
            address: (value as any).address || prev.address,
            postalCode: (value as any).postalCode || prev.postalCode,
            city: (value as any).city || prev.city,
            phone: (value as any).phone || prev.phone,
            email: (value as any).email || prev.email
          };
        }
        if (key === 'delivery_zones' || key === 'delivery_config') {
          return {
            ...prev,
            deliveryZones: {
              ...prev.deliveryZones,
              fee: (value as any).fee ?? (value as any).deliveryFee ?? prev.deliveryZones.fee,
              minOrder: (value as any).minOrder ?? (value as any).minOrderAmount ?? prev.deliveryZones.minOrder,
              freeFrom: (value as any).freeFrom ?? (value as any).freeDeliveryFrom ?? prev.deliveryZones.freeFrom
            }
          };
        }
        if (key === 'opening_hours') {
          return { ...prev, openingHours: value as typeof prev.openingHours };
        }
        if (key === 'notifications') {
          return {
            ...prev,
            notifications: {
              ...prev.notifications,
              soundEnabled: (value as any).soundEnabled ?? prev.notifications.soundEnabled,
              emailEnabled: (value as any).emailEnabled ?? prev.notifications.emailEnabled,
              emailAddress: (value as any).emailAddress || prev.notifications.emailAddress
            }
          };
        }
        if (key === 'payments') {
          return {
            ...prev,
            payments: {
              ...prev.payments,
              ...(value as typeof prev.payments)
            }
          };
        }
        return prev;
      });
    });
    
    return () => {
      settingsService.unsubscribe(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('drivers', JSON.stringify(drivers));
  }, [drivers]);

  // Load drivers from Supabase on mount
  useEffect(() => {
    const loadDriversFromSupabase = async () => {
      try {
        const dbDrivers = await driversService.getAll();
        if (dbDrivers.length > 0) {
          const frontendDrivers = dbDrivers.map(dbDriverToFrontend);
          setDrivers(frontendDrivers);
          console.log('🚗 Loaded', dbDrivers.length, 'drivers from Supabase');
        } else {
          console.log('📝 No drivers in Supabase, using local/default drivers');
        }
      } catch (error) {
        console.error('❌ Failed to load drivers from Supabase:', error);
      }
    };
    
    loadDriversFromSupabase();
    
    // Subscribe to real-time driver updates
    const channel = driversService.subscribeToDrivers((updatedDriver) => {
      const frontendDriver = dbDriverToFrontend(updatedDriver);
      setDrivers(prev => {
        const exists = prev.find(d => d.id === updatedDriver.id);
        if (exists) {
          return prev.map(d => d.id === updatedDriver.id ? frontendDriver : d);
        }
        return [...prev, frontendDriver];
      });
    });
    
    return () => {
      driversService.unsubscribe(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Load orders from Supabase on mount
  useEffect(() => {
    const loadOrdersFromSupabase = async () => {
      try {
        const dbOrders = await ordersService.getAll();
        if (dbOrders.length > 0) {
          const frontendOrders = dbOrders.map(dbOrderToFrontend);
          setOrders(frontendOrders);
          console.log('📦 Loaded', dbOrders.length, 'orders from Supabase');
        }
      } catch (error) {
        console.error('❌ Failed to load orders from Supabase:', error);
        // Keep using localStorage orders as fallback
      }
    };
    
    loadOrdersFromSupabase();
    
    // Subscribe to real-time order updates
    const channel = ordersService.subscribeToOrders((updatedOrder) => {
      const frontendOrder = dbOrderToFrontend(updatedOrder);
      setOrders(prev => {
        const exists = prev.find(o => o.id === updatedOrder.id);
        if (exists) {
          return prev.map(o => o.id === updatedOrder.id ? frontendOrder : o);
        }
        return [frontendOrder, ...prev];
      });
    });
    
    return () => {
      ordersService.unsubscribe(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('reservations', JSON.stringify(reservations));
  }, [reservations]);

  // Load reservations from Supabase on mount
  useEffect(() => {
    const loadReservationsFromSupabase = async () => {
      try {
        const dbReservations = await reservationService.getAll();
        if (dbReservations.length > 0) {
          const frontendReservations = dbReservations.map(dbReservationToFrontend);
          setReservations(frontendReservations);
          console.log('📅 Loaded', dbReservations.length, 'reservations from Supabase');
        }
      } catch (error) {
        console.error('❌ Failed to load reservations from Supabase:', error);
      }
    };
    
    loadReservationsFromSupabase();
    
    // Subscribe to real-time reservation updates
    const channel = reservationService.subscribeToReservations((updatedReservation) => {
      const frontendReservation = dbReservationToFrontend(updatedReservation);
      setReservations(prev => {
        const exists = prev.find(r => r.id === updatedReservation.id);
        if (exists) {
          return prev.map(r => r.id === updatedReservation.id ? frontendReservation : r);
        }
        return [frontendReservation, ...prev];
      });
    });
    
    return () => {
      reservationService.unsubscribe(channel);
    };
  }, []);

  const addToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => setCart([]);

  // Helper: Convert DB menu item to frontend MenuItem format
  const dbMenuItemToFrontend = (dbItem: DbMenuItem): MenuItem => {
    return {
      id: dbItem.id,
      category: dbItem.category as keyof typeof MENU_ITEMS[0]['category'],
      price: dbItem.price,
      image: dbItem.image_url || '',
      names: {
        nl: dbItem.name_nl || '',
        el: dbItem.name_el || '',
        tr: dbItem.name_tr || '',
        ar: dbItem.name_ar || '',
        bg: dbItem.name_bg || '',
        pl: dbItem.name_pl || ''
      },
      descriptions: {
        nl: dbItem.description_nl || '',
        el: dbItem.description_el || '',
        tr: dbItem.description_tr || '',
        ar: dbItem.description_ar || '',
        bg: dbItem.description_bg || '',
        pl: dbItem.description_pl || ''
      },
      isAvailable: dbItem.is_available ?? true,
      isPopular: dbItem.is_popular,
      isNew: dbItem.is_new,
      isVegetarian: dbItem.is_vegetarian,
      isVegan: dbItem.is_vegan,
      isGlutenFree: dbItem.is_gluten_free,
      spicyLevel: (dbItem.spicy_level ?? 0) as 0 | 1 | 2 | 3,
      allergens: dbItem.allergens,
      preparationTime: dbItem.preparation_time,
      calories: dbItem.calories
    };
  };

  // Helper: Convert frontend MenuItem to DB format
  const frontendMenuItemToDb = (item: MenuItem): Omit<DbMenuItem, 'id' | 'created_at' | 'updated_at'> => {
    return {
      name_nl: item.names.nl,
      name_el: item.names.el,
      name_tr: item.names.tr,
      name_ar: item.names.ar,
      name_bg: item.names.bg,
      name_pl: item.names.pl,
      description_nl: item.descriptions.nl,
      description_el: item.descriptions.el,
      description_tr: item.descriptions.tr,
      description_ar: item.descriptions.ar,
      description_bg: item.descriptions.bg,
      description_pl: item.descriptions.pl,
      price: item.price,
      category: item.category,
      image_url: item.image,
      is_available: item.isAvailable ?? true,
      is_popular: item.isPopular,
      is_new: item.isNew,
      is_vegetarian: item.isVegetarian,
      is_vegan: item.isVegan,
      is_gluten_free: item.isGlutenFree,
      spicy_level: item.spicyLevel,
      allergens: item.allergens,
      preparation_time: item.preparationTime,
      calories: item.calories
    };
  };

  // Helper: Convert DB driver to frontend Driver format
  const dbDriverToFrontend = (dbDriver: DbDriver): Driver => {
    return {
      id: dbDriver.id,
      name: dbDriver.name,
      phone: dbDriver.phone,
      status: dbDriver.status as DriverStatus,
      activeDeliveries: dbDriver.active_deliveries
    };
  };

  // Helper: Convert DB reservation to frontend Reservation format
  const dbReservationToFrontend = (dbRes: DbReservation): Reservation => {
    return {
      id: dbRes.id,
      customerName: dbRes.customer_name,
      customerEmail: dbRes.customer_email,
      customerPhone: dbRes.customer_phone,
      date: dbRes.date,
      time: dbRes.time,
      numberOfGuests: dbRes.number_of_guests,
      specialRequests: dbRes.special_requests,
      status: dbRes.status as ReservationStatus,
      adminNotes: dbRes.admin_notes,
      confirmationSentAt: dbRes.confirmation_sent_at ? new Date(dbRes.confirmation_sent_at) : undefined,
      createdAt: new Date(dbRes.created_at),
      updatedAt: new Date(dbRes.updated_at)
    };
  };

  // Helper: Convert DB order to frontend Order format
  const dbOrderToFrontend = (dbOrder: DbOrder): Order => {
    return {
      id: dbOrder.id,
      items: (dbOrder.order_items || []).map(item => ({
        id: item.menu_item_id || item.id || '',
        quantity: item.quantity,
        price: item.item_price,
        name: item.item_name
      })),
      subtotal: dbOrder.subtotal,
      deliveryFee: dbOrder.delivery_fee,
      total: dbOrder.total,
      status: dbOrder.status,
      payment: {
        method: dbOrder.payment_method,
        status: dbOrder.payment_status,
        amount: dbOrder.payment_amount || dbOrder.total,
        paidAt: dbOrder.paid_at ? new Date(dbOrder.paid_at) : undefined,
        transactionId: dbOrder.payment_transaction_id
      },
      delivery: {
        type: dbOrder.delivery_type,
        fee: dbOrder.delivery_fee,
        estimatedTime: dbOrder.delivery_type === 'delivery' 
          ? `${DELIVERY_CONFIG.estimatedDeliveryMinutes} min`
          : `${DELIVERY_CONFIG.estimatedPickupMinutes} min`
      },
      createdAt: new Date(dbOrder.created_at),
      updatedAt: new Date(dbOrder.updated_at),
      customer: {
        name: dbOrder.customer_name,
        email: dbOrder.customer_email,
        phone: dbOrder.customer_phone,
        address: dbOrder.customer_address,
        postalCode: dbOrder.customer_postal_code,
        city: dbOrder.customer_city,
        notes: dbOrder.customer_notes
      },
      estimatedReadyTime: dbOrder.estimated_ready_time ? new Date(dbOrder.estimated_ready_time) : undefined,
      assignedDriver: dbOrder.assigned_driver_id,
      deliveryDepartedAt: dbOrder.delivery_departed_at ? new Date(dbOrder.delivery_departed_at) : undefined,
      estimatedDeliveryTime: dbOrder.estimated_delivery_time ? new Date(dbOrder.estimated_delivery_time) : undefined,
      staffNotes: (dbOrder.staff_notes || []).map(note => ({
        id: note.id || '',
        text: note.text,
        author: note.author,
        timestamp: note.created_at ? new Date(note.created_at) : new Date()
      }))
    };
  };

  // Create order with full payment and delivery info - synced with Supabase
  const createOrder = async (params: CreateOrderParams): Promise<string> => {
    const now = new Date();
    
    // Prepare order data for Supabase
    const dbOrderData = {
      customer_name: params.customer.name,
      customer_email: params.customer.email,
      customer_phone: params.customer.phone,
      customer_address: params.customer.address,
      customer_postal_code: params.customer.postalCode,
      customer_city: params.customer.city,
      customer_notes: params.customer.notes,
      subtotal: params.subtotal,
      delivery_fee: params.deliveryFee,
      total: params.total,
      status: 'pending' as const,
      payment_method: params.paymentMethod,
      payment_status: params.isPaid ? 'paid' as const : 'unpaid' as const,
      payment_transaction_id: params.isPaid ? `TXN-${Date.now()}` : undefined,
      paid_at: params.isPaid ? now.toISOString() : undefined,
      payment_amount: params.total,
      delivery_type: params.deliveryType,
      estimated_ready_time: new Date(now.getTime() + 
        (params.deliveryType === 'delivery' 
          ? DELIVERY_CONFIG.estimatedDeliveryMinutes 
          : DELIVERY_CONFIG.estimatedPickupMinutes) * 60000
      ).toISOString()
    };

    // Prepare order items
    const dbOrderItems: Omit<DbOrderItem, 'id' | 'order_id'>[] = params.items.map(item => {
      const menuInfo = menuItems.find(m => m.id === item.id);
      return {
        menu_item_id: undefined, // We use local IDs, not UUIDs
        item_name: menuInfo?.names[language] || item.id,
        item_price: menuInfo?.price || 0,
        quantity: item.quantity,
        subtotal: (menuInfo?.price || 0) * item.quantity
      };
    });

    try {
      // Save to Supabase
      const savedOrder = await ordersService.create(dbOrderData, dbOrderItems);
      const frontendOrder = dbOrderToFrontend(savedOrder);
      
      // Update local state
      setOrders(prev => [frontendOrder, ...prev]);
      clearCart();
      setCurrentOrderId(savedOrder.id);
      
      // Send email confirmation
      if (params.isPaid || params.paymentMethod === 'cash') {
        try {
          const emailResult = await sendOrderConfirmationEmail(frontendOrder, language);
          console.log('📧 Email confirmation:', emailResult);
        } catch (error) {
          console.error('❌ Email sending failed:', error);
        }
      }
      
      return savedOrder.id;
    } catch (error) {
      console.error('❌ Failed to save order to Supabase:', error);
      
      // Fallback: create local order if Supabase fails
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const newOrder: Order = {
        id: orderId,
        items: params.items.map(item => {
          const menuInfo = menuItems.find(m => m.id === item.id);
          return {
            id: item.id,
            quantity: item.quantity,
            price: menuInfo?.price || 0,
            name: menuInfo?.names[language] || item.id
          };
        }),
        subtotal: params.subtotal,
        deliveryFee: params.deliveryFee,
        total: params.total,
        status: 'pending',
        payment: {
          method: params.paymentMethod,
          status: params.isPaid ? 'paid' : 'unpaid',
          amount: params.total,
          paidAt: params.isPaid ? now : undefined,
          transactionId: params.isPaid ? `TXN-${Date.now()}` : undefined
        },
        delivery: {
          type: params.deliveryType,
          fee: params.deliveryFee,
          estimatedTime: params.deliveryType === 'delivery' 
            ? `${DELIVERY_CONFIG.estimatedDeliveryMinutes} min`
            : `${DELIVERY_CONFIG.estimatedPickupMinutes} min`
        },
        createdAt: now,
        updatedAt: now,
        customer: params.customer,
        estimatedReadyTime: new Date(now.getTime() + 
          (params.deliveryType === 'delivery' 
            ? DELIVERY_CONFIG.estimatedDeliveryMinutes 
            : DELIVERY_CONFIG.estimatedPickupMinutes) * 60000
        )
      };

      setOrders(prev => [newOrder, ...prev]);
      clearCart();
      setCurrentOrderId(orderId);
      
      return orderId;
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    // Update local state immediately
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { ...o, status, updatedAt: new Date() } 
        : o
    ));
    
    // Sync with Supabase
    try {
      await ordersService.updateStatus(orderId, status);
    } catch (error) {
      console.error('❌ Failed to update order status in Supabase:', error);
    }
  };

  const updatePaymentStatus = async (orderId: string, status: PaymentStatus) => {
    // Update local state immediately
    setOrders(prev => prev.map(o => 
      o.id === orderId 
        ? { 
            ...o, 
            payment: { 
              ...o.payment, 
              status,
              paidAt: status === 'paid' ? new Date() : o.payment.paidAt
            },
            updatedAt: new Date() 
          } 
        : o
    ));
    
    // Sync with Supabase
    try {
      await ordersService.updatePaymentStatus(orderId, status);
    } catch (error) {
      console.error('❌ Failed to update payment status in Supabase:', error);
    }
  };

  const getOrder = (orderId: string) => orders.find(o => o.id === orderId);

  const getPaidOrders = () => orders.filter(o => 
    o.payment.status === 'paid' || o.payment.method === 'cash'
  );

  const getActiveOrders = () => orders.filter(o => 
    !['completed', 'cancelled'].includes(o.status) &&
    (o.payment.status === 'paid' || o.payment.method === 'cash')
  );

  const addStaffNote = async (orderId: string, text: string, author: string) => {
    const newNote: StaffNote = {
      id: `NOTE-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      text,
      author,
      timestamp: new Date()
    };
    
    // Update local state immediately
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          staffNotes: [...(o.staffNotes || []), newNote],
          updatedAt: new Date()
        };
      }
      return o;
    }));
    
    // Sync with Supabase
    try {
      await ordersService.addStaffNote(orderId, text, author);
    } catch (error) {
      console.error('❌ Failed to add staff note to Supabase:', error);
    }
  };

  const assignDriver = async (orderId: string, driverId: string | null) => {
    // Update local state immediately
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        // Update driver's active deliveries count
        if (o.assignedDriver && o.assignedDriver !== driverId) {
          // Remove from old driver
          setDrivers(d => d.map(driver => 
            driver.id === o.assignedDriver 
              ? { ...driver, activeDeliveries: Math.max(0, driver.activeDeliveries - 1) }
              : driver
          ));
        }
        if (driverId) {
          // Add to new driver
          setDrivers(d => d.map(driver => 
            driver.id === driverId 
              ? { ...driver, activeDeliveries: driver.activeDeliveries + 1, status: 'busy' as DriverStatus }
              : driver
          ));
        }
        return {
          ...o,
          assignedDriver: driverId || undefined,
          updatedAt: new Date()
        };
      }
      return o;
    }));
    
    // Sync with Supabase
    try {
      await ordersService.assignDriver(orderId, driverId);
    } catch (error) {
      console.error('❌ Failed to assign driver in Supabase:', error);
    }
  };

  // Start delivery with estimated arrival time
  const startDelivery = async (orderId: string, estimatedMinutes: number) => {
    const now = new Date();
    const estimatedDeliveryTime = new Date(now.getTime() + estimatedMinutes * 60000);
    
    // Update local state immediately
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'delivery' as OrderStatus,
          deliveryDepartedAt: now,
          estimatedDeliveryTime: estimatedDeliveryTime,
          updatedAt: now
        };
      }
      return o;
    }));
    
    // Sync with Supabase
    try {
      await ordersService.startDelivery(orderId, estimatedMinutes);
    } catch (error) {
      console.error('❌ Failed to start delivery in Supabase:', error);
    }
  };

  // Menu Management Functions - integrated with Supabase
  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    // Update local state immediately for responsiveness
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
    
    // Sync with Supabase (map frontend fields to database columns)
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.names) {
        Object.entries(updates.names).forEach(([lang, value]) => {
          dbUpdates[`name_${lang}`] = value;
        });
      }
      if (updates.descriptions) {
        Object.entries(updates.descriptions).forEach(([lang, value]) => {
          dbUpdates[`description_${lang}`] = value;
        });
      }
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.image !== undefined) dbUpdates.image_url = updates.image;
      if (updates.isAvailable !== undefined) dbUpdates.is_available = updates.isAvailable;
      if (updates.isPopular !== undefined) dbUpdates.is_popular = updates.isPopular;
      if (updates.isNew !== undefined) dbUpdates.is_new = updates.isNew;
      if (updates.isVegetarian !== undefined) dbUpdates.is_vegetarian = updates.isVegetarian;
      if (updates.isVegan !== undefined) dbUpdates.is_vegan = updates.isVegan;
      if (updates.isGlutenFree !== undefined) dbUpdates.is_gluten_free = updates.isGlutenFree;
      
      if (Object.keys(dbUpdates).length > 0) {
        await menuService.update(id, dbUpdates as any);
      }
    } catch (error) {
      console.error('Error updating menu item in Supabase:', error);
    }
  };

  const addMenuItem = async (item: MenuItem) => {
    // Add to local state immediately
    setMenuItems(prev => [...prev, { ...item, isAvailable: true }]);
    
    // Sync with Supabase
    try {
      const dbItem: Record<string, unknown> = {
        name_nl: item.names?.nl || item.names?.en || '',
        name_el: item.names?.el || '',
        name_tr: item.names?.tr || '',
        name_ar: item.names?.ar || '',
        name_bg: item.names?.bg || '',
        name_pl: item.names?.pl || '',
        description_nl: item.descriptions?.nl || item.descriptions?.en || '',
        description_el: item.descriptions?.el || '',
        description_tr: item.descriptions?.tr || '',
        description_ar: item.descriptions?.ar || '',
        description_bg: item.descriptions?.bg || '',
        description_pl: item.descriptions?.pl || '',
        price: item.price,
        category: item.category,
        image_url: item.image || null,
        is_available: true,
        is_popular: item.isPopular || false,
        is_new: item.isNew || false,
        is_vegetarian: item.isVegetarian || false,
        is_vegan: item.isVegan || false,
        is_gluten_free: item.isGlutenFree || false
      };
      await menuService.create(dbItem as any);
    } catch (error) {
      console.error('Error adding menu item to Supabase:', error);
    }
  };

  const deleteMenuItem = async (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
    
    try {
      await menuService.delete(id);
    } catch (error) {
      console.error('Error deleting menu item from Supabase:', error);
    }
  };

  const toggleAvailability = async (id: string) => {
    const item = menuItems.find(i => i.id === id);
    const newAvailability = !(item?.isAvailable !== false);
    
    setMenuItems(prev => prev.map(item => 
      item.id === id ? { ...item, isAvailable: newAvailability } : item
    ));
    
    try {
      await menuService.update(id, { is_available: newAvailability } as any);
    } catch (error) {
      console.error('Error toggling availability in Supabase:', error);
    }
  };

  const getAvailableItems = () => menuItems.filter(item => item.isAvailable !== false);

  // Settings Functions
  const updateSettings = async (updates: Partial<RestaurantSettings>) => {
    // Update local state first for responsiveness
    setSettings(prev => ({ ...prev, ...updates }));
    
    // Sync with Supabase
    try {
      // Check what was updated and sync appropriate settings
      if (updates.name || updates.address || updates.postalCode || updates.city || updates.phone || updates.email) {
        await settingsService.updateGeneral({
          name: updates.name,
          address: updates.address,
          postalCode: updates.postalCode,
          city: updates.city,
          phone: updates.phone,
          email: updates.email
        });
        console.log('✅ General settings saved to Supabase');
      }
      
      if (updates.deliveryZones) {
        await settingsService.updateDeliveryZones({
          fee: updates.deliveryZones.fee,
          minOrder: updates.deliveryZones.minOrder,
          freeFrom: updates.deliveryZones.freeFrom,
          postalCodes: updates.deliveryZones.postalCodes
        });
        console.log('✅ Delivery zones saved to Supabase');
      }
      
      if (updates.openingHours) {
        await settingsService.updateOpeningHours(updates.openingHours);
        console.log('✅ Opening hours saved to Supabase');
      }
      
      if (updates.notifications) {
        await settingsService.updateNotifications(updates.notifications);
        console.log('✅ Notification settings saved to Supabase');
      }
      
      if (updates.payments) {
        await settingsService.updatePayments(updates.payments);
        console.log('✅ Payment settings saved to Supabase');
      }
    } catch (error) {
      console.error('❌ Error saving settings to Supabase:', error);
    }
  };

  // Driver Management Functions
  const addDriver = async (name: string, phone: string) => {
    const tempId = `DRV-${Date.now().toString().slice(-6)}`;
    const newDriver: Driver = {
      id: tempId,
      name,
      phone,
      status: 'available',
      activeDeliveries: 0
    };
    
    // Add to local state first for responsiveness
    setDrivers(prev => [...prev, newDriver]);
    
    // Sync with Supabase
    try {
      const dbDriver = await driversService.create({ name, phone });
      // Update local state with real DB id
      setDrivers(prev => prev.map(d => 
        d.id === tempId ? { ...d, id: dbDriver.id } : d
      ));
      console.log('✅ Kierowca dodany do Supabase:', dbDriver.id);
    } catch (error) {
      console.error('❌ Błąd dodawania kierowcy do Supabase:', error);
    }
  };

  const updateDriver = async (driverId: string, updates: { name?: string; phone?: string }) => {
    // Update local state first
    setDrivers(prev => prev.map(d => 
      d.id === driverId ? { ...d, ...updates } : d
    ));
    
    // Sync with Supabase
    try {
      await driversService.update(driverId, updates);
      console.log('✅ Dane kierowcy zaktualizowane w Supabase:', driverId);
    } catch (error) {
      console.error('❌ Błąd aktualizacji kierowcy w Supabase:', error);
    }
  };

  const updateDriverStatus = async (driverId: string, status: DriverStatus) => {
    // Update local state first
    setDrivers(prev => prev.map(d => 
      d.id === driverId ? { ...d, status } : d
    ));
    
    // Sync with Supabase
    try {
      await driversService.updateStatus(driverId, status);
      console.log('✅ Status kierowcy zaktualizowany w Supabase:', driverId, status);
    } catch (error) {
      console.error('❌ Błąd aktualizacji statusu kierowcy w Supabase:', error);
    }
  };

  const removeDriver = async (driverId: string) => {
    // Remove from local state first
    setDrivers(prev => prev.filter(d => d.id !== driverId));
    
    // Sync with Supabase
    try {
      await driversService.delete(driverId);
      console.log('✅ Kierowca usunięty z Supabase:', driverId);
    } catch (error) {
      console.error('❌ Błąd usuwania kierowcy z Supabase:', error);
    }
  };

  const getAvailableDrivers = () => {
    return drivers.filter(d => d.status !== 'offline');
  };

  const resetSettings = () => {
    setSettings(DEFAULT_RESTAURANT_SETTINGS);
  };

  // Reservation Management Functions
  const createReservation = async (params: CreateReservationParams): Promise<string> => {
    const tempReservationId = `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const now = new Date();
    
    const newReservation: Reservation = {
      id: tempReservationId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      date: params.date,
      time: params.time,
      numberOfGuests: params.numberOfGuests,
      specialRequests: params.specialRequests,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    // Add to local state first for responsiveness
    setReservations(prev => [newReservation, ...prev]);
    
    // Sync with Supabase
    try {
      const dbReservation = await reservationService.create({
        customer_name: params.customerName,
        customer_email: params.customerEmail,
        customer_phone: params.customerPhone,
        date: params.date,
        time: params.time,
        number_of_guests: params.numberOfGuests,
        special_requests: params.specialRequests,
        status: 'pending'
      });
      
      // Update local state with real DB id
      setReservations(prev => prev.map(r => 
        r.id === tempReservationId ? { ...r, id: dbReservation.id } : r
      ));
      
      console.log('✅ Rezerwacja zapisana w Supabase:', dbReservation.id);
      return dbReservation.id;
    } catch (error) {
      console.error('❌ Błąd zapisu rezerwacji do Supabase:', error);
      // Keep local reservation with temp id
      return tempReservationId;
    }
  };

  const updateReservationStatus = async (id: string, status: ReservationStatus) => {
    // Update local state first
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, status, updatedAt: new Date() } : r
    ));
    
    // Sync with Supabase
    try {
      await reservationService.updateStatus(id, status);
      console.log('✅ Status rezerwacji zaktualizowany w Supabase:', id, status);
    } catch (error) {
      console.error('❌ Błąd aktualizacji statusu rezerwacji w Supabase:', error);
    }
  };

  const sendConfirmation = async (id: string, adminNotes?: string): Promise<void> => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    
    // Update reservation status to confirmed
    setReservations(prev => prev.map(r => 
      r.id === id 
        ? { 
            ...r, 
            status: 'confirmed' as ReservationStatus, 
            adminNotes: adminNotes || r.adminNotes,
            confirmationSentAt: new Date(),
            updatedAt: new Date() 
          } 
        : r
    ));
    
    // Sync confirmation with Supabase
    try {
      await reservationService.confirm(id, adminNotes);
      console.log('✅ Potwierdzenie rezerwacji zapisane w Supabase:', id);
    } catch (error) {
      console.error('❌ Błąd zapisu potwierdzenia do Supabase:', error);
    }
    
    // Send confirmation email
    try {
      const result = await sendReservationConfirmationEmail(
        {
          id: reservation.id,
          name: reservation.customerName,
          email: reservation.customerEmail,
          phone: reservation.phone,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.numberOfGuests,
          specialRequests: reservation.specialRequests,
          status: 'confirmed',
          createdAt: reservation.createdAt,
          updatedAt: new Date(),
          adminNotes: adminNotes
        },
        adminNotes,
        language
      );
      
      if (result.success) {
        console.log('✅ Email potwierdzenia wysłany:', result.message);
      } else {
        console.warn('⚠️ Nie udało się wysłać emaila:', result.message);
      }
    } catch (error) {
      console.error('❌ Błąd wysyłania emaila:', error);
    }
  };

  const sendRejection = async (id: string, alternativeTime?: string): Promise<void> => {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;
    
    // Update reservation status to rejected
    setReservations(prev => prev.map(r => 
      r.id === id 
        ? { 
            ...r, 
            status: 'rejected' as ReservationStatus,
            updatedAt: new Date() 
          } 
        : r
    ));
    
    // Sync rejection with Supabase
    try {
      await reservationService.reject(id, alternativeTime);
      console.log('✅ Odrzucenie rezerwacji zapisane w Supabase:', id);
    } catch (error) {
      console.error('❌ Błąd zapisu odrzucenia do Supabase:', error);
    }
    
    // Send rejection email with optional alternative time
    try {
      const result = await sendReservationRejectionEmail(
        {
          id: reservation.id,
          name: reservation.customerName,
          email: reservation.customerEmail,
          phone: reservation.phone,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.numberOfGuests,
          specialRequests: reservation.specialRequests,
          status: 'rejected',
          createdAt: reservation.createdAt,
          updatedAt: new Date()
        },
        alternativeTime,
        language
      );
      
      if (result.success) {
        console.log('✅ Email odrzucenia wysłany:', result.message);
      } else {
        console.warn('⚠️ Nie udało się wysłać emaila:', result.message);
      }
    } catch (error) {
      console.error('❌ Błąd wysyłania emaila:', error);
    }
  };

  const addAdminNote = async (id: string, note: string) => {
    // Update local state first
    setReservations(prev => prev.map(r => 
      r.id === id ? { ...r, adminNotes: note, updatedAt: new Date() } : r
    ));
    
    // Sync with Supabase
    try {
      await reservationService.updateAdminNotes(id, note);
      console.log('✅ Notatka rezerwacji zapisana w Supabase:', id);
    } catch (error) {
      console.error('❌ Błąd zapisu notatki do Supabase:', error);
    }
  };

  const getReservation = (id: string) => reservations.find(r => r.id === id);
  
  const getPendingReservations = () => reservations.filter(r => r.status === 'pending');
  
  const getConfirmedReservations = () => reservations.filter(r => r.status === 'confirmed');
  
  const getReservationsForDate = (date: string) => reservations.filter(r => r.date === date);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLang, isRTL: language === 'ar' }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, itemCount }}>
        <OrdersContext.Provider value={{ orders, updateOrderStatus, updatePaymentStatus, getOrder, getPaidOrders, getActiveOrders, addStaffNote, assignDriver, startDelivery }}>
          <DriversContext.Provider value={{ drivers, addDriver, updateDriver, updateDriverStatus, removeDriver, getAvailableDrivers }}>
            <CheckoutContext.Provider value={{ createOrder, currentOrderId, setCurrentOrderId }}>
              <MenuContext.Provider value={{ menuItems, updateMenuItem, addMenuItem, deleteMenuItem, toggleAvailability, getAvailableItems }}>
                <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
                  <ReservationsContext.Provider value={{ 
                    reservations, 
                    createReservation, 
                    updateReservationStatus, 
                    sendConfirmation,
                    sendRejection, 
                    addAdminNote, 
                    getReservation, 
                    getPendingReservations, 
                    getConfirmedReservations, 
                    getReservationsForDate 
                  }}>
                    <SiteContentContext.Provider value={{
                      content: siteContent,
                      getContent,
                      getImageUrl,
                      getText,
                      isLoading: siteContentLoading,
                      refreshContent: refreshSiteContent
                    }}>
                      <App />
                    </SiteContentContext.Provider>
                  </ReservationsContext.Provider>
                </SettingsContext.Provider>
              </MenuContext.Provider>
            </CheckoutContext.Provider>
          </DriversContext.Provider>
        </OrdersContext.Provider>
      </CartContext.Provider>
    </LanguageContext.Provider>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
