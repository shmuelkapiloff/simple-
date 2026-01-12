import React, { useState } from "react";
import { useSelector } from "react-redux";
import {
  selectUser,
  selectAuthLoading,
  selectAuthError,
} from "../app/authSlice";
import AddressManager from "../components/AddressManager";
import ChangePasswordModal from "../components/ChangePasswordModal";
import type { RootState } from "../app/store";

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => selectUser(state));
  const isLoading = useSelector((state: RootState) => selectAuthLoading(state));
  const error = useSelector((state: RootState) => selectAuthError(state));

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "addresses">(
    "profile"
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔐 נדרשת התחברות
          </h2>
          <p className="text-gray-600">אנא התחבר כדי לצפות בפרופיל שלך.</p>
        </div>
      </div>
    );
  }

  const handleEditToggle = () => {
    if (isEditing) {
      // TODO: בעתיד נוסיף API call לעדכון הפרופיל
      console.log("🔧 TODO: Update profile with:", formData);
      // For now, just toggle editing mode
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = () => {
    setIsPasswordModalOpen(true);
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "האם אתה בטוח שברצונך למחוק את החשבון? פעולה זו בלתי הפיכה."
      )
    ) {
      // TODO: בעתיד נוסיף API call למחיקת חשבון
      console.log("🔧 TODO: Delete account API call");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-2xl">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  👤 הפרופיל שלי
                </h1>
                <p className="text-gray-600">
                  ניהול פרטים אישיים והגדרות חשבון
                </p>
              </div>
            </div>
            <button
              onClick={handleEditToggle}
              disabled={isLoading}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isEditing
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } disabled:opacity-50`}
            >
              {isEditing ? "💾 שמור שינויים" : "✏️ ערוך פרטים"}
            </button>
          </div>
        </header>

        {/* Tabs */}
        <nav
          aria-label="קטגוריות פרופיל"
          className="bg-white rounded-lg shadow-sm mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📋 פרטים אישיים
              </button>
              <button
                onClick={() => setActiveTab("addresses")}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "addresses"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                📍 כתובות
              </button>
            </nav>
          </div>
        </nav>

        {activeTab === "addresses" ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <AddressManager mode="view" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Info */}
            {/* Main Profile Info */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  📋 פרטים אישיים
                </h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
                    ❌ {error}
                  </div>
                )}

                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      שם מלא
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="הזן את שמך המלא"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-2">
                        {user.name}
                      </p>
                    )}
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      כתובת אימייל
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="הזן את כתובת האימייל שלך"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium py-2">
                        {user.email}
                      </p>
                    )}
                  </div>

                  {/* Member Since */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      חבר מאז
                    </label>
                    <p className="text-gray-900 py-2">
                      📅 {new Date(user.createdAt).toLocaleDateString("he-IL")}
                    </p>
                  </div>

                  {/* Last Login */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      התחברות אחרונה
                    </label>
                    <p className="text-gray-900 py-2">
                      🕐{" "}
                      {user.updatedAt
                        ? new Date(user.updatedAt).toLocaleString("he-IL")
                        : "לא זמין"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Actions */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  ⚙️ פעולות חשבון
                </h3>

                <div className="space-y-3">
                  <button
                    onClick={handlePasswordChange}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    🔑 שינוי סיסמה
                  </button>

                  <button
                    onClick={() => console.log("🔧 TODO: Download user data")}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    📥 הורדת נתונים אישיים
                  </button>

                  <button
                    onClick={() => console.log("🔧 TODO: Privacy settings")}
                    className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    🔒 הגדרות פרטיות
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📊 סטטיסטיקות
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">הזמנות בוצעו</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">סך כל הוצאות</span>
                    <span className="font-semibold text-gray-900">₪0</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">מוצרים בעגלה</span>
                    <span className="font-semibold text-gray-900">-</span>
                  </div>
                </div>

                <p className="text-xs text-gray-500 mt-4">
                  💡 הנתונים יתעדכנו כשנוסיף את מערכת ההזמנות
                </p>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">
                  ⚠️ אזור סכנה
                </h3>

                <p className="text-sm text-red-700 mb-4">
                  מחיקת החשבון תסיר את כל הנתונים שלך לצמיתות.
                </p>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  🗑️ מחק חשבון
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </main>
  );
};

export default Profile;
