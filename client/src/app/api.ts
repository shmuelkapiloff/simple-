import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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

// הגדרת RTK Query API
export const api = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:4001/api/", // כתובת השרת
    prepareHeaders: (headers) => {
      // נוסיף X-Client-Id בהמשך לעגלת אורח
      headers.set("Content-Type", "application/json");
      return headers;
    },
    // 🔍 הוספת interceptor לדיבוג
    fetchFn: async (...args) => {
      const [url, options] = args;
      console.log("🌐 API Call:", {
        url: url?.toString(),
        method: options?.method || "GET",
        headers: options?.headers,
        body: options?.body ? JSON.parse(options.body as string) : null,
      });

      const response = await fetch(...args);
      const clonedResponse = response.clone();

      try {
        const data = await clonedResponse.json();
        console.log("🌐 API Response:", {
          url: url?.toString(),
          status: response.status,
          data: data,
        });
      } catch (e) {
        console.log("🌐 API Response (non-JSON):", {
          url: url?.toString(),
          status: response.status,
          statusText: response.statusText,
        });
      }

      return response;
    },
  }),
  tagTypes: ["Product", "Cart"],
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
} = api;
