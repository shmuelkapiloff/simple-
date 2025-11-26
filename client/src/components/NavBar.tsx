import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  logout,
  verifyToken,
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
} from "../app/authSlice";
import { selectCartItemCount } from "../app/cartSlice";
import { AuthModal } from "./AuthModal";
import type { AppDispatch, RootState } from "../app/store";

export const NavBar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => selectUser(state));
  const isAuthenticated = useSelector((state: RootState) =>
    selectIsAuthenticated(state)
  );
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const cartItemCount = useSelector((state: RootState) =>
    selectCartItemCount(state)
  );

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "register">(
    "login"
  );
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Verify token on app startup
  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("🔍 NavBar Debug:", {
      token: token ? "exists" : "missing",
      tokenValue: token ? token.substring(0, 20) + "..." : "none",
      isAuthenticated,
      isLoading,
      user: user?.name || "no user",
      userObject: user,
    });

    if (token && !isAuthenticated && !isLoading) {
      console.log("🚀 Dispatching verifyToken...");
      dispatch(verifyToken());
    }
  }, [dispatch, isAuthenticated, isLoading, user]); // Added user to dependencies

  const handleLogin = () => {
    setAuthModalView("login");
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthModalView("register");
    setIsAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      setShowUserMenu(false);
      console.log("✅ Logged out successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
    }
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserMenu) {
        const target = event.target as Element;
        if (!target.closest(".user-menu-container")) {
          setShowUserMenu(false);
        }
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  return (
    <>
      <nav className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Debug Info */}
          {process.env.NODE_ENV === "development" && (
            <div className="bg-blue-50 border-b border-blue-200 px-4 py-1">
              <p className="text-blue-800 text-xs text-center">
                � <strong>Debug:</strong> isAuthenticated:{" "}
                {isAuthenticated ? "YES" : "NO"} | User: {user?.name || "NONE"}{" "}
                | Loading: {isLoading ? "YES" : "NO"}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center h-16">
            {/* Logo/Brand */}
            <div className="flex-shrink-0">
              <Link
                to="/"
                className="text-2xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
              >
                🛍️ Simple Shop
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-8">
              <Link
                to="/"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                📦 מוצרים
              </Link>
              <Link
                to="/cart"
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                🛒 עגלה
              </Link>
            </nav>

            {/* Navigation Menu */}
            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:block">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-64 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cart Icon */}
              <Link
                to="/cart"
                className="relative p-2 text-gray-600 hover:text-gray-900 rounded-md"
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
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.68 4.32M7 13h10M9 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z"
                  />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </Link>

              {/* Authentication Section */}
              {isAuthenticated && user ? (
                /* User Menu */
                <div className="relative user-menu-container">
                  <button
                    onClick={toggleUserMenu}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 p-2 rounded-md"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:block font-medium">
                      {user.name}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform ${
                        showUserMenu ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/profile");
                        }}
                      >
                        👤 הפרופיל שלי
                      </button>

                      <button
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate("/orders");
                        }}
                      >
                        📦 ההזמנות שלי
                      </button>

                      <hr className="my-1" />

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        🚪 התנתק
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Login/Register Buttons */
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLogin}
                    disabled={isLoading}
                    className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    התחבר
                  </button>

                  <button
                    onClick={handleRegister}
                    disabled={isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    הירשם
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialView={authModalView}
      />
    </>
  );
};
