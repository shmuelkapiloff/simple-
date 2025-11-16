import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectSessionId,
  initializeCart,
  updateQuantityOptimistic,
  removeItemOptimistic,
  clearCart as clearCartAction,
  setCart,
  setError,
} from "../app/cartSlice";
import {
  useGetCartQuery,
  useUpdateCartQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} from "../app/api";

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cart = useSelector(selectCart);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemCount);
  const sessionId = useSelector(selectSessionId);

  // RTK Query mutations
  const [updateQuantityMutation] = useUpdateCartQuantityMutation();
  const [removeFromCartMutation] = useRemoveFromCartMutation();
  const [clearCartMutation] = useClearCartMutation();

  // Initialize cart on mount
  useEffect(() => {
    if (!sessionId) {
      dispatch(initializeCart());
    }
  }, [dispatch, sessionId]);

  // Load cart from server
  const {
    data: serverCart,
    error,
    isLoading,
  } = useGetCartQuery(sessionId || "", {
    skip: !sessionId,
  });

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

  // Handle API errors
  useEffect(() => {
    if (error) {
      dispatch(setError("Failed to load cart"));
      console.error("Cart API error:", error);
    }
  }, [error, dispatch]);

  // Update quantity handler
  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
    if (!sessionId) return;

    // Store current state for potential revert
    const currentItems = [...items];
    const currentTotal = total;

    try {
      // Optimistic update
      dispatch(updateQuantityOptimistic({ productId, quantity: newQuantity }));

      // API call
      await updateQuantityMutation({
        sessionId,
        productId,
        quantity: newQuantity,
      }).unwrap();
    } catch (error) {
      console.error("Update quantity failed:", error);
      // Revert optimistic update
      dispatch(setCart({ items: currentItems, total: currentTotal }));
      dispatch(setError("Failed to update quantity"));
    }
  };

  // Remove item handler
  const handleRemoveItem = async (productId: string) => {
    if (!sessionId) return;

    // Store current state for potential revert
    const currentItems = [...items];
    const currentTotal = total;

    try {
      // Optimistic update
      dispatch(removeItemOptimistic({ productId }));

      // API call
      await removeFromCartMutation({
        sessionId,
        productId,
      }).unwrap();
    } catch (error) {
      console.error("Remove item failed:", error);
      // Revert optimistic update
      dispatch(setCart({ items: currentItems, total: currentTotal }));
      dispatch(setError("Failed to remove item"));
    }
  };

  // Clear cart handler
  const handleClearCart = async () => {
    if (!sessionId) return;

    // Store current state for potential revert
    const currentItems = [...items];
    const currentTotal = total;

    try {
      // Optimistic update
      dispatch(clearCartAction());

      // API call
      await clearCartMutation({ sessionId }).unwrap();
    } catch (error) {
      console.error("Clear cart failed:", error);
      // Revert optimistic update
      dispatch(setCart({ items: currentItems, total: currentTotal }));
      dispatch(setError("Failed to clear cart"));
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🛒 Shopping Cart</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading cart...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      {/* Cart Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          🛒 Shopping Cart
          {itemCount > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-sm px-2 py-1 rounded-full">
              {itemCount} items
            </span>
          )}
        </h2>

        {items.length > 0 && (
          <button
            onClick={handleClearCart}
            className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {/* Error Message */}
      {cart.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {cart.error}
        </div>
      )}

      {/* Empty Cart */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛒</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            Your cart is empty
          </h3>
          <p className="text-gray-600 mb-6">
            Add some products to get started!
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="space-y-4 mb-6">
            {items.map((item, index) => (
              <div
                key={`cart-item-${item.product._id}-${index}`} // ← key יחיד!
                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg"
              >
                {/* Product Image */}
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded-lg"
                />

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {item.product.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    SKU: {item.product.sku}
                  </p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${item.product.price}
                  </p>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.product._id, item.quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                    disabled={item.quantity <= 1}
                  >
                    −
                  </button>

                  <span className="w-12 text-center font-medium">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.product._id, item.quantity + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    +
                  </button>
                </div>

                {/* Item Total */}
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>

                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="text-red-600 hover:text-red-800 text-sm transition-colors mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-medium text-gray-900">Total:</span>
              <span className="text-2xl font-bold text-blue-600">
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate("/")}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Continue Shopping
              </button>

              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                onClick={() => alert("Checkout functionality coming soon!")}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </>
      )}

      {/* Debug Info (remove in production) */}
      {true && (
        <div className="mt-6 p-3 bg-gray-100 rounded text-xs">
          <strong>Debug Info:</strong>
          <br />
          Session ID: {sessionId}
          <br />
          Items: {items.length}
          <br />
          Loading: {isLoading ? "Yes" : "No"}
        </div>
      )}
    </div>
  );
};

export default Cart;
