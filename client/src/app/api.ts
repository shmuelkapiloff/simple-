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
  sessionId: string;
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
  paymentMethod?: string;
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
  tagTypes: ["Product", "Cart", "Order", "Address"],
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
    createOrder: builder.mutation<Order, CreateOrderRequest>({
      query: (body) => ({
        url: "orders",
        method: "POST",
        body,
      }),
      // השרת מחזיר data: { order }
      transformResponse: (response: ApiResponse<{ order: Order }>) =>
        (response.data as any)?.order,
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
        }>
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
} = api;
