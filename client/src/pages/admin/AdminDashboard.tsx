import React, { useMemo } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import AdminSidebar from "../../components/admin/AdminSidebar";

/**
 * AdminDashboard - ערכת ראשית לדף מינהל
 * בדיקת הרשאות, ניווט צדדי, והצגת דפי משנה
 */
const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  // בדיקת תפקיד ממנהל
  const isAdmin = useMemo(() => user && (user as any).role === "admin", [user]);

  // ריתוק אם לא מנהל
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔒 גישה נדחית
          </h1>
          <p className="text-gray-600 mb-6">
            אתה חייב להיות מנהל כדי לגשת לדף זה
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            חזור לעמוד הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* סיידבר ניווט */}
      <AdminSidebar />

      {/* קונטנט ראשי */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">🏢 מרכז ניהול</h1>
            <p className="text-sm text-gray-600 mt-1">
              ברוכים הבאים, {user?.name}
            </p>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
