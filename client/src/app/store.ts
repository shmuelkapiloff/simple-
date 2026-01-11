import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./api";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";

// 🎯 Redux Action Logger (dev-only, opt-in by env)
const isDev = import.meta.env.DEV;
const enableReduxLogger = isDev && import.meta.env.VITE_REDUX_LOGGER === "1";
const actionWhitelist = (import.meta.env.VITE_REDUX_LOGGER_WHITELIST || "")
  .split(",")
  .map((s: string) => s.trim())
  .filter(Boolean); // e.g. "cart/,auth/"

const logger = (store: any) => (next: any) => (action: any) => {
  if (!enableReduxLogger) return next(action);

  // Optional: log only whitelisted prefixes if provided
  if (
    actionWhitelist.length > 0 &&
    !actionWhitelist.some((p: string) => action.type.startsWith(p))
  ) {
    return next(action);
  }

  console.groupCollapsed(`🔄 Redux Action: ${action.type}`);
  console.log("⬅️ Previous State:", store.getState());
  console.log("📤 Action:", action);
  const result = next(action);
  console.log("➡️ Next State:", store.getState());
  console.groupEnd();
  return result;
};

export const store = configureStore({
  reducer: {
    // RTK Query reducer
    [api.reducerPath]: api.reducer,
    // Cart reducer
    cart: cartReducer,
    // Auth reducer
    auth: authReducer,
  },
  // הוספת RTK Query middleware + Logger
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware).concat(logger),
  devTools: isDev && {
    trace: true,
    traceLimit: 25,
    actionSanitizer: (action: any) => {
      // הסתר נתונים רגישים במקרה הצורך
      if (action.type.includes("auth")) {
        return { ...action, payload: "***HIDDEN***" };
      }
      return action;
    },
  },
});

// הפעלת refetchOnFocus/refetchOnReconnect עבור RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// 🎯 יצוא Store לדיבוג בקונסול
if (isDev && enableReduxLogger) {
  (window as any).__REDUX_STORE__ = store;
  console.log("🎯 Redux store available at window.__REDUX_STORE__");
}
