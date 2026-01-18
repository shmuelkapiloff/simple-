import {
  useGetProductsQuery,
  useAddToCartMutation,
  useGetCartQuery,
  useGetCategoriesQuery,
  ProductFilters,
} from "../app/api";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSessionId,
  selectCartItems,
  initializeCart,
  setError,
  setCart,
} from "../app/cartSlice";
import { selectIsAuthenticated, requireAuth } from "../app/authSlice";
import { useEffect, useMemo, useState } from "react";

export default function ProductList() {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const cartItems = useSelector(selectCartItems); // ✅ קבל את כל העגלה פעם אחת
  const [addToCartMutation] = useAddToCartMutation();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

  // Filters state
  const [filters, setFilters] = useState<ProductFilters>({});
  const [searchInput, setSearchInput] = useState("");
  const [priceInputs, setPriceInputs] = useState({ min: "", max: "" });

  // Fetch products with filters
  const { data: products = [], error, isLoading } = useGetProductsQuery(filters);
  const { data: categories = [] } = useGetCategoriesQuery();

  // Load cart from server to sync state
  const { data: serverCart, refetch: refetchCart } = useGetCartQuery(
    undefined,
    {
      skip: !isAuthenticated,
    }
  );

  // Sync server cart to local state
  useEffect(() => {
    if (serverCart && sessionId) {
      dispatch(
        setCart({
          items: serverCart.items,
          total: serverCart.total,
          sessionId: serverCart.sessionId,
        })
      );
    }
  }, [serverCart, dispatch, sessionId]);

  // ✅ חישוב מיפוי מוצרים בעגלה
  const cartMap = useMemo(() => {
    return cartItems.reduce((map, item) => {
      map[item.product._id] = item.quantity;
      return map;
    }, {} as Record<string, number>);
  }, [cartItems]);

  useEffect(() => {
    if (!sessionId) {
      dispatch(initializeCart());
    }
  }, [dispatch, sessionId]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput || undefined }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle price inputs with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({
        ...prev,
        minPrice: priceInputs.min ? parseFloat(priceInputs.min) : undefined,
        maxPrice: priceInputs.max ? parseFloat(priceInputs.max) : undefined,
      }));
    }, 800); // longer debounce for price to allow completing the number
    return () => clearTimeout(timer);
  }, [priceInputs]);

  // Filter handlers
  const handleCategoryChange = (category: string) => {
    setFilters((prev) => ({
      ...prev,
      category: category === "all" ? undefined : category,
    }));
  };

  const handleSortChange = (sort: string) => {
    setFilters((prev) => ({
      ...prev,
      sort: sort === "default" ? undefined : (sort as any),
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput("");
    setPriceInputs({ min: "", max: "" });
  };

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      dispatch(
        requireAuth({ view: "login", message: "Please sign in to add to cart" })
      );
      dispatch(setError("Please sign in to add to cart"));
      return;
    }

    if (product.stock <= 0) {
      dispatch(setError("Product is out of stock"));
      return;
    }

    try {
      // Set loading state for this specific product
      setAddingProductId(product._id);

      const requestData = {
        productId: product._id,
        quantity: 1,
      };

      // Send to server and wait for response
      const response = await addToCartMutation(requestData).unwrap();

      // Update Redux state with server response
      if (response) {
        dispatch(
          setCart({
            items: response.items,
            total: response.total,
            sessionId: response.sessionId,
          })
        );
      }

      // UI will update automatically through RTK Query cache invalidation
      try {
        await refetchCart();
      } catch {}
    } catch (error: any) {
      // Display error message to user
      dispatch(setError("Failed to add item to cart"));
    } finally {
      // Clear loading state
      setAddingProductId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow-md p-4 animate-pulse"
            >
              <div className="w-full h-48 bg-gray-200 rounded-md mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-5/6 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-4/6 mb-4" />
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-20" />
                <div className="h-9 bg-gray-200 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-red-600">Error loading products</div>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">מוצרים</h1>
      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              חיפוש
            </label>
            <input
              type="text"
              placeholder="חפש מוצר..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              קטגוריה
            </label>
            <select
              value={filters.category || "all"}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">כל הקטגוריות</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              מיון
            </label>
            <select
              value={filters.sort || "default"}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="default">ברירת מחדל (חדשים)</option>
              <option value="price_asc">מחיר: נמוך לגבוה</option>
              <option value="price_desc">מחיר: גבוה לנמוך</option>
              <option value="name_asc">שם: א-ת</option>
              <option value="name_desc">שם: ת-א</option>
              <option value="rating_desc">דירוג</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              טווח מחירים
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="מינימום"
                value={priceInputs.min}
                onChange={(e) =>
                  setPriceInputs((prev) => ({ ...prev, min: e.target.value }))
                }
                className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="מקסימום"
                value={priceInputs.max}
                onChange={(e) =>
                  setPriceInputs((prev) => ({ ...prev, max: e.target.value }))
                }
                className="w-1/2 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.category || filters.search || filters.sort || filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
          <div className="mt-4 text-center">
            <button
              onClick={clearFilters}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              נקה סינון
            </button>
          </div>
        )}
      </div>

      {/* No Results Message */}
      {!isLoading && products.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            לא נמצאו מוצרים מתאימים
          </h3>
          <p className="text-gray-600 mb-4">
            נסה לשנות את הסינון או לחפש משהו אחר
          </p>
        </div>
      )}

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          // ✅ חישוב פשוט מהמיפוי
          const cartQuantity = cartMap[product._id] || 0;
          const isInCart = cartQuantity > 0;
          const isAddingThisProduct = addingProductId === product._id;

          return (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={product.image || "https://placehold.co/600x400?text=No+Image"}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "https://placehold.co/600x400/e2e8f0/64748b?text=No+Image";
                }}
              />
              <div className="p-4">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={
                          i < Math.floor(product.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    {product.rating}
                  </span>
                </div>

                <h3
                  className="font-semibold text-gray-900 mb-1 truncate"
                  title={product.name}
                >
                  {product.name}
                </h3>

                <p
                  className="text-sm text-gray-600 mb-3 line-clamp-2"
                  title={product.description}
                >
                  {product.description.length > 80
                    ? `${product.description.substring(0, 80)}...`
                    : product.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-blue-600">
                    ${product.price}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0 || isAddingThisProduct}
                    aria-label={`הוסף ${product.name} לעגלה`}
                    className={`px-4 py-2 rounded-md transition-colors font-medium ${
                      product.stock <= 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : isInCart
                        ? "bg-green-600 hover:bg-green-700 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {product.stock <= 0
                      ? "Out of Stock"
                      : isAddingThisProduct
                      ? "Adding..."
                      : isInCart
                      ? `In Cart (${cartQuantity})`
                      : "🛒 Add to Cart"}
                  </button>
                </div>

                {product.stock > 0 ? (
                  <p className="text-xs text-green-600 mt-2">
                    In Stock ({product.stock})
                  </p>
                ) : (
                  <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Count - only show if there are products */}
      {products.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600">מציג {products.length} מוצרים</p>
        </div>
      )}
    </main>
  );
}
