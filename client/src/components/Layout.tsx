import { Outlet, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth, useCart, useAuthModal } from "../hooks";
import { useLogoutMutation } from "../api";
import AuthModal from "./AuthModal";

export default function Layout() {
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const authModal = useAuthModal();
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUserMenu(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== Navbar ===== */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-primary-600 flex items-center gap-2"
          >
            🛒 TechBasket
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 transition"
            >
              מוצרים
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className="text-gray-600 hover:text-primary-600 transition"
              >
                ניהול
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="relative text-gray-600 hover:text-primary-600 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition"
                >
                  <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden lg:inline">{user?.name}</span>
                </button>
                {userMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenu(false)}
                    />
                    <div className="absolute left-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border z-50 py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserMenu(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        פרופיל
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserMenu(false)}
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        הזמנות
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-right px-4 py-2 text-red-600 hover:bg-red-50"
                      >
                        התנתקות
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => authModal.openLogin()}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                התחברות
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center gap-3">
            <Link to="/cart" className="relative text-gray-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
                />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-2 -left-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t bg-white px-4 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="block py-2 text-gray-700"
            >
              מוצרים
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-gray-700"
                >
                  פרופיל
                </Link>
                <Link
                  to="/orders"
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-gray-700"
                >
                  הזמנות
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2 text-gray-700"
                  >
                    ניהול
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block py-2 text-red-600"
                >
                  התנתקות
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  authModal.openLogin();
                }}
                className="block py-2 text-primary-600 font-medium"
              >
                התחברות
              </button>
            )}
          </div>
        )}
      </nav>

      {/* ===== Content ===== */}
      <main className="flex-1">
        <Outlet context={authModal} />
      </main>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t mt-auto py-6 text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} TechBasket — כל הזכויות שמורות
      </footer>

      {/* ===== Auth Modal ===== */}
      <AuthModal {...authModal} />
    </div>
  );
}
