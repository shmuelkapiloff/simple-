import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// Types
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

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
  sessionId?: string | null;
}

// Initial state
const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
  sessionId: undefined,
};
/**
 * Cart session handling (guest session ID)
 */
const CART_SESSION_KEY = "cart-session-id";

const generateSessionId = (): string => {
  const rand = Math.random().toString(36).slice(2, 10);
  const id = `sess_${Date.now()}_${rand}`;
  return id;
};

const getOrCreateSessionId = (): string => {
  let sessionId = localStorage.getItem(CART_SESSION_KEY);
  if (!sessionId) {
    sessionId = generateSessionId();
    localStorage.setItem(CART_SESSION_KEY, sessionId);
  }
  return sessionId;
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce((sum, item) => {
    // Use item.price if available, otherwise use product.price
    const price = item.price ?? item.product?.price ?? 0;
    return sum + price * item.quantity;
  }, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Cart Slice
export const cartSlice = createSlice({
  name: "cart",
  initialState: { ...initialState, sessionId: getOrCreateSessionId() },
  reducers: {
    // Initialize cart sessionId if missing
    initializeCart: (state) => {
      if (!state.sessionId) {
        state.sessionId = getOrCreateSessionId();
      } else {
        try {
          localStorage.setItem(CART_SESSION_KEY, state.sessionId);
        } catch {}
      }
    },
    // Set cart data (from API)
    setCart: (
      state,
      action: PayloadAction<{
        items: CartItem[];
        total: number;
        sessionId?: string;
      }>
    ) => {
      const { items, total } = action.payload;
      state.items = items;
      state.total = total;

      // Optionally update sessionId from server payload
      if (action.payload.sessionId) {
        state.sessionId = action.payload.sessionId;
      }

      const { itemCount } = calculateTotals(items);
      state.itemCount = itemCount;
      state.error = null;

      if (import.meta.env.DEV) {
        console.log("📥 Cart updated:", {
          itemCount,
          total,
          itemsLength: items.length,
        });
      }
    },

    // Add item optimistically (before API call)
    addItemOptimistic: (
      state,
      action: PayloadAction<{
        productId: string;
        quantity: number;
        product: any;
      }>
    ) => {
      const { productId, quantity, product } = action.payload;

      // Check if item already exists
      const existingItem = state.items.find(
        (item) => item.product._id === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({
          _id: `temp-${Date.now()}`,
          product: {
            _id: productId,
            name: product.name,
            price: product.price,
            image: product.image,
            sku: product.sku,
          },
          quantity,
          price: product.price,
        });
      }

      // Recalculate totals
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("➕ Item added optimistically:", {
        productId,
        quantity,
        itemCount,
      });
    },

    // Update quantity optimistically
    updateQuantityOptimistic: (
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) => {
      const { productId, quantity } = action.payload;

      if (quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.product._id !== productId
        );
      } else {
        const existingItem = state.items.find(
          (item) => item.product._id === productId
        );
        if (existingItem) {
          existingItem.quantity = quantity;
        }
      }

      // Recalculate totals
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("📝 Quantity updated optimistically:", {
        productId,
        quantity,
        itemCount,
      });
    },

    // Remove item optimistically
    removeItemOptimistic: (
      state,
      action: PayloadAction<{ productId: string }>
    ) => {
      const { productId } = action.payload;

      state.items = state.items.filter(
        (item) => item.product._id !== productId
      );

      // Recalculate totals
      const { total, itemCount } = calculateTotals(state.items);
      state.total = total;
      state.itemCount = itemCount;

      console.log("🗑️ Item removed optimistically:", { productId, itemCount });
    },

    // Clear cart
    clearCart: (state) => {
      state.items = [];
      state.total = 0;
      state.itemCount = 0;
      state.error = null;

      // 🧹 נקה גם sessionId מ-localStorage כשמנקים עגלה לגמרי
      if (state.sessionId) {
        localStorage.removeItem("cart-session-id");
        state.sessionId = null;
        console.log("🧹 Cart cleared and session ID removed from storage");
      }

      console.log("🧹 Cart cleared");
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Set error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Revert optimistic update (if API call fails)
    revertOptimisticUpdate: (
      state,
      action: PayloadAction<{ items: CartItem[]; total: number }>
    ) => {
      const { items, total } = action.payload;
      state.items = items;
      state.total = total;

      const { itemCount } = calculateTotals(items);
      state.itemCount = itemCount;

      console.log("↩️ Optimistic update reverted");
    },
  },
});

// Export actions
export const {
  initializeCart,
  setCart,
  addItemOptimistic,
  updateQuantityOptimistic,
  removeItemOptimistic,
  clearCart,
  setLoading,
  setError,
  revertOptimisticUpdate,
} = cartSlice.actions;

// Selectors
export const selectCart = (state: { cart: CartState }) => state.cart;
export const selectCartItems = (state: { cart: CartState }) => state.cart.items;
export const selectCartTotal = (state: { cart: CartState }) => state.cart.total;
export const selectCartItemCount = (state: { cart: CartState }) =>
  state.cart.itemCount;
export const selectCartLoading = (state: { cart: CartState }) =>
  state.cart.loading;
export const selectCartError = (state: { cart: CartState }) => state.cart.error;

// Helper selector to check if a product is in cart
export const selectIsInCart = (state: { cart: CartState }, productId: string) =>
  state.cart.items.some((item) => item.product._id === productId);

// Session ID selector
export const selectSessionId = (state: { cart: CartState }) =>
  state.cart.sessionId || null;

// Helper selector to get quantity of a product in cart
export const selectProductQuantity = (
  state: { cart: CartState },
  productId: string
) =>
  state.cart.items.find((item) => item.product._id === productId)?.quantity ||
  0;

export default cartSlice.reducer;
