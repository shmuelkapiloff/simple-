import { Routes, Route, Link } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Spinner from "./components/Spinner";

// Lazy-loaded pages (code splitting for large/admin pages)
const Checkout = lazy(() => import("./pages/Checkout"));
const Orders = lazy(() => import("./pages/Orders"));
const Order = lazy(() => import("./pages/Order"));
const Profile = lazy(() => import("./pages/Profile"));
const Admin = lazy(() => import("./pages/Admin"));

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size="lg" />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/products/:id" element={<Product />} />
        <Route path="/cart" element={<Cart />} />

        {/* Protected - user */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <Checkout />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <Orders />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <Order />
              </Suspense>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Suspense fallback={<PageFallback />}>
                <Profile />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* Protected - admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <Suspense fallback={<PageFallback />}>
                <Admin />
              </Suspense>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="text-center py-20">
              <p className="text-6xl mb-4">404</p>
              <h1 className="text-2xl font-bold mb-2">העמוד לא נמצא</h1>
              <Link to="/" className="text-primary-600 hover:underline">
                חזרה לדף הבית
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
