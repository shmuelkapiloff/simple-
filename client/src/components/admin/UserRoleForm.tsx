import React, { useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface UserRoleFormProps {
  user: User;
  onSubmit: (newRole: "user" | "admin") => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const UserRoleForm: React.FC<UserRoleFormProps> = ({
  user,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<"user" | "admin">(user.role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🔧 שינוי תפקיד
        </h2>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">משתמש</p>
          <p className="font-semibold text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-600">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              תפקיד חדש
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "user" as const,
                  label: "משתמש רגיל",
                  icon: "👤",
                  description: "גישה בסיסית לחנות",
                },
                {
                  value: "admin" as const,
                  label: "מנהל",
                  icon: "👑",
                  description: "גישה מלאה למרכז ניהול",
                },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedRole(option.value)}
                  className={`w-full p-4 rounded-lg border-2 text-left transition ${
                    selectedRole === option.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {option.icon} {option.label}
                      </p>
                      <p className="text-xs text-gray-600">
                        {option.description}
                      </p>
                    </div>
                    {selectedRole === option.value && (
                      <span className="text-lg">✅</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          {selectedRole === "admin" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>זהירות:</strong> מנהלים יכולים ליצור, לערוך ולמחוק
                מוצרים וניהול הזמנות
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === user.role}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {isLoading ? "🔄 עדכון..." : "💾 שמור"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRoleForm;
