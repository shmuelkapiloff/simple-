import React, { useState } from "react";
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  Address,
} from "../app/api";

interface AddressManagerProps {
  onSelectAddress?: (address: Address) => void;
  mode?: "view" | "select";
}

export const AddressManager: React.FC<AddressManagerProps> = ({
  onSelectAddress,
  mode = "view",
}) => {
  const { data: addresses = [], isLoading, error } = useGetAddressesQuery();
  const [createAddress] = useCreateAddressMutation();
  const [updateAddress] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Israel",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await updateAddress({ addressId: editingId, ...formData }).unwrap();
        setEditingId(null);
      } else {
        await createAddress(formData).unwrap();
        setIsAddingNew(false);
      }

      // Reset form
      setFormData({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Israel",
      });
    } catch (error: any) {
      console.error("Failed to save address:", error);
      alert(error?.data?.message || "שגיאה בשמירת הכתובת");
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address._id);
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
    });
    setIsAddingNew(true);
  };

  const handleDelete = async (addressId: string) => {
    if (!window.confirm("האם אתה בטוח שברצונך למחוק כתובת זו?")) return;

    try {
      await deleteAddress({ addressId }).unwrap();
    } catch (error: any) {
      console.error("Failed to delete address:", error);
      alert(error?.data?.message || "שגיאה במחיקת הכתובת");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      await setDefaultAddress({ addressId }).unwrap();
    } catch (error: any) {
      console.error("Failed to set default address:", error);
      alert(error?.data?.message || "שגיאה בהגדרת כתובת ברירת מחדל");
    }
  };

  const handleCancel = () => {
    setIsAddingNew(false);
    setEditingId(null);
    setFormData({
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "Israel",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="p-4 border rounded-lg bg-gray-50 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        שגיאה בטעינת כתובות
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">📍 הכתובות שלי</h2>
        {!isAddingNew && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            ➕ הוסף כתובת חדשה
          </button>
        )}
      </header>

      {/* Add/Edit Form */}
      {isAddingNew && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingId ? "ערוך כתובת" : "כתובת חדשה"}
          </h3>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
            aria-label={editingId ? "ערוך כתובת" : "הוסף כתובת חדשה"}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                רחוב ומספר בית
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) =>
                  setFormData({ ...formData, street: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                placeholder="רחוב הרצל 123"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  עיר
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="תל אביב"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מדינה/אזור
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="מרכז"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מיקוד
                </label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  מדינה
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  placeholder="ישראל"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                💾 שמור
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-md transition-colors"
              >
                ❌ ביטול
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Address List */}
      {addresses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-6xl mb-4">📍</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            אין כתובות שמורות
          </h3>
          <p className="text-gray-600 mb-4">הוסף כתובת חדשה כדי להתחיל</p>
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              ➕ הוסף כתובת
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div
              key={address._id}
              className={`border rounded-lg p-4 transition-all ${
                address.isDefault
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              } ${
                mode === "select"
                  ? "cursor-pointer hover:border-blue-400 hover:shadow-md"
                  : ""
              }`}
              onClick={() => {
                if (mode === "select" && onSelectAddress) {
                  onSelectAddress(address);
                }
              }}
            >
              {/* Default Badge */}
              {address.isDefault && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    ⭐ ברירת מחדל
                  </span>
                </div>
              )}

              {/* Address Details */}
              <div className="text-gray-900">
                <p className="font-medium">{address.street}</p>
                <p className="text-sm text-gray-600">
                  {address.city}, {address.state} {address.zipCode}
                </p>
                <p className="text-sm text-gray-600">{address.country}</p>
              </div>

              {/* Actions */}
              {mode === "view" && (
                <div className="mt-4 flex gap-2">
                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address._id)}
                      className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                    >
                      ⭐ הגדר כברירת מחדל
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(address)}
                    className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
                  >
                    ✏️ ערוך
                  </button>
                  <button
                    onClick={() => handleDelete(address._id)}
                    className="text-xs px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                  >
                    🗑️ מחק
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AddressManager;
