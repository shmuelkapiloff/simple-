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
  sessionId: string | null;
  items: CartItem[];
  total: number;
  itemCount: number;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: CartState = {
  sessionId: null,
  items: [],
  total: 0,
  itemCount: 0,
  loading: false,
  error: null,
};

// Helper functions
const generateSessionId = (): string => {
  // 🔍 נסה לטעון sessionId קיים מ-localStorage
  const existingSessionId = localStorage.getItem('cart-session-id');
  
  if (existingSessionId) {
    console.log('🔄 Using existing session ID:', existingSessionId);
    return existingSessionId;
  }
  
  // 🆕 צור sessionId חדש
  const newSessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // 💾 שמור ב-localStorage לעתיד
  localStorage.setItem('cart-session-id', newSessionId);
  console.log('🆕 Created new session ID:', newSessionId);
  
  return newSessionId;
};

const calculateTotals = (items: CartItem[]) => {
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  return { total, itemCount };
};

// Cart Slice
export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    // Initialize cart with session ID
    initializeCart: (state) => {
      if (!state.sessionId) {
        state.sessionId = generateSessionId();
        console.log("🆕 Cart initialized with sessionId:", state.sessionId);
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
      const { items, total, sessionId } = action.payload;
      state.items = items;
      state.total = total;
      if (sessionId) state.sessionId = sessionId;

      const { itemCount } = calculateTotals(items);
      state.itemCount = itemCount;
      state.error = null;

      console.log("📥 Cart set:", { itemCount, total, sessionId });
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
        localStorage.removeItem('cart-session-id');
        console.log('🧹 Cart cleared and session ID removed from storage');
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
    
    // 🔧 Debug function - מחק sessionId מ-localStorage (לטסטים)
    resetSessionId: (state) => {
      localStorage.removeItem('cart-session-id');
      state.sessionId = null;
      console.log("🔧 Session ID reset - next initializeCart will create new one");
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
  resetSessionId,
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
export const selectSessionId = (state: { cart: CartState }) =>
  state.cart.sessionId;

// Helper selector to check if a product is in cart
export const selectIsInCart = (state: { cart: CartState }, productId: string) =>
  state.cart.items.some((item) => item.product._id === productId);

// Helper selector to get quantity of a product in cart
export const selectProductQuantity = (
  state: { cart: CartState },
  productId: string
) =>
  state.cart.items.find((item) => item.product._id === productId)?.quantity ||
  0;

export default cartSlice.reducer;
