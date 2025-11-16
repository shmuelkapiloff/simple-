import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import ProductList from "./components/ProductList";
import Cart from "./components/Cart";
import { NavBar } from "./components/NavBar";
import { DebugPanel } from "./components/DebugPanel";
import { verifyToken } from "./app/authSlice";
import type { AppDispatch } from "./app/store";

function App() {
  const dispatch = useDispatch<AppDispatch>();

  // Auto-verify token on app startup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(verifyToken());
    }
  }, [dispatch]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar with Authentication */}
      <NavBar />

      <main>
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/cart" element={<Cart />} />
        </Routes>
      </main>

      {/* 🔧 Debug Panel - רק בפיתוח */}
      <DebugPanel />
    </div>
  );
}

export default App;
