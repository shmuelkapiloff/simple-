import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import { NavBar } from "./components/NavBar";
import { ToastProvider } from "./components/ToastProvider";
import { DebugPanel } from "./components/DebugPanel";
import Profile from "./pages/Profile";
import Orders from "./pages/Orders";
import TrackOrder from "./pages/TrackOrder";
import Checkout from "./pages/Checkout";
import { verifyToken } from "./app/authSlice";
import type { AppDispatch } from "./app/store";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  // Auto-verify token on app startup

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar with Authentication */}
        <NavBar />

        <main>
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/track/:orderId" element={<TrackOrder />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>

        {/* 🔧 Debug Panel - רק בפיתוח */}
        <DebugPanel />
      </div>
    </ToastProvider>
  );
}

export default App;
