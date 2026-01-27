import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ApiLogger } from "../utils/apiLogger";
import { logout, requireAuth } from "./authSlice";

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

// Product filters
export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  sort?:
    | "price_asc"
    | "price_desc"
    | "name_asc"
    | "name_desc"
    | "rating_desc"
    | "newest";
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
  productId: string;
  quantity: number;
}

interface UpdateCartRequest {
  productId: string;
  quantity: number;
}

interface RemoveFromCartRequest {
  productId: string;
}

interface ClearCartRequest {}

// Address types
export interface Address {
  _id: string;
  user: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
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
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  billingAddress?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: "stripe"; // currently only Stripe is allowed
  notes?: string;
}

interface CancelOrderRequest {
  orderId: string;
}

// Address API request types
interface CreateAddressRequest {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

interface UpdateAddressRequest {
  addressId: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

interface DeleteAddressRequest {
  addressId: string;
}

interface SetDefaultAddressRequest {
  addressId: string;
}

// Base URL נלקח מ-env כדי לאפשר מעבר בין סביבות (כולל /api/)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4001/api/";

// הגדרת RTK Query API עם ApiLogger מתקדם
const baseQueryWithLogging = fetchBaseQuery({
  baseUrl: API_BASE_URL,
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
  extraOptions: any,
) => {
  const endpoint =
    typeof args === "string" ? args : `${args.method || "GET"} ${args.url}`;
  const callId = ApiLogger.startCall(endpoint, args.body);

  try {
    const result = await baseQueryWithLogging(args, api, extraOptions);

    if (result.error) {
      ApiLogger.endCall(callId, null, result.error);

      // Auth guard: if token expired/unauthorized, force login modal
      if (result.error.status === 401) {
        api.dispatch(logout());
        api.dispatch(
          requireAuth({
            view: "login",
            message: "התחבר כדי להמשיך",
          }),
        );
      }
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
  tagTypes: [
    "Product",
    "Cart",
    "Order",
    "Address",
    "AdminProduct",
    "AdminUser",
    "AdminOrder",
    "AdminStats",
  ],
  endpoints: (builder) => ({
    // GET /api/products - רשימת מוצרים עם סינון וחיפוש
    getProducts: builder.query<Product[], ProductFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.category) params.append("category", filters.category);
          if (filters.minPrice !== undefined)
            params.append("minPrice", filters.minPrice.toString());
          if (filters.maxPrice !== undefined)
            params.append("maxPrice", filters.maxPrice.toString());
          if (filters.search) params.append("search", filters.search);
          if (filters.featured !== undefined)
            params.append("featured", filters.featured.toString());
          if (filters.sort) params.append("sort", filters.sort);
        }
        const queryString = params.toString();
        return queryString ? `products?${queryString}` : "products";
      },
      // RTK Query מצפה למערך, אבל השרת מחזיר { data: [...] }
      transformResponse: (response: ApiResponse<Product[]>) =>
        response.data || [],
      providesTags: ["Product"],
    }),

    // GET /api/products/categories/list - רשימת קטגוריות
    getCategories: builder.query<string[], void>({
      query: () => "products/categories/list",
      transformResponse: (response: ApiResponse<string[]>) =>
        response.data || [],
    }),

    // GET /api/products/:id - מוצר בודד
    getProduct: builder.query<Product, string>({
      query: (id) => `products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      providesTags: (_, __, id) => [{ type: "Product", id }],
    }),

    // === CART ENDPOINTS === //

    // GET /api/cart - קבלת עגלה (requires auth)
    getCart: builder.query<Cart, void>({
      query: () => "cart",
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      providesTags: ["Cart"],
    }),

    // GET /api/cart/count - ספירת פריטים בעגלה (requires auth)
    getCartCount: builder.query<{ count: number }, void>({
      query: () => "cart/count",
      transformResponse: (response: ApiResponse<{ count: number }>) =>
        response.data!,
      providesTags: ["Cart"],
    }),

    // POST /api/cart/add - הוספת פריט לעגלה (requires auth)
    addToCart: builder.mutation<Cart, AddToCartRequest>({
      query: (body) => ({
        url: "cart/add",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // PUT /api/cart/update - עדכון כמות (requires auth)
    updateCartQuantity: builder.mutation<Cart, UpdateCartRequest>({
      query: (body) => ({
        url: "cart/update",
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // DELETE /api/cart/remove - הסרת פריט (requires auth)
    removeFromCart: builder.mutation<Cart, RemoveFromCartRequest>({
      query: (body) => ({
        url: "cart/remove",
        method: "DELETE",
        body,
      }),
      transformResponse: (response: ApiResponse<Cart>) => response.data!,
      invalidatesTags: ["Cart"],
    }),

    // DELETE /api/cart/clear - ניקוי עגלה (requires auth)
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
    createOrder: builder.mutation<
      {
        order: Order;
        payment?: {
          clientSecret?: string;
          checkoutUrl?: string;
          status?: string;
        };
      },
      CreateOrderRequest
    >({
      query: (body) => ({
        url: "orders",
        method: "POST",
        body,
      }),
      // השרת מחזיר data: { order, payment }
      transformResponse: (
        response: ApiResponse<{
          order: Order;
          payment?: {
            clientSecret?: string;
            checkoutUrl?: string;
            status?: string;
          };
        }>,
      ) => (response.data as any) || {},
      invalidatesTags: ["Cart", "Order"],
    }),

    // GET /api/orders - קבלת הזמנות המשתמש
    getUserOrders: builder.query<Order[], void>({
      query: () => "orders",
      // השרת מחזיר data: { orders }
      transformResponse: (response: ApiResponse<{ orders: Order[] }>) =>
        (response.data as any)?.orders || [],
      providesTags: ["Order"],
    }),

    // GET /api/orders/:orderId - קבלת הזמנה ספציפית
    getOrderById: builder.query<Order, string>({
      query: (orderId) => `orders/${orderId}`,
      // השרת מחזיר data: { order }
      transformResponse: (response: ApiResponse<{ order: Order }>) =>
        (response.data as any)?.order,
      providesTags: (_, __, orderId) => [{ type: "Order", id: orderId }],
    }),

    // GET /api/orders/track/:orderId - מעקב אחר הזמנה (ללא אימות)
    trackOrder: builder.query<Order, string>({
      query: (orderId) => `orders/track/${orderId}`,
      transformResponse: (response: ApiResponse<Order>) => response.data!,
    }),

    // POST /api/orders/:orderId/cancel - ביטול הזמנה
    cancelOrder: builder.mutation<Order, CancelOrderRequest>({
      query: ({ orderId }) => ({
        url: `orders/${orderId}/cancel`,
        method: "POST",
      }),
      // השרת מחזיר data: { order }
      transformResponse: (response: ApiResponse<{ order: Order }>) =>
        (response.data as any)?.order,
      invalidatesTags: ["Order"],
    }),

    // === PAYMENT ENDPOINTS === //

    // POST /api/payments/create-intent - יצירת כוונת תשלום להזמנה
    createPaymentIntent: builder.mutation<
      {
        payment: any;
        status: string;
        clientSecret?: string;
        checkoutUrl?: string;
      },
      { orderId: string }
    >({
      query: (body) => ({
        url: "payments/create-intent",
        method: "POST",
        body,
      }),
      transformResponse: (
        response: ApiResponse<{
          payment: any;
          status: string;
          clientSecret?: string;
          checkoutUrl?: string;
        }>,
      ) => response.data!,
      invalidatesTags: ["Order"],
    }),

    // GET /api/payments/:orderId/status - סטטוס תשלום להזמנה
    getPaymentStatus: builder.query<
      {
        orderPaymentStatus: "pending" | "paid" | "failed" | "refunded";
        paymentStatus: string;
        paymentId?: string;
        providerPaymentId?: string;
        checkoutUrl?: string;
        clientSecret?: string;
      },
      string
    >({
      query: (orderId) => `payments/${orderId}/status`,
      transformResponse: (response: ApiResponse<any>) => response.data!,
      providesTags: ["Order"],
    }),

    // === ADDRESS ENDPOINTS === //

    // GET /api/addresses - קבלת כל הכתובות של המשתמש
    getAddresses: builder.query<Address[], void>({
      query: () => "addresses",
      transformResponse: (response: ApiResponse<any>) =>
        (response.data || []).map((a: any) => ({
          ...a,
          zipCode: a.postalCode ?? a.zipCode,
        })),
      providesTags: ["Address"],
    }),

    // GET /api/addresses/default - קבלת כתובת ברירת מחדל
    getDefaultAddress: builder.query<Address, void>({
      query: () => "addresses/default",
      transformResponse: (response: ApiResponse<any>) => {
        const a = response.data as any;
        return { ...a, zipCode: a?.postalCode ?? a?.zipCode };
      },
      providesTags: ["Address"],
    }),

    // GET /api/addresses/:addressId - קבלת כתובת ספציפית
    getAddressById: builder.query<Address, string>({
      query: (addressId) => `addresses/${addressId}`,
      transformResponse: (response: ApiResponse<any>) => {
        const a = response.data as any;
        return { ...a, zipCode: a?.postalCode ?? a?.zipCode };
      },
      providesTags: (_, __, addressId) => [{ type: "Address", id: addressId }],
    }),

    // POST /api/addresses - יצירת כתובת חדשה
    createAddress: builder.mutation<Address, CreateAddressRequest>({
      query: (body) => ({
        url: "addresses",
        method: "POST",
        body: {
          street: body.street,
          city: body.city,
          postalCode: (body as any).postalCode ?? body.zipCode,
          country: body.country,
          isDefault: body.isDefault,
        },
      }),
      transformResponse: (response: ApiResponse<any>) => {
        const a = response.data as any;
        return { ...a, zipCode: a?.postalCode ?? a?.zipCode };
      },
      invalidatesTags: ["Address"],
    }),

    // PUT /api/addresses/:addressId - עדכון כתובת
    updateAddress: builder.mutation<Address, UpdateAddressRequest>({
      query: ({ addressId, ...body }) => ({
        url: `addresses/${addressId}`,
        method: "PUT",
        body: {
          street: body.street,
          city: body.city,
          postalCode: (body as any).postalCode ?? body.zipCode,
          country: body.country,
        },
      }),
      transformResponse: (response: ApiResponse<any>) => {
        const a = response.data as any;
        return { ...a, zipCode: a?.postalCode ?? a?.zipCode };
      },
      invalidatesTags: ["Address"],
    }),

    // DELETE /api/addresses/:addressId - מחיקת כתובת
    deleteAddress: builder.mutation<void, DeleteAddressRequest>({
      query: ({ addressId }) => ({
        url: `addresses/${addressId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Address"],
    }),

    // POST /api/addresses/:addressId/set-default - הגדרת כתובת כברירת מחדל
    setDefaultAddress: builder.mutation<Address, SetDefaultAddressRequest>({
      query: ({ addressId }) => ({
        url: `addresses/${addressId}/set-default`,
        method: "POST",
      }),
      transformResponse: (response: ApiResponse<any>) => {
        const a = response.data as any;
        return { ...a, zipCode: a?.postalCode ?? a?.zipCode };
      },
      invalidatesTags: ["Address"],
    }),

    // === ADMIN PRODUCT ENDPOINTS === //

    // GET /api/admin/products?includeInactive=true - רשימת כל מוצרים (admin)
    getAdminProducts: builder.query<
      Product[],
      { includeInactive?: boolean } | void
    >({
      query: (params) => ({
        url: "admin/products",
        params: params ? { includeInactive: params.includeInactive } : {},
      }),
      transformResponse: (response: ApiResponse<any>) => {
        // Handle both array and object responses
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.products && Array.isArray(response.data.products)) {
          return response.data.products;
        }
        return [];
      },
      providesTags: ["AdminProduct"],
    }),

    // POST /api/admin/products - יצירת מוצר חדש (admin)
    createAdminProduct: builder.mutation<
      Product,
      Omit<Product, "_id" | "createdAt" | "updatedAt" | "rating">
    >({
      query: (body) => ({
        url: "admin/products",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      invalidatesTags: ["AdminProduct", "Product"],
    }),

    // PUT /api/admin/products/:productId - עדכון מוצר (admin)
    updateAdminProduct: builder.mutation<
      Product,
      { productId: string; body: Partial<Product> }
    >({
      query: ({ productId, body }) => ({
        url: `admin/products/${productId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      invalidatesTags: (_, __, { productId }) => [
        { type: "AdminProduct", id: productId },
        "AdminProduct",
        { type: "Product", id: productId },
      ],
    }),

    // DELETE /api/admin/products/:productId - מחיקה רכה של מוצר (admin)
    deleteAdminProduct: builder.mutation<Product, string>({
      query: (productId) => ({
        url: `admin/products/${productId}`,
        method: "DELETE",
      }),
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      invalidatesTags: ["AdminProduct", "Product"],
    }),

    // === ADMIN USER ENDPOINTS === //

    // GET /api/admin/users?page=1&limit=20 - רשימת משתמשים (admin)
    getAdminUsers: builder.query<
      {
        users: any[];
        total: number;
        page: number;
        limit: number;
      },
      { page?: number; limit?: number } | void
    >({
      query: (params) => ({
        url: "admin/users",
        params: params || {},
      }),
      transformResponse: (response: ApiResponse<any>) => response.data!,
      providesTags: ["AdminUser"],
    }),

    // PUT /api/admin/users/:userId/role - עדכון תפקיד משתמש (admin)
    updateUserRole: builder.mutation<
      any,
      { userId: string; role: "user" | "admin" }
    >({
      query: ({ userId, role }) => ({
        url: `admin/users/${userId}/role`,
        method: "PUT",
        body: { role },
      }),
      transformResponse: (response: ApiResponse<any>) => response.data!,
      invalidatesTags: ["AdminUser"],
    }),

    // === ADMIN ORDER ENDPOINTS === //

    // GET /api/admin/orders?status=pending - רשימת הזמנות (admin)
    getAdminOrders: builder.query<
      Order[],
      {
        status?:
          | "pending"
          | "processing"
          | "shipped"
          | "delivered"
          | "cancelled";
      } | void
    >({
      query: (params) => ({
        url: "admin/orders",
        params: params || {},
      }),
      transformResponse: (response: ApiResponse<any>) => {
        // Handle both array and object responses
        if (Array.isArray(response.data)) {
          return response.data;
        }
        if (response.data?.orders && Array.isArray(response.data.orders)) {
          return response.data.orders;
        }
        return [];
      },
      providesTags: ["AdminOrder"],
    }),

    // PUT /api/admin/orders/:orderId/status - עדכון סטטוס הזמנה (admin)
    updateOrderStatus: builder.mutation<
      Order,
      {
        orderId: string;
        status:
          | "pending"
          | "processing"
          | "shipped"
          | "delivered"
          | "cancelled";
        message?: string;
      }
    >({
      query: ({ orderId, status, message }) => ({
        url: `admin/orders/${orderId}/status`,
        method: "PUT",
        body: { status, message },
      }),
      transformResponse: (response: ApiResponse<Order>) => response.data!,
      invalidatesTags: (_, __, { orderId }) => [
        { type: "AdminOrder", id: orderId },
        "AdminOrder",
        { type: "Order", id: orderId },
      ],
    }),

    // === ADMIN STATS ENDPOINTS === //

    // GET /api/admin/stats/summary - סיכום סטטיסטיקה (admin)
    getAdminStatsSummary: builder.query<
      {
        totalSales: number;
        totalOrders: number;
        pendingOrders: number;
        lowStockProducts: number;
        totalUsers: number;
      },
      void
    >({
      query: () => "admin/stats/summary",
      transformResponse: (response: ApiResponse<any>) => response.data!,
      providesTags: ["AdminStats"],
    }),
  }),
});

// ייצוא hooks לשימוש בקומפוננטים
export const {
  // Products
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
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
  useGetOrderByIdQuery,
  useTrackOrderQuery,
  useCancelOrderMutation,
  // Payments
  useCreatePaymentIntentMutation,
  useGetPaymentStatusQuery,
  // Addresses
  useGetAddressesQuery,
  useGetDefaultAddressQuery,
  useGetAddressByIdQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  // Admin
  useGetAdminProductsQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetAdminStatsSummaryQuery,
} = api;
