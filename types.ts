
export type Language = 'nl' | 'el' | 'tr' | 'ar' | 'bg' | 'pl';

export type View = 'home' | 'menu' | 'contact' | 'about' | 'admin' | 'checkout' | 'order-confirmation' | 'reservations';

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivery' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';

export type PaymentMethod = 'ideal' | 'card' | 'bancontact' | 'cash';

export type DeliveryType = 'delivery' | 'pickup';

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string; // Ulica i numer w Den Haag
  postalCode: string;
  city: string;
  notes?: string;
}

export interface PaymentInfo {
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  paidAt?: Date;
  amount: number;
}

export interface DeliveryInfo {
  type: DeliveryType;
  estimatedTime?: string;
  fee: number;
  distance?: number;
}

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  name: string;
}

export type DriverStatus = 'available' | 'busy' | 'offline';

export interface Driver {
  id: string;
  name: string;
  phone: string;
  status: DriverStatus;
  activeDeliveries: number;
}

export interface StaffNote {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  payment: PaymentInfo;
  delivery: DeliveryInfo;
  createdAt: Date;
  updatedAt: Date;
  customer: CustomerInfo;
  estimatedReadyTime?: Date;
  staffNotes?: StaffNote[];
  assignedDriver?: string; // Driver ID
  deliveryDepartedAt?: Date; // When delivery left the restaurant
  estimatedDeliveryTime?: Date; // Estimated arrival time at customer
}

export interface TranslationSet {
  heroTitle: string;
  heroSub: string;
  orderNow: string;
  ourMenu: string;
  aboutUs: string;
  contact: string;
  cart: string;
  total: string;
  addToCart: string;
  categories: {
    mains: string;
    starters_cold: string;
    starters_warm: string;
    salads: string;
    desserts: string;
  };
  emptyCart: string;
  checkout: string;
  authenticTitle: string;
  authenticDesc: string;
  bestsellers: string;
  familyBusiness: string;
  freshIngredients: string;
  reviews: string;
  contactTitle: string;
  contactSubtitle: string;
  formName: string;
  formEmail: string;
  formMessage: string;
  formSubmit: string;
  location: string;
  openingHours: string;
  writeReview: string;
  googleRating: string;
  // About Us Expanded
  aboutHeroTitle: string;
  aboutHeroSub: string;
  ourStoryTitle: string;
  ourStoryText: string;
  philosophyTitle: string;
  philosophyText: string;
  philosophySub: string;
  philosophyPillar1Title: string;
  philosophyPillar1Text: string;
  philosophyPillar2Title: string;
  philosophyPillar2Text: string;
  philosophyPillar3Title: string;
  philosophyPillar3Text: string;
  teamTitle: string;
  teamSub: string;
  founderLabel: string;
  chefLabel: string;
  serviceLabel: string;
  // Admin Labels
  adminDashboard: string;
  activeOrders: string;
  orderStatus: Record<OrderStatus, string>;
  paymentStatus: Record<PaymentStatus, string>;
  printReceipt: string;
  deliveryAddress: string;
  finishOrder: string;
  // Checkout Labels
  checkoutTitle: string;
  deliveryDetails: string;
  paymentMethod: string;
  orderSummary: string;
  subtotal: string;
  deliveryFee: string;
  totalToPay: string;
  payNow: string;
  processing: string;
  paymentSuccess: string;
  paymentFailed: string;
  tryAgain: string;
  backToMenu: string;
  orderConfirmed: string;
  orderNumber: string;
  estimatedTime: string;
  trackOrder: string;
  pickupAddress: string;
  deliveryOption: string;
  pickupOption: string;
  idealPayment: string;
  cardPayment: string;
  cashPayment: string;
  invalidPostalCode: string;
  denHaagOnly: string;
  requiredField: string;
  invalidEmail: string;
  invalidPhone: string;
  minOrderAmount: string;
  freeDeliveryFrom: string;
}

// Den Haag postal code ranges for validation
export const DEN_HAAG_POSTAL_CODES = [
  '2491', '2492', '2493', '2494', '2495', '2496', '2497',
  '2500', '2501', '2502', '2503', '2504', '2505', '2506', '2507', '2508', '2509',
  '2510', '2511', '2512', '2513', '2514', '2515', '2516', '2517', '2518', '2519',
  '2520', '2521', '2522', '2523', '2524', '2525', '2526', '2527', '2528', '2529',
  '2530', '2531', '2532', '2533', '2534', '2535', '2536', '2537', '2538', '2539',
  '2540', '2541', '2542', '2543', '2544', '2545', '2546', '2547', '2548', '2549',
  '2550', '2551', '2552', '2553', '2554', '2555', '2556', '2557', '2558', '2559',
  '2560', '2561', '2562', '2563', '2564', '2565', '2566', '2567', '2568', '2569',
  '2570', '2571', '2572', '2573', '2574', '2575', '2576', '2577', '2578', '2579',
  '2580', '2581', '2582', '2583', '2584', '2585', '2586', '2587', '2588', '2589',
  '2590', '2591', '2592', '2593', '2594', '2595', '2596', '2597'
];

export const DELIVERY_CONFIG = {
  minOrderAmount: 15.00,
  freeDeliveryFrom: 35.00,
  deliveryFee: 3.50,
  estimatedDeliveryMinutes: 45,
  estimatedPickupMinutes: 25,
  maxDeliveryDistance: 8 // km
};

export type MenuCategory = 'mains' | 'starters_cold' | 'starters_warm' | 'salads' | 'desserts' | 'drinks' | 'sides';

export interface MenuItem {
  id: string;
  category: keyof TranslationSet['categories'];
  price: number;
  image: string;
  names: Record<Language, string>;
  descriptions: Record<Language, string>;
  isAvailable?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  spicyLevel?: 0 | 1 | 2 | 3;
  allergens?: string[];
  preparationTime?: number; // w minutach
  calories?: number;
}

export interface RestaurantSettings {
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed?: boolean };
  };
  deliveryZones: {
    postalCodes: string[];
    fee: number;
    minOrder: number;
    freeFrom: number;
  };
  notifications: {
    soundEnabled: boolean;
    emailEnabled: boolean;
    emailAddress: string;
  };
  payments: {
    ideal: boolean;
    card: boolean;
    cash: boolean;
    bancontact: boolean;
  };
}

export const DEFAULT_RESTAURANT_SETTINGS: RestaurantSettings = {
  name: 'Greek Irini',
  address: 'Weimarstraat 174',
  postalCode: '2562 HD',
  city: 'Den Haag',
  phone: '+31 (0) 70 555 0123',
  email: 'info@greekirini.nl',
  openingHours: {
    monday: { open: '12:00', close: '22:00' },
    tuesday: { open: '12:00', close: '22:00' },
    wednesday: { open: '12:00', close: '22:00' },
    thursday: { open: '12:00', close: '22:00' },
    friday: { open: '12:00', close: '00:00' },
    saturday: { open: '12:00', close: '00:00' },
    sunday: { open: '14:00', close: '22:00' },
  },
  deliveryZones: {
    postalCodes: DEN_HAAG_POSTAL_CODES,
    fee: 3.50,
    minOrder: 15.00,
    freeFrom: 35.00,
  },
  notifications: {
    soundEnabled: true,
    emailEnabled: false,
    emailAddress: '',
  },
  payments: {
    ideal: true,
    card: true,
    cash: true,
    bancontact: false,
  },
};

export interface CartItem {
  id: string;
  quantity: number;
}

// Reservation System Types
export type ReservationStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';

export interface Reservation {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  numberOfGuests: number;
  specialRequests?: string;
  status: ReservationStatus;
  createdAt: Date;
  updatedAt: Date;
  adminNotes?: string;
  confirmationSentAt?: Date;
}
