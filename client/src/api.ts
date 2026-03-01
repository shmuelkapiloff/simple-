// ============================================================
// Simple Shop — כל ה-API Endpoints במקום אחד (RTK Query)
// ============================================================
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  User,
  Product,
  ProductsQuery,
  ProductsResponse,
  Cart,
  Order,
  CreateOrderRequest,
  Address,
  AddressRequest,
  Payment,
  AdminStats,
  AdminProductRequest,
} from "./types";

// ---------- Base Query עם Token ----------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem("token");
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    return headers;
  },
  credentials: "include",
});

// Wrapper: אם 401 → מנקה token
const baseQueryWithAuth: typeof baseQuery = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    // invalidate verify cache so UI updates
    api.dispatch(apiSlice.util.invalidateTags(["Auth"]));
  }
  return result;
};

// ============================================================
// API Slice
// ============================================================
const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Auth", "Products", "Cart", "Orders", "Addresses", "Admin"],
  endpoints: () => ({}),
});

// ============================================================
// AUTH
// ============================================================
export const authApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<ApiResponse<AuthResponse>, LoginRequest>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Auth", "Cart"],
    }),
    register: build.mutation<ApiResponse<AuthResponse>, RegisterRequest>({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
      invalidatesTags: ["Auth", "Cart"],
    }),
    verify: build.query<ApiResponse<{ user: User }>, void>({
      query: () => "/auth/verify",
      providesTags: ["Auth"],
    }),
    logout: build.mutation<ApiResponse<null>, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Auth", "Cart", "Orders", "Addresses"],
    }),
    getProfile: build.query<ApiResponse<{ user: User }>, void>({
      query: () => "/auth/profile",
      providesTags: ["Auth"],
    }),
    updateProfile: build.mutation<
      ApiResponse<{ user: User }>,
      UpdateProfileRequest
    >({
      query: (body) => ({ url: "/auth/profile", method: "PUT", body }),
      invalidatesTags: ["Auth"],
    }),
    changePassword: build.mutation<ApiResponse<null>, ChangePasswordRequest>({
      query: (body) => ({ url: "/auth/change-password", method: "POST", body }),
    }),
    forgotPassword: build.mutation<ApiResponse<null>, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: build.mutation<
      ApiResponse<null>,
      { token: string; newPassword: string }
    >({
      query: ({ token, ...body }) => ({
        url: `/auth/reset-password/${token}`,
        method: "POST",
        body,
      }),
    }),
  }),
});

// ============================================================
// PRODUCTS
// ============================================================
export const productsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getProducts: build.query<
      ApiResponse<ProductsResponse>,
      ProductsQuery | void
    >({
      query: (params) => {
        const q = params
          ? "?" +
            Object.entries(params)
              .filter(([, v]) => v !== undefined && v !== "")
              .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
              .join("&")
          : "";
        return `/products${q}`;
      },
      providesTags: ["Products"],
    }),
    getProduct: build.query<ApiResponse<{ product: Product }>, string>({
      query: (id) => `/products/${id}`,
      providesTags: ["Products"],
    }),
    getCategories: build.query<ApiResponse<string[]>, void>({
      query: () => "/products/categories/list",
    }),
  }),
});

// ============================================================
// CART
// ============================================================
export const cartApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getCart: build.query<ApiResponse<Cart>, void>({
      query: () => "/cart",
      providesTags: ["Cart"],
    }),
    addToCart: build.mutation<
      ApiResponse<Cart>,
      { productId: string; quantity: number }
    >({
      query: (body) => ({ url: "/cart/add", method: "POST", body }),
      invalidatesTags: ["Cart"],
    }),
    updateCartItem: build.mutation<
      ApiResponse<Cart>,
      { productId: string; quantity: number }
    >({
      query: (body) => ({ url: "/cart/update", method: "PUT", body }),
      invalidatesTags: ["Cart"],
    }),
    removeFromCart: build.mutation<ApiResponse<Cart>, { productId: string }>({
      query: (body) => ({ url: "/cart/remove", method: "DELETE", body }),
      invalidatesTags: ["Cart"],
    }),
    clearCart: build.mutation<ApiResponse<Cart>, void>({
      query: () => ({ url: "/cart/clear", method: "DELETE", body: {} }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

// ============================================================
// ORDERS
// ============================================================
export const ordersApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    createOrder: build.mutation<
      ApiResponse<{ order: Order; payment?: { checkoutUrl?: string } }>,
      CreateOrderRequest
    >({
      query: (body) => ({ url: "/orders", method: "POST", body }),
      invalidatesTags: ["Orders", "Cart"],
    }),
    getOrders: build.query<
      ApiResponse<{ orders: Order[] }>,
      { status?: string } | void
    >({
      query: (params) => {
        const q = params?.status ? `?status=${params.status}` : "";
        return `/orders${q}`;
      },
      providesTags: ["Orders"],
    }),
    getOrder: build.query<ApiResponse<{ order: Order }>, string>({
      query: (id) => `/orders/${id}`,
      providesTags: ["Orders"],
    }),
    cancelOrder: build.mutation<ApiResponse<{ order: Order }>, string>({
      query: (id) => ({ url: `/orders/${id}/cancel`, method: "POST" }),
      invalidatesTags: ["Orders"],
    }),
    getPaymentStatus: build.query<ApiResponse<{ payment: Payment }>, string>({
      query: (orderId) => `/payments/status/${orderId}`,
      providesTags: ["Orders"],
    }),
  }),
});

// ============================================================
// ADDRESSES
// ============================================================
export const addressesApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getAddresses: build.query<ApiResponse<{ addresses: Address[] }>, void>({
      query: () => "/addresses",
      providesTags: ["Addresses"],
    }),
    getDefaultAddress: build.query<ApiResponse<{ address: Address }>, void>({
      query: () => "/addresses/default",
      providesTags: ["Addresses"],
    }),
    createAddress: build.mutation<
      ApiResponse<{ address: Address }>,
      AddressRequest
    >({
      query: (body) => ({ url: "/addresses", method: "POST", body }),
      invalidatesTags: ["Addresses"],
    }),
    updateAddress: build.mutation<
      ApiResponse<{ address: Address }>,
      { id: string; data: AddressRequest }
    >({
      query: ({ id, data }) => ({
        url: `/addresses/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Addresses"],
    }),
    deleteAddress: build.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/addresses/${id}`, method: "DELETE" }),
      invalidatesTags: ["Addresses"],
    }),
    setDefaultAddress: build.mutation<
      ApiResponse<{ address: Address }>,
      string
    >({
      query: (id) => ({ url: `/addresses/${id}/set-default`, method: "POST" }),
      invalidatesTags: ["Addresses"],
    }),
  }),
});

// ============================================================
// ADMIN
// ============================================================
export const adminApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getAdminStats: build.query<ApiResponse<{ stats: AdminStats }>, void>({
      query: () => "/admin/stats/summary",
      providesTags: ["Admin"],
    }),
    getAdminProducts: build.query<ApiResponse<{ products: Product[] }>, void>({
      query: () => "/admin/products",
      providesTags: ["Admin", "Products"],
    }),
    createProduct: build.mutation<
      ApiResponse<{ product: Product }>,
      AdminProductRequest
    >({
      query: (body) => ({ url: "/admin/products", method: "POST", body }),
      invalidatesTags: ["Admin", "Products"],
    }),
    updateProduct: build.mutation<
      ApiResponse<{ product: Product }>,
      { id: string; data: Partial<AdminProductRequest> }
    >({
      query: ({ id, data }) => ({
        url: `/admin/products/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Admin", "Products"],
    }),
    deleteProduct: build.mutation<ApiResponse<null>, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Admin", "Products"],
    }),
    getAdminUsers: build.query<ApiResponse<{ users: User[] }>, void>({
      query: () => "/admin/users",
      providesTags: ["Admin"],
    }),
    updateUserRole: build.mutation<
      ApiResponse<{ user: User }>,
      { id: string; role: string }
    >({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: ["Admin"],
    }),
    getAdminOrders: build.query<
      ApiResponse<{ orders: Order[] }>,
      { status?: string } | void
    >({
      query: (params) => {
        const q = params?.status ? `?status=${params.status}` : "";
        return `/admin/orders${q}`;
      },
      providesTags: ["Admin", "Orders"],
    }),
    updateOrderStatus: build.mutation<
      ApiResponse<{ order: Order }>,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/admin/orders/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: ["Admin", "Orders"],
    }),
  }),
});

// ============================================================
// Exported hooks
// ============================================================
export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyQuery,
  useLogoutMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetCategoriesQuery,
} = productsApi;

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} = cartApi;

export const {
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useGetPaymentStatusQuery,
} = ordersApi;

export const {
  useGetAddressesQuery,
  useGetDefaultAddressQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = addressesApi;

export const {
  useGetAdminStatsQuery,
  useGetAdminProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
} = adminApi;

// Export the API for store setup
export { apiSlice as api };
