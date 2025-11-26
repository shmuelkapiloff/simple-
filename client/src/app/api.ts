import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiLogger } from "../utils/apiLogger";

// Product type להתאמה לשרת
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

// API Response type מהשרת
interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

// Cart types
export interface CartItem {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    image: string;
    sku: string;
  };
  quantity: number;
  price: number;
}

export interface Cart {
  sessionId: string;
  userId?: string;
  items: CartItem[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
}

// Cart API request types
interface AddToCartRequest {
  sessionId: string;
  productId: string;
  quantity: number;
}

interface UpdateCartRequest {
  sessionId: string;
  productId: string;
  quantity: number;
}

interface RemoveFromCartRequest {
  sessionId: string;
  productId: string;
}

interface ClearCartRequest {
  sessionId: string;
}

// Order types
export interface Order {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    email?: string;
  };
  items: Array<{
    product: {
      _id: string;
      name: string;
      price: number;
      sku: string;
    };
    quantity: number;
    price: number;
  }>;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  updatedAt: string;
}

// Order API request types
interface CreateOrderRequest {
  sessionId: string;
}

interface CancelOrderRequest {
  orderId: string;
}

// הגדרת RTK Query API עם ApiLogger מתקדם
const baseQueryWithLogging = fetchBaseQuery({
  baseUrl: "http://localhost:4001/api/",
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json");

    // Add authorization token for protected routes
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

// Wrapper עם ApiLogger
const baseQueryWithInterceptor = async (
  args: any,
  api: any,
  extraOptions: any
) => {
  const endpoint =
    typeof args === "string" ? args : `${args.method || "GET"} ${args.url}`;
  const callId = ApiLogger.startCall(endpoint, args.body);

  try {
    const result = await baseQueryWithLogging(args, api, extraOptions);

    if (result.error) {
      ApiLogger.endCall(callId, null, result.error);
    } else {
      ApiLogger.endCall(callId, result.data);
    }

    return result;
  } catch (error) {
    ApiLogger.endCall(callId, null, error);
    throw error;
  }
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Product", "Cart", "Order"],
  endpoints: (builder) => ({
    // GET /api/products - רשימת מוצרים
    getProducts: builder.query<Product[], void>({
      query: () => "products",
      // RTK Query מצפה למערך, אבל השרת מחזיר { data: [...] }
      transformResponse: (response: ApiResponse<Product[]>) =>
        response.data || [],
      providesTags: ["Product"],
    }),

    // GET /api/products/:id - מוצר בודד
    getProduct: builder.query<Product, string>({
      query: (id) => `products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      providesTags: (_, __, id) => [{ type: "Product", id }],
    }),

    // === CART ENDPOINTS === //

    // GET /api/cart - קבלת עגלה
    getCart: builder.query<Cart, string>({
      query: (sessionId) => ({
        url: "cart",
        params: { sessionId },
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      providesTags: ["Cart"],
    }),

    // GET /api/cart/count - ספירת פריטים בעגלה
    getCartCount: builder.query<{ count: number }, string>({
      query: (sessionId) => ({
        url: "cart/count",
        params: { sessionId },
      }),
      transformResponse: (response: ApiResponse<{ count: number }>) =>
        response.data!,
      providesTags: ["Cart"],
    }),

    // POST /api/cart/add - הוספת פריט לעגלה
    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (body) => ({
        url: "cart/add",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // PUT /api/cart/update - עדכון כמות
    updateCartQuantity: builder.mutation<Cart, UpdateCartRequest>({
      query: (body) => ({
        url: "cart/update",
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // DELETE /api/cart/remove - הסרת פריט
    removeFromCart: builder.mutation<Cart, RemoveFromCartRequest>({
      query: (body) => ({
        url: "cart/remove",
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // DELETE /api/cart/clear - ניקוי עגלה
    clearCart: builder.mutation<Cart, ClearCartRequest>({
      query: (body) => ({
        url: "cart/clear",
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // === ORDER ENDPOINTS === //

    // POST /api/orders - יצירת הזמנה מהעגלה
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: "orders",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data!,
      invalidatesTags: ["Cart", "Order"],
    }),

    // GET /api/orders - קבלת הזמנות המשתמש
    getUserOrders: builder.query<Order[], void>({
      query: () => "orders",
      transformResponse: (response: ApiResponse<Order[]>) =>
        response.data || [],
      providesTags: ["Order"],
    }),

    // PUT /api/orders/:id/cancel - ביטול הזמנה
    cancelOrder: builder.mutation<Order, CancelOrderRequest>({
      query: ({ orderId }) => ({
        url: `orders/${orderId}/cancel`,
        method: "PUT",
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data!,
      invalidatesTags: ["Order"],
    }),
  }),
});

// ייצוא hooks לשימוש בקומפוננטים
export const {
  // Products
  useGetProductsQuery,
  useGetProductQuery,
  // Cart
  useGetCartQuery,
  useGetCartCountQuery,
  useAddToCartMutation,
  useUpdateCartQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  // Orders
  useCreateOrderMutation,
  useGetUserOrdersQuery,
  useCancelOrderMutation,
} = api;
