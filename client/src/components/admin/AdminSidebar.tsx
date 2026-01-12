import React from "react";
import { Link, useLocation } from "react-router-dom";

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const AdminSidebar: React.FC = () => {
  const location = useLocation();

  const navItems: NavItem[] = [
    { label: "סטטיסטיקה", path: "/admin/stats", icon: "📊" },
    { label: "מוצרים", path: "/admin/products", icon: "📦" },
    { label: "הזמנות", path: "/admin/orders", icon: "🧾" },
    { label: "משתמשים", path: "/admin/users", icon: "👥" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-gray-900 text-white shadow-lg">
      {/* Logo/Title */}
      <div className="px-6 py-4 border-b border-gray-700">
        <Link
          to="/"
          className="text-2xl font-bold hover:text-gray-300 transition"
        >
          🛍️ Simple Shop
        </Link>
        <p className="text-xs text-gray-400 mt-1">מרכז ניהול</p>
      </div>

      {/* Navigation */}
      <nav className="py-6 px-3 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition ${
              isActive(item.path)
                ? "bg-blue-600 text-white font-semibold shadow-md"
                : "text-gray-300 hover:bg-gray-800"
            }`}
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Links */}
      <div className="absolute bottom-0 w-64 px-3 pb-6 space-y-2 border-t border-gray-700 pt-6">
        <Link
          to="/"
          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition text-sm"
        >
          <span className="mr-2">🏠</span> חזור לחנות
        </Link>
        <Link
          to="/profile"
          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition text-sm"
        >
          <span className="mr-2">👤</span> הפרופיל שלי
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
