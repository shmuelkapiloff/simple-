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
  phone?: string;
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
  accessToken: string;
  refreshToken: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
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

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

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

export interface ShippingAddress {
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
export interface Address {
  _id: string;
  user: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddressRequest {
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
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  lowStockProducts: Product[];
  recentOrders: Order[];
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
