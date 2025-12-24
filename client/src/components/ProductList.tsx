import { useGetProductsQuery, useAddToCartMutation } from "../app/api";
import { useSelector, useDispatch } from "react-redux";
import {
  selectSessionId,
  selectCartItems,
  initializeCart,
  setError,
} from "../app/cartSlice";
import { useEffect, useMemo } from "react";

export default function ProductList() {
  const dispatch = useDispatch();
  const sessionId = useSelector(selectSessionId);
  const cartItems = useSelector(selectCartItems); // ✅ קבל את כל העגלה פעם אחת
  const { data: products = [], error, isLoading } = useGetProductsQuery();
  const [addToCartMutation, { isLoading: isAddingToCart }] =
    useAddToCartMutation();

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
    if (!sessionId) {
      dispatch(setError("Session not initialized"));
      return;
    }

    if (product.stock <= 0) {
      dispatch(setError("Product is out of stock"));
      return;
    }

    try {
      // 📤 לוג מה אנחנו שולחים לשרת
      const requestData = {
        sessionId,
        productId: product._id,
        quantity: 1,
      };
      console.log("📤 Sending to server:", requestData);

      // 📡 שלח לשרת - חכה לתשובה לפני עדכון UI
      const response = await addToCartMutation(requestData).unwrap();

      // 📥 לוג מה קיבלנו בחזרה
      console.log("📥 Server response:", response);
      console.log(`✅ Added ${product.name} to cart`);

      // ✅ UI יתעדכן אוטומטית דרך RTK Query cache invalidation
    } catch (error: any) {
      console.error("Add to cart failed:", error);

      // ⚠️ הצג הודעת שגיאה
      dispatch(setError("Failed to add item to cart"));
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading products...</div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          // ✅ חישוב פשוט מהמיפוי
          const cartQuantity = cartMap[product._id] || 0;
          const isInCart = cartQuantity > 0;

          return (
            <div
              key={product._id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-48 object-cover rounded-t-lg"
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
                    disabled={product.stock <= 0 || isAddingToCart}
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
                      : isAddingToCart
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
        <p className="text-gray-600">Showing {products.length} products</p>
      </div>
    </div>
  );
}
