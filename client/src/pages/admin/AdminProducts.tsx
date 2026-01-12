import React, { useState } from "react";
import {
  useGetAdminProductsQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
  Product,
} from "../../app/api";
import { useToast } from "../../components/ToastProvider";
import ProductForm from "../../components/admin/ProductForm";

/**
 * AdminProducts - ניהול מוצרים (create, read, update, delete)
 */
const AdminProducts: React.FC = () => {
  const [showInactive, setShowInactive] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    data: products,
    isLoading,
    error,
  } = useGetAdminProductsQuery({ includeInactive: showInactive });
  const [createProduct, { isLoading: isCreating }] =
    useCreateAdminProductMutation();
  const [updateProduct, { isLoading: isUpdating }] =
    useUpdateAdminProductMutation();
  const [deleteProduct, { isLoading: isDeleting }] =
    useDeleteAdminProductMutation();
  const { addToast } = useToast();

  const handleCreate = async (data: any) => {
    try {
      await createProduct(data).unwrap();
      addToast("✅ מוצר נוצר בהצלחה", "success");
      setIsFormOpen(false);
    } catch (err) {
      addToast("❌ שגיאה בעת יצירת מוצר", "error");
    }
  };

  const handleUpdate = async (data: any) => {
    if (!editingProduct) return;
    try {
      await updateProduct({
        productId: editingProduct._id,
        body: data,
      }).unwrap();
      addToast("✅ מוצר עודכן בהצלחה", "success");
      setEditingProduct(null);
      setIsFormOpen(false);
    } catch (err) {
      addToast("❌ שגיאה בעת עדכון מוצר", "error");
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId).unwrap();
      addToast("✅ מוצר הושבת בהצלחה", "success");
      setDeleteConfirmId(null);
    } catch (err) {
      addToast("❌ שגיאה בעת השבתת מוצר", "error");
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

  // Ensure products is always an array
  const productList = Array.isArray(products) ? products : [];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-800">
        <p className="font-semibold">❌ שגיאה בטעינת מוצרים</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">📦 ניהול מוצרים</h2>
        <button
          onClick={() => {
            setEditingProduct(null);
            setIsFormOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          ➕ מוצר חדש
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm text-gray-700">הצג לא פעילים</span>
        </label>
        <span className="text-sm text-gray-600">
          סה"כ: {productList.length || 0} מוצרים
        </span>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                שם המוצר
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                קטגוריה
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                מחיר
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                מלאי
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                סטטוס
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {productList.map((product) => (
              <tr key={product._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {product.category}
                </td>
                <td className="px-6 py-4 text-center font-semibold text-gray-900">
                  ₪{product.price}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      product.stock > 10
                        ? "bg-green-100 text-green-800"
                        : product.stock > 0
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      product.isActive
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {product.isActive ? "🟢 פעיל" : "⚫ לא פעיל"}
                  </span>
                </td>
                <td className="px-6 py-4 text-center space-x-2">
                  <button
                    onClick={() => {
                      setEditingProduct(product);
                      setIsFormOpen(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                  >
                    ✏️ עריכה
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(product._id)}
                    className="text-red-600 hover:text-red-800 font-semibold text-sm"
                  >
                    🗑️ מחק
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Product Form Modal */}
      {isFormOpen && (
        <ProductForm
          product={editingProduct}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          onClose={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
          }}
          isLoading={isCreating || isUpdating}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ⚠️ אישור מחיקה
            </h3>
            <p className="text-gray-600 mb-6">
              האם אתה בטוח? מוצר זה יושבת (לא יוחזק לתמיד)
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 transition font-semibold"
              >
                ביטול
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold disabled:opacity-50"
              >
                {isDeleting ? "🔄 מחק..." : "🗑️ מחק"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
