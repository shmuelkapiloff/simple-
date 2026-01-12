import React, { useState } from "react";
import { Order } from "../../app/api";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderStatusFormProps {
  order: Order;
  statusOptions: { value: OrderStatus; label: string; icon: string }[];
  onSubmit: (status: OrderStatus, message?: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

const OrderStatusForm: React.FC<OrderStatusFormProps> = ({
  order,
  statusOptions,
  onSubmit,
  onClose,
  isLoading = false,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(
    order.status as OrderStatus
  );
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(selectedStatus, message || undefined);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          📝 עדכון הזמנה #{order.orderNumber}
        </h2>

        {/* Order Details Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">לקוח</p>
              <p className="font-semibold text-gray-900">
                {order.user?.email || "אדמין"}
              </p>
            </div>
            <div>
              <p className="text-gray-600">סה"כ</p>
              <p className="font-semibold text-gray-900">₪{order.total}</p>
            </div>
            <div>
              <p className="text-gray-600">פריטים</p>
              <p className="font-semibold text-gray-900">
                {order.items.length}
              </p>
            </div>
            <div>
              <p className="text-gray-600">סטטוס נוכחי</p>
              <p className="font-semibold text-gray-900">{order.status}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              סטטוס חדש
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  className={`p-3 rounded-lg border-2 font-semibold text-sm transition ${
                    selectedStatus === option.value
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              הערה (אופציונלי)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder='לדוגמה: "שוגר עם DHL" או "קיבלנו משוב מהלקוח"'
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Items List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">
              פריטים בהזמנה:
            </h3>
            <ul className="space-y-1 text-sm text-gray-700">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>{item.product.name}</span>
                  <span className="text-gray-600">
                    x{item.quantity} @ ₪{item.price}
                  </span>
                </li>
              ))}
            </ul>
          </div>

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
              disabled={isLoading || selectedStatus === order.status}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50"
            >
              {isLoading ? "🔄 עדכון..." : "💾 עדכן"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderStatusForm;
