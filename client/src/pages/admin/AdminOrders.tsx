import React, { useState } from "react";
import {
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  Order,
} from "../../app/api";
import { useToast } from "../../components/ToastProvider";
import OrderStatusForm from "../../components/admin/OrderStatusForm";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

/**
 * AdminOrders - ניהול הזמנות ועדכון סטטוס
 */
const AdminOrders: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const {
    data: orders,
    isLoading,
    error,
  } = useGetAdminOrdersQuery(
    statusFilter !== "all" ? { status: statusFilter } : undefined
  );
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateOrderStatusMutation();
  const { addToast } = useToast();

  const statusOptions: { value: OrderStatus; label: string; icon: string }[] = [
    { value: "pending", label: "ממתין", icon: "⏳" },
    { value: "processing", label: "בעיבוד", icon: "🔄" },
    { value: "shipped", label: "שוגר", icon: "🚚" },
    { value: "delivered", label: "הושלם", icon: "✅" },
    { value: "cancelled", label: "בוטל", icon: "❌" },
  ];

  const handleUpdateStatus = async (status: OrderStatus, message?: string) => {
    if (!selectedOrder) return;
    try {
      await updateStatus({
        orderId: selectedOrder._id,
        status,
        message,
      }).unwrap();
      addToast("✅ הזמנה עודכנה בהצלחה", "success");
      setIsFormOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      addToast("❌ שגיאה בעת עדכון הזמנה", "error");
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
        <p className="font-semibold">❌ שגיאה בטעינת הזמנות</p>
      </div>
    );
  }

  // Ensure orders is always an array
  const orderList = Array.isArray(orders) ? orders : [];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          🧾 ניהול הזמנות
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            🔄 הכל ({orderList.length || 0})
          </button>
          {statusOptions.map((option) => {
            const count =
              orderList.filter((o) => o.status === option.value).length || 0;
            return (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  statusFilter === option.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {option.icon} {option.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                מספר הזמנה
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                לקוח
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                סה"כ
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                פריטים
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                סטטוס
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                תאריך
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                פעולות
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orderList.map((order) => {
              const statusOption = statusOptions.find(
                (s) => s.value === order.status
              );
              return (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    #{order.orderNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {order.user?.email || "אדמין"}
                  </td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-900">
                    ₪{order.total}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-700">
                    {order.items.length}{" "}
                    {order.items.length === 1 ? "פריט" : "פריטים"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-block px-3 py-1 rounded text-sm font-semibold bg-blue-100 text-blue-800">
                      {statusOption?.icon} {statusOption?.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("he-IL")}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setIsFormOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
                    >
                      📝 עדכן סטטוס
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!orderList ||
          (orderList.length === 0 && (
            <div className="text-center py-12 text-gray-600">
              <p className="text-lg">📭 אין הזמנות</p>
            </div>
          ))}
      </div>

      {/* Status Update Form Modal */}
      {isFormOpen && selectedOrder && (
        <OrderStatusForm
          order={selectedOrder}
          onSubmit={handleUpdateStatus}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedOrder(null);
          }}
          isLoading={isUpdating}
          statusOptions={statusOptions}
        />
      )}
    </div>
  );
};

export default AdminOrders;
