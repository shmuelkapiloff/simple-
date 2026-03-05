// ============================================================
// Simple Shop — כל הטיפוסים במקום אחד
// ============================================================

// ---------- תגובת API כללית ----------
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: string[];
}

// ---------- משתמש ----------
export interface User {
  _id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ---------- מוצר ----------
export interface Product {
  _id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured: boolean;
  stock: number;
  rating: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsQuery {
  page?: number;
  limit?: number;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort?: string;
}

// Server returns products array directly for getProducts
export type ProductsResponse = Product[];

// ---------- עגלה ----------
export interface CartItem {
  product: Product;
  quantity: number;
  lockedPrice: number | null;
}

export interface Cart {
  _id: string;
  userId: string;
  items: CartItem[];
  total: number;
}

// ---------- הזמנה ----------
export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface OrderItem {
  product: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

/**
 * ShippingAddress = "כרטיס משלוח" מלא
 * כולל את כל המידע הדרוש לשליח: שם מקבל, טלפון, כתובת
 */
export interface ShippingAddress {
  fullName: string; // שם מקבל החבילה
  phone: string; // טלפון ליצירת קשר
  street: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface TrackingEntry {
  status: string;
  timestamp: string;
  message?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  billingAddress?: ShippingAddress;
  trackingHistory: TrackingEntry[];
  estimatedDelivery?: string;
  notes?: string;
  paymentIntentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  shippingAddress: ShippingAddress;
  paymentMethod?: string;
  notes?: string;
}

// ---------- כתובת ----------
/**
 * Address = "כרטיס משלוח" מלא ששמור באקאונט
 * כולל fullName ו-phone כי השליח צריך לדעת למי למסור ואיך ליצירת קשר
 */
export interface Address {
  _id: string;
  user: string;
  fullName: string; // שם מקבל החבילה
  phone: string; // טלפון ליצירת קשר
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressRequest {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
}

// ---------- תשלום ----------
export interface Payment {
  _id: string;
  order: string;
  user: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  checkoutUrl?: string;
  createdAt: string;
}

// ---------- אדמין ----------
export interface AdminStats {
  sales: {
    total: number;
    deliveredCount: number;
  };
  orders: {
    open: number;
    today: number;
  };
  inventory: {
    lowStockCount: number;
    lowStockProducts: Array<{ _id: string; name: string; stock: number }>;
    activeProducts: number;
  };
  users: {
    total: number;
  };
}

export interface AdminProductRequest {
  name: string;
  sku: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
  featured?: boolean;
}
