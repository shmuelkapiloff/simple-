import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  selectCart,
  selectCartItems,
  selectCartTotal,
  selectCartItemCount,
  selectSessionId,
  initializeCart,
  clearCart as clearCartAction,
  setCart,
  setError,
} from "../app/cartSlice";
import { selectIsAuthenticated, requireAuth } from "../app/authSlice";
import {
  useGetCartQuery,
  useUpdateCartQuantityMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
  useGetAddressesQuery,
  Address,
  useCreateAddressMutation,
} from "../app/api";
import { useToast } from "./ToastProvider";

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const cart = useSelector(selectCart);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const itemCount = useSelector(selectCartItemCount);
  const sessionId = useSelector(selectSessionId);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);

  // RTK Query mutations
  const [updateQuantityMutation] = useUpdateCartQuantityMutation();
  const [removeFromCartMutation] = useRemoveFromCartMutation();
  const [clearCartMutation] = useClearCartMutation();
  const [createAddressMutation, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();

  // Load addresses if authenticated
  const {
    data: addresses = [],
    error: addressError,
    isLoading: isAddressesLoading,
  } = useGetAddressesQuery(undefined, {
    skip: !isAuthenticated,
  });

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
    skip: !sessionId || !isAuthenticated,
  });

  // Sync server cart to local state
  useEffect(() => {
    if (serverCart && sessionId) {
      if (import.meta.env.DEV) {
        console.log("📦 Syncing cart from server:", {
          itemsLength: serverCart.items?.length,
          items: serverCart.items,
          total: serverCart.total,
        });
      }
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

  // Auto-select default/first address when loaded
  useEffect(() => {
    if (addresses.length > 0) {
      // Try restore from localStorage first
      const savedId = localStorage.getItem("selectedAddressId");
      if (savedId) {
        const found = addresses.find((a) => a._id === savedId);
        if (found) {
          setSelectedAddress(found);
          return;
        }
      }
      // Fallback: default or first
      if (!selectedAddress) {
        const defaultAddr = addresses.find((a) => a.isDefault);
        setSelectedAddress(defaultAddr || addresses[0]);
      }
    }
  }, [addresses, selectedAddress]);

  // Update quantity handler
  const handleUpdateQuantity = async (
    productId: string,
    newQuantity: number
  ) => {
    if (!isAuthenticated) {
      dispatch(
        requireAuth({ view: "login", message: "התחבר כדי לעדכן את העגלה" })
      );
      return;
    }

    if (!sessionId) return;

    try {
      // API call - wait for server response
      await updateQuantityMutation({
        sessionId,
        productId,
        quantity: newQuantity,
      }).unwrap();

      // UI will update automatically via RTK Query cache invalidation
    } catch (error) {
      console.error("Update quantity failed:", error);
      dispatch(setError("Failed to update quantity"));
    }
  };

  // Remove item handler
  const handleRemoveItem = async (productId: string) => {
    if (!isAuthenticated) {
      dispatch(
        requireAuth({ view: "login", message: "התחבר כדי לנהל את העגלה" })
      );
      return;
    }

    if (!sessionId) return;

    try {
      // API call - wait for server response
      await removeFromCartMutation({
        sessionId,
        productId,
      }).unwrap();

      // UI will update automatically via RTK Query cache invalidation
    } catch (error) {
      console.error("Remove item failed:", error);
      dispatch(setError("Failed to remove item"));
    }
  };

  // Clear cart handler
  const handleClearCart = async () => {
    if (!isAuthenticated) {
      dispatch(
        requireAuth({ view: "login", message: "התחבר כדי לנהל את העגלה" })
      );
      return;
    }

    if (!sessionId) return;

    try {
      // API call - wait for server response
      await clearCartMutation({ sessionId }).unwrap();

      // Clear local state after server confirms
      dispatch(clearCartAction());
      addToast("העגלה נוקתה", "success");
    } catch (error) {
      console.error("Clear cart failed:", error);
      dispatch(setError("Failed to clear cart"));
      addToast("שגיאה בניקוי העגלה", "error");
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
            {items.map((item, index) => {
              // Skip items with null product data
              if (!item || !item.product) {
                return null;
              }
              return (
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
                    $
                    {(
                      (item.price ?? item.product.price) * item.quantity
                    ).toFixed(2)}
                  </p>

                  <button
                    onClick={() => handleRemoveItem(item.product._id)}
                    className="text-red-600 hover:text-red-800 text-sm transition-colors mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {/* Cart Summary */}
          <div className="border-t border-gray-200 pt-4">
            {/* Address Selection */}
            {isAuthenticated && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">
                  📍 כתובת למשלוח
                </h3>

                {addressError && (addressError as any).status === 401 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-red-700">
                      סשן ההתחברות פג תוקף. אנא התחבר מחדש כדי לטעון כתובות.
                    </p>
                    <button
                      onClick={() => navigate("/login")}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                    >
                      התחבר
                    </button>
                  </div>
                ) : selectedAddress ? (
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{selectedAddress.street}</p>
                      <p>
                        {selectedAddress.city}, {selectedAddress.state}{" "}
                        {selectedAddress.zipCode}
                      </p>
                      <p>{selectedAddress.country}</p>
                    </div>
                    <button
                      onClick={() => setShowAddressModal(true)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      שנה
                    </button>
                  </div>
                ) : isAddressesLoading ? (
                  <p className="text-sm text-gray-600">טוען כתובות...</p>
                ) : (
                  <button
                    onClick={() => setShowAddressModal(true)}
                    className="w-full px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                  >
                    ➕ בחר כתובת למשלוח
                  </button>
                )}
              </div>
            )}

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
                המשך קניות
              </button>

              <button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                onClick={() => {
                  navigate("/checkout");
                }}
                disabled={items.length === 0}
              >
                🛍️ המשך לתהליך הזמנה
              </button>
            </div>
          </div>
        </>
      )}

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                בחר כתובת למשלוח
              </h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="py-4">
                <p className="text-gray-700 mb-4">
                  אין כתובות שמורות. הוסף כתובת חדשה:
                </p>
                <AddressQuickForm
                  onCreate={async (payload) => {
                    try {
                      const created = await createAddressMutation(
                        payload
                      ).unwrap();
                      setSelectedAddress(created);
                      try {
                        localStorage.setItem("selectedAddressId", created._id);
                      } catch {}
                      setShowAddressModal(false);
                    } catch (e) {
                      console.error("Create address failed", e);
                      alert("שגיאה ביצירת כתובת. אנא נסה שוב.");
                    }
                  }}
                  isSubmitting={isCreatingAddress}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address._id}
                    onClick={() => {
                      setSelectedAddress(address);
                      try {
                        localStorage.setItem("selectedAddressId", address._id);
                      } catch {}
                      setShowAddressModal(false);
                    }}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedAddress?._id === address._id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                    }`}
                  >
                    {address.isDefault && (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                        ⭐ ברירת מחדל
                      </span>
                    )}
                    <p className="font-medium text-gray-900">
                      {address.street}
                    </p>
                    <p className="text-sm text-gray-600">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-sm text-gray-600">{address.country}</p>
                  </div>
                ))}
                <div className="mt-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    או הוסף כתובת חדשה
                  </h3>
                  <AddressQuickForm
                    onCreate={async (payload) => {
                      try {
                        const created = await createAddressMutation(
                          payload
                        ).unwrap();
                        setSelectedAddress(created);
                        try {
                          localStorage.setItem(
                            "selectedAddressId",
                            created._id
                          );
                        } catch {}
                        setShowAddressModal(false);
                      } catch (e) {
                        console.error("Create address failed", e);
                        alert("שגיאה ביצירת כתובת. אנא נסה שוב.");
                      }
                    }}
                    isSubmitting={isCreatingAddress}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
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

// Inline quick form component (simple, no external deps)
type AddressQuickPayload = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
};

const AddressQuickForm: React.FC<{
  onCreate: (p: AddressQuickPayload) => Promise<void> | void;
  isSubmitting?: boolean;
}> = ({ onCreate, isSubmitting }) => {
  const [form, setForm] = useState<AddressQuickPayload>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Israel",
    isDefault: false,
  });

  const disabled = !form.street || !form.city || !form.zipCode || !form.country;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          placeholder="רחוב"
          className="border rounded px-3 py-2"
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
        />
        <input
          placeholder="עיר"
          className="border rounded px-3 py-2"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          placeholder="מחוז/מדינה"
          className="border rounded px-3 py-2"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        />
        <input
          placeholder="מיקוד"
          className="border rounded px-3 py-2"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isDefault"
          type="checkbox"
          checked={!!form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
        />
        <label htmlFor="isDefault" className="text-sm text-gray-700">
          הגדר כברירת מחדל
        </label>
      </div>
      <div className="flex justify-end">
        <button
          disabled={disabled || isSubmitting}
          onClick={() => onCreate(form)}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {isSubmitting ? "שומר..." : "שמור כתובת"}
        </button>
      </div>
    </div>
  );
};
