import { useState } from "react";
import { useGetProductsQuery, useGetCategoriesQuery } from "../api";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data, isLoading, isFetching } = useGetProductsQuery({
    page,
    limit,
    search: search || undefined,
    category: category || undefined,
    sort: sort || undefined,
  });
  const { data: catData } = useGetCategoriesQuery();

  // API returns array directly: { success: true, data: [...products] }
  const products = Array.isArray(data?.data) ? data.data : [];
  const categories = catData?.data ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">ברוכים הבאים ל-TechBasket</h1>
        <p className="text-gray-500 text-lg">המוצרים הטובים ביותר במחירים הכי משתלמים</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="חיפוש מוצרים..."
            className="w-full border border-gray-300 rounded-lg pr-10 pl-3 py-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">כל הקטגוריות</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2.5 bg-white focus:ring-2 focus:ring-primary-500 outline-none"
        >
          <option value="">מיון</option>
          <option value="price_asc">מחיר: נמוך לגבוה</option>
          <option value="price_desc">מחיר: גבוה לנמוך</option>
          <option value="name_asc">שם: א-ת</option>
          <option value="name_desc">שם: ת-א</option>
          <option value="rating_desc">דירוג</option>
          <option value="newest">חדש ביותר</option>
        </select>

        {(search || category || sort) && (
          <button
            onClick={() => { setSearch(""); setCategory(""); setSort(""); setPage(1); }}
            className="text-sm text-red-500 hover:text-red-700"
          >
            נקה הכל
          </button>
        )}
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-t-xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">🔍</p>
          <p className="text-xl text-gray-500">לא נמצאו מוצרים</p>
          {search && (
            <button onClick={() => setSearch("")} className="text-primary-600 mt-2 hover:underline">
              נקה חיפוש
            </button>
          )}
        </div>
      ) : (
        <>
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${isFetching ? "opacity-60" : ""}`}>
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
