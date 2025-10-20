import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

// Product type להתאמה לשרת
export interface Product {
  _id: string
  sku: string
  name: string
  description: string
  price: number
  category: string
  image: string
  featured: boolean
  stock: number
  rating: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API Response type מהשרת
interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  errors?: any[]
}

// הגדרת RTK Query API
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:4001/api/', // כתובת השרת
    prepareHeaders: (headers) => {
      // נוסיף X-Client-Id בהמשך לעגלת אורח
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Product'],
  endpoints: (builder) => ({
    // GET /api/products - רשימת מוצרים
    getProducts: builder.query<Product[], void>({
      query: () => 'products',
      // RTK Query מצפה למערך, אבל השרת מחזיר { data: [...] }
      transformResponse: (response: ApiResponse<Product[]>) => response.data || [],
      providesTags: ['Product'],
    }),
    
    // GET /api/products/:id - מוצר בודד
    getProduct: builder.query<Product, string>({
      query: (id) => `products/${id}`,
      transformResponse: (response: ApiResponse<Product>) => response.data!,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
  }),
})

// ייצוא hooks לשימוש בקומפוננטים
export const { useGetProductsQuery, useGetProductQuery } = api