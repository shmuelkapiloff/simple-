import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api } from "./api";
import cartReducer from "./cartSlice";
import authReducer from "./authSlice";

// 🎯 Redux Action Logger לדיבוג
const logger = (store: any) => (next: any) => (action: any) => {
  // רק אם אנחנו בפיתוח
  if (import.meta.env.MODE === "development") {
    console.group(`🔄 Redux Action: ${action.type}`);
    console.log("⬅️ Previous State:", store.getState());
    console.log("📤 Action:", action);
    const result = next(action);
    console.log("➡️ Next State:", store.getState());
    console.groupEnd();
    return result;
  }
  return next(action);
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
    getDefaultMiddleware().concat(api.middleware).concat(logger), // 🎯 הוסף logger
  devTools: import.meta.env.MODE !== "production" && {
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
if (import.meta.env.MODE === "development") {
  (window as any).__REDUX_STORE__ = store;
  console.log("🎯 Redux store available at window.__REDUX_STORE__");
}
