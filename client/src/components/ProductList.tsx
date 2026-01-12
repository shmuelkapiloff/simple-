import {
  useGetProductsQuery,
  useAddToCartMutation,
  useGetCartQuery,
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
  const { data: products = [], error, isLoading } = useGetProductsQuery();
  const [addToCartMutation] = useAddToCartMutation();
  const [addingProductId, setAddingProductId] = useState<string | null>(null);

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

  const handleAddToCart = async (product: any) => {
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.warn("User not authenticated");
      }
      dispatch(
        requireAuth({ view: "login", message: "נא להתחבר כדי להוסיף לעגלה" })
      );
      dispatch(setError("נא להתחבר כדי להוסיף לעגלה"));
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

      // 📡 שלח לשרת - חכה לתשובה לפני עדכון UI
      const response = await addToCartMutation(requestData).unwrap();

      if (import.meta.env.DEV) {
        console.log("✅ Add to cart response:", {
          itemsLength: response.items?.length,
          total: response.total,
          items: response.items,
        });
      }

      // ✅ עדכן את ה-Redux state מיד עם התגובה מהשרת
      if (response) {
        dispatch(
          setCart({
            items: response.items,
            total: response.total,
            sessionId: response.sessionId,
          })
        );
      }

      // ✅ UI יתעדכן אוטומטית דרך RTK Query cache invalidation
      // וגם מבצעים refetch מיידי כדי לוודא עדכון מהשרת
      try {
        await refetchCart();
      } catch {}
    } catch (error: any) {
      console.error("Add to cart failed:", error);

      // ⚠️ הצג הודעת שגיאה
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

  if (!isLoading && !error && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="text-6xl mb-4">🛍️</div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-2">
          אין מוצרים זמינים
        </h3>
        <p className="text-gray-600 mb-6">נסה לרענן או לחזור בהמשך.</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          רענן דף
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">מוצרים</h1>

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
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://placehold.co/600x400?text=No+Image";
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

      <div className="mt-8 text-center">
        <p className="text-gray-600">מציג {products.length} מוצרים</p>
      </div>
    </main>
  );
}
