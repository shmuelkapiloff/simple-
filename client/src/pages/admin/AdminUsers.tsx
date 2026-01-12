import React, { useState } from "react";
import {
  useGetAdminUsersQuery,
  useUpdateUserRoleMutation,
} from "../../app/api";
import { useToast } from "../../components/ToastProvider";
import UserRoleForm from "../../components/admin/UserRoleForm";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
}

/**
 * AdminUsers - ניהול משתמשים והקצאת תפקידים
 */
const AdminUsers: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: response,
    isLoading,
    error,
  } = useGetAdminUsersQuery({
    page,
    limit: 20,
  });
  const [updateRole, { isLoading: isUpdating }] = useUpdateUserRoleMutation();
  const { addToast } = useToast();

  const users = (response?.users || []) as User[];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / 20);

  const handleUpdateRole = async (newRole: "user" | "admin") => {
    if (!selectedUser) return;
    try {
      await updateRole({
        userId: selectedUser._id,
        role: newRole,
      }).unwrap();
      addToast(
        `✅ תפקיד המשתמש עודכן ל${newRole === "admin" ? "מנהל" : "משתמש"}`,
        "success"
      );
      setIsFormOpen(false);
      setSelectedUser(null);
    } catch (err) {
      addToast("❌ שגיאה בעת עדכון תפקיד", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg h-16 animate-pulse shadow"
          ></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <p className="font-semibold">❌ שגיאה בטעינת משתמשים</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          👥 ניהול משתמשים
        </h2>
        <p className="text-gray-600">
          סה"כ {total} משתמשים | דף {page} מתוך {totalPages}
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                שם
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                דוא"ל
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                תפקיד
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                הצטרף
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {user.email}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      user.role === "admin"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {user.role === "admin" ? "👑 מנהל" : "👤 משתמש"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString("he-IL")}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsFormOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                  >
                    🔧 שנה תפקיד
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p className="text-lg">👥 אין משתמשים</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 font-semibold"
          >
            ⬅️ הקודם
          </button>
          <span className="px-4 py-2 text-gray-700 font-semibold">
            דף {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition disabled:opacity-50 font-semibold"
          >
            הבא ➡️
          </button>
        </div>
      )}

      {/* Role Change Form Modal */}
      {isFormOpen && selectedUser && (
        <UserRoleForm
          user={selectedUser}
          onSubmit={handleUpdateRole}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedUser(null);
          }}
          isLoading={isUpdating}
        />
      )}
    </div>
  );
};

export default AdminUsers;
