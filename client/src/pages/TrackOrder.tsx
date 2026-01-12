import React from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTrackOrderQuery } from "../app/api";

const formatDateTime = (value?: string) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    return `${d.toLocaleDateString("he-IL")} ${d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return value;
  }
};

const statusBadge = (status?: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-yellow-100 text-yellow-800",
    shipped: "bg-blue-100 text-blue-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const cls = status
    ? map[status] || "bg-gray-100 text-gray-800"
    : "bg-gray-100 text-gray-800";
  const icon =
    status === "delivered"
      ? "✅"
      : status === "shipped"
      ? "🚚"
      : status === "processing"
      ? "🔄"
      : status === "cancelled"
      ? "❌"
      : "⏳";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}
    >
      {icon} {status || "unknown"}
    </span>
  );
};

const TrackOrder: React.FC = () => {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const { data, isLoading, error } = useTrackOrderQuery(orderId, {
    skip: !orderId,
  });

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-2">❌ חסר מזהה הזמנה</h2>
          <p className="text-gray-600">יש ליצור הזמנה ואז לעקוב אחריה.</p>
          <div className="mt-4">
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              בחזרה להזמנות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-gray-600">טוען פרטי מעקב...</span>
        </div>
      </div>
    );
  }

  if (error) {
    // @ts-ignore
    const status = (error as any)?.status;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-2">
            ❌ שגיאה בטעינה
          </h2>
          <p className="text-gray-600">
            {status === 404 ? "ההזמנה לא נמצאה." : "אנא נסה שוב מאוחר יותר."}
          </p>
          <div className="mt-4">
            <Link
              to="/orders"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              בחזרה להזמנות
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const order: any = data || {};
  const items = order.items || [];
  const history: Array<{ status: string; timestamp: string; note?: string }> =
    order.trackingHistory || [];
  const total = order.totalAmount ?? order.total;

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Payment Success Alert */}
        {paymentStatus === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              ✅ התשלום בוצע בהצלחה!
            </h3>
            <p className="text-green-700 text-sm">
              ✓ התשלום אושר (Inline Elements או Stripe Redirect)
              <br />
              ✓ העגלה שלך נוקתה ממוצרים
              <br />✓ ההזמנה נרשמה במערכת ותוכל לעקוב אחריה כאן
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🧾 מעקב הזמנה #{order.orderNumber || order._id}
              </h1>
              <p className="text-gray-600">הצצה למצב ההזמנה והיסטוריית מעקב</p>
            </div>
            <div className="text-right">
              {statusBadge(order.status)}
              {order.estimatedDelivery && (
                <p className="text-sm text-gray-500 mt-2">
                  מסירה משוערת: {formatDateTime(order.estimatedDelivery)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📜 היסטוריית מעקב
          </h2>
          {history.length === 0 ? (
            <p className="text-gray-600">אין עדיין עדכוני מעקב להזמנה זו.</p>
          ) : (
            <div className="space-y-4">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-start">
                  <div className="w-8 text-center text-blue-600">•</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {statusBadge(h.status)}
                      <span className="text-sm text-gray-500">
                        {formatDateTime(h.timestamp)}
                      </span>
                    </div>
                    {h.note && <p className="text-gray-700 mt-1">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📦 פריטים בהזמנה
          </h2>
          {items.length === 0 ? (
            <p className="text-gray-600">אין פריטים להצגה.</p>
          ) : (
            <div className="space-y-4">
              {items.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  {item.product?.image && (
                    <img
                      src={item.product.image}
                      alt={item.product?.name || ""}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {item.product?.name || item.product?.sku || "מוצר"}
                    </p>
                    <p className="text-sm text-gray-600">
                      כמות: {item.quantity} × ₪
                      {(item.price ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="font-semibold text-gray-900">
                    ₪
                    {(
                      (item.quantity ?? 0) * (item.price ?? 0)
                    ).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
            <Link
              to="/orders"
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
            >
              ⬅️ חזרה להזמנות
            </Link>
            {typeof total === "number" && (
              <div className="text-right">
                <p className="text-sm text-gray-500">סכום כולל</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₪{total.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default TrackOrder;
