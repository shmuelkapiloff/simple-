import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useGetOrderQuery, useCancelOrderMutation } from "../api";
import { ORDER_STATUS_MAP } from "../constants";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import type { OrderItem, TrackingEntry } from "../types";

export default function Order() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useGetOrderQuery(id!);
  const [cancelOrder, { isLoading: cancelling }] = useCancelOrderMutation();
  const [showConfirm, setShowConfirm] = useState(false);
  const toast = useToast();

  // Server returns order directly in data
  const order = data?.data?.order;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-bold mb-2">ההזמנה לא נמצאה</h1>
        <Link to="/orders" className="text-primary-600 hover:underline">
          חזרה להזמנות
        </Link>
      </div>
    );
  }

  const s = ORDER_STATUS_MAP[order.status] ?? {
    label: order.status,
    color: "bg-gray-100 text-gray-800",
  };
  const canCancel =
    order.status === "pending_payment" || order.status === "pending";

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-gray-500 mb-6">
        <Link to="/orders" className="hover:text-primary-600">
          הזמנות
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">הזמנה {order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            {new Date(order.createdAt).toLocaleDateString("he-IL")}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${s.color}`}
        >
          {s.label}
        </span>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-4">פריטים</h2>
        {order.items.map((item: OrderItem, i: number) => (
          <div
            key={i}
            className="flex items-center gap-4 py-3 border-b last:border-b-0"
          >
            {item.image && (
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image.startsWith("http") ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl">
                    {item.image}
                  </div>
                )}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                כמות: {item.quantity} × ₪{item.price.toLocaleString()}
              </p>
            </div>
            <p className="font-bold">
              ₪{(item.price * item.quantity).toLocaleString()}
            </p>
          </div>
        ))}
        <div className="flex justify-between items-center pt-4 text-lg font-bold">
          <span>סה"כ</span>
          <span>₪{order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Shipping Address - כרטיס משלוח מלא */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="font-bold mb-3">📦 פרטי משלוח</h2>
        <div className="bg-blue-50 rounded-lg p-4 space-y-2">
          <div>
            <p className="text-sm text-gray-500">מקבל החבילה</p>
            <p className="font-semibold text-lg">
              {order.shippingAddress.fullName || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">טלפון</p>
            <p className="font-medium" dir="ltr">
              {order.shippingAddress.phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">כתובת</p>
            <p className="text-gray-800">
              {order.shippingAddress.street}, {order.shippingAddress.city}
              <br />
              {order.shippingAddress.postalCode},{" "}
              {order.shippingAddress.country}
            </p>
          </div>
        </div>
      </div>

      {/* Tracking History */}
      {order.trackingHistory.length > 0 && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="font-bold mb-4">מעקב הזמנה</h2>
          <div className="space-y-3">
            {order.trackingHistory.map((entry: TrackingEntry, i: number) => {
              const es = ORDER_STATUS_MAP[entry.status] ?? {
                label: entry.status,
                color: "bg-gray-100 text-gray-800",
              };
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${i === 0 ? "bg-primary-500" : "bg-gray-300"}`}
                  />
                  <div>
                    <p className="font-medium text-sm">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${es.color}`}
                      >
                        {es.label}
                      </span>
                    </p>
                    {entry.message && (
                      <p className="text-sm text-gray-600 mt-0.5">
                        {entry.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(entry.timestamp).toLocaleString("he-IL")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={cancelling}
          className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-lg font-medium hover:bg-red-100 transition disabled:opacity-50"
        >
          ביטול הזמנה
        </button>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="ביטול הזמנה"
          message={`האם לבטל את הזמנה ${order.orderNumber}? פעולה זו לא ניתנת לביטול.`}
          confirmLabel="בטל הזמנה"
          isLoading={cancelling}
          onConfirm={async () => {
            try {
              await cancelOrder(order._id).unwrap();
              toast.success("ההזמנה בוטלה בהצלחה");
              setShowConfirm(false);
            } catch {
              toast.error("שגיאה בביטול ההזמנה");
            }
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
