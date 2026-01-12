import React from "react";
import { useGetAdminStatsSummaryQuery } from "../../app/api";

/**
 * AdminStats - דשבורד סטטיסטיקה עם כרטיסי סיכום
 */
const AdminStats: React.FC = () => {
  const { data: stats, isLoading, error } = useGetAdminStatsSummaryQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <p className="font-semibold mb-2">❌ שגיאה בטעינת סטטיסטיקה</p>
        <p className="text-sm">נסה לרענן את הדף או בדוק את החיבור</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'סה"כ מכירות',
      value: `₪${stats?.totalSales || 0}`,
      icon: "💰",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      title: 'סה"כ הזמנות',
      value: stats?.totalOrders || 0,
      icon: "🧾",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      title: "הזמנות ממתינות",
      value: stats?.pendingOrders || 0,
      icon: "⏳",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
    },
    {
      title: "מוצרים במלאי נמוך",
      value: stats?.lowStockProducts || 0,
      icon: "📦",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
    },
    {
      title: 'סה"כ משתמשים',
      value: stats?.totalUsers || 0,
      icon: "👥",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 סטטיסטיקה</h2>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.bgColor} border ${card.borderColor} rounded-lg shadow-sm p-6 hover:shadow-md transition`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">
                  {card.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </div>
              <span className="text-4xl">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🚀 פעולות מהירות
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/admin/products"
            className="block p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-blue-700 font-semibold"
          >
            ➕ הוסף מוצר חדש
          </a>
          <a
            href="/admin/orders"
            className="block p-4 border-2 border-orange-200 rounded-lg hover:bg-orange-50 transition text-orange-700 font-semibold"
          >
            📦 ניהול הזמנות
          </a>
          <a
            href="/admin/products"
            className="block p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition text-red-700 font-semibold"
          >
            ⚠️ מוצרים במלאי נמוך
          </a>
          <a
            href="/admin/users"
            className="block p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition text-purple-700 font-semibold"
          >
            👥 ניהול משתמשים
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;
