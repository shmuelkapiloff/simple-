import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser, selectIsAuthenticated } from "../app/authSlice";
import {
  useGetUserOrdersQuery,
  useCancelOrderMutation,
  useGetPaymentStatusQuery,
} from "../app/api";
import type { RootState } from "../app/store";
import { useToast } from "../components/ToastProvider";

type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

interface OrderCardProps {
  order: any;
  onTrack: (orderId: string) => void;
  onReorder: (orderId: string) => void;
  onDownloadInvoice: (orderId: string) => void;
  onCancel: (orderId: string) => void;
  getStatusBadge: (status: OrderStatus) => JSX.Element;
  getPaymentStatusBadge: (status?: string) => JSX.Element;
}

// ✅ Separate OrderCard component with payment status polling
const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onTrack,
  onReorder,
  onDownloadInvoice,
  onCancel,
  getStatusBadge,
  getPaymentStatusBadge,
}) => {
  const { addToast } = useToast();
  const { data: paymentStatus } = useGetPaymentStatusQuery(order._id, {
    pollingInterval: order.status === "pending" ? 10000 : 0, // Poll every 10s if pending
  });

  const handleRetryPayment = () => {
    if (!order.checkoutUrl) {
      addToast("כתובת התשלום אינה זמינה", "error");
      return;
    }
    window.location.href = order.checkoutUrl;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Order Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                הזמנה #{order.orderNumber}
              </h3>
              {getStatusBadge(order.status)}
              {/* ✅ Payment Status Badge */}
              {getPaymentStatusBadge(paymentStatus?.paymentStatus)}
            </div>
            <p className="text-sm text-gray-500">
              📅 הוזמן ב-
              {new Date(order.createdAt).toLocaleDateString("he-IL")} 🕐{" "}
              {new Date(order.createdAt).toLocaleTimeString("he-IL", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              ₪{(order.total ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-gray-500">
              {order.items?.length ?? 0} פריטים
            </p>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="p-6">
        <div className="space-y-4">
          {order.items.map((item: any, index: number) => (
            <div key={index} className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                📦
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                  {item.product.name}
                </h4>
                <p className="text-sm text-gray-500">
                  כמות: {item.quantity} × ₪{(item.price ?? 0).toLocaleString()}
                </p>
              </div>
              <div className="font-semibold text-gray-900">
                ₪{(item.quantity * (item.price ?? 0)).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* ✅ Payment Status Message for Failed/Pending */}
        {paymentStatus?.paymentStatus === "failed" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              ❌ התשלום נכשל. אנא נסה שוב או צור קשר לתמיכה.
            </p>
          </div>
        )}
        {paymentStatus?.paymentStatus === "pending" && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⏳ התשלום עדיין בתהליך. אנא אל תרענן את הדף.
            </p>
          </div>
        )}

        {/* Order Actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            onClick={() => onTrack(order._id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            📍 מעקב הזמנה
          </button>
          <button
            onClick={() => onReorder(order._id)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            🔄 הזמן שוב
          </button>
          <button
            onClick={() => onDownloadInvoice(order._id)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            📄 הורד חשבונית
          </button>

          {/* ✅ Retry Payment Button for Failed/Pending */}
          {(paymentStatus?.paymentStatus === "failed" ||
            paymentStatus?.paymentStatus === "pending") && (
            <button
              onClick={handleRetryPayment}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
            >
              💳 נסה שוב
            </button>
          )}

          {(order.status === "pending" || order.status === "processing") && (
            <button
              onClick={() => onCancel(order._id)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              ❌ בטל הזמנה
            </button>
          )}
          {order.status === "delivered" && (
            <button
              onClick={() =>
                console.log("🔧 TODO: Open review modal for:", order._id)
              }
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
            >
              ⭐ כתוב ביקורת
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const user = useSelector((state: RootState) => selectUser(state));
  const isAuthenticated = useSelector((state: RootState) =>
    selectIsAuthenticated(state)
  );
  const [selectedFilter, setSelectedFilter] = useState<"all" | OrderStatus>(
    "all"
  );

  // RTK Query for orders
  const {
    data: orders = [],
    isLoading,
    error,
  } = useGetUserOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [cancelOrderMutation] = useCancelOrderMutation();

  // Filter orders based on selected filter
  const filteredOrders =
    selectedFilter === "all"
      ? orders
      : orders.filter((order) => order.status === selectedFilter);

  if (!user || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔐 נדרשת התחברות
          </h2>
          <p className="text-gray-600">אנא התחבר כדי לצפות בההזמנות שלך.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    const statusConfig = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "⏳ ממתין",
        icon: "⏳",
      },
      processing: {
        color: "bg-yellow-100 text-yellow-800",
        text: "🔄 בעיבוד",
        icon: "⏳",
      },
      shipped: {
        color: "bg-blue-100 text-blue-800",
        text: "📦 נשלח",
        icon: "🚚",
      },
      delivered: {
        color: "bg-green-100 text-green-800",
        text: "✅ נמסר",
        icon: "📬",
      },
      cancelled: {
        color: "bg-red-100 text-red-800",
        text: "❌ בוטל",
        icon: "🚫",
      },
    };

    const config = statusConfig[status];
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.icon} {config.text}
      </span>
    );
  };

  // ✅ Payment status badge component
  const getPaymentStatusBadge = (paymentStatus?: string) => {
    if (!paymentStatus)
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          💳 ממתין
        </span>
      );
    if (paymentStatus === "paid")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          💰 שולם
        </span>
      );
    if (paymentStatus === "pending")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          ⏳ בתהליך
        </span>
      );
    if (paymentStatus === "failed")
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ❌ נכשל
        </span>
      );
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {paymentStatus}
      </span>
    );
  };

  const handleTrackOrder = (orderId: string) => {
    navigate(`/track/${orderId}`);
  };

  const handleReorder = (orderId: string) => {
    console.log("🔧 TODO: Add order items to cart:", orderId);
    addToast(`הזמנה מחדש ${orderId} — בקרוב נוסיף תכונה זו! 🛒`, "info");
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("האם אתה בטוח שברצונך לבטל את ההזמנה?")) {
      return;
    }

    try {
      await cancelOrderMutation({ orderId }).unwrap();
      addToast("ההזמנה בוטלה בהצלחה! ✅", "success");
    } catch (error: any) {
      console.error("Cancel order error:", error);
      const errorMessage =
        error?.data?.message || "שגיאה בביטול ההזמנה. אנא נסה שוב.";
      addToast(errorMessage, "error");
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    console.log("🔧 TODO: Generate and download invoice for:", orderId);
    addToast(`הורדת חשבונית ${orderId} — בקרוב! 📄`, "info");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                  {[...Array(2)].map((__, j) => (
                    <div key={j} className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-3 w-36 bg-gray-200 rounded animate-pulse" />
                      </div>
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            ❌ שגיאה בטעינת ההזמנות
          </h2>
          <p className="text-gray-600">
            אנא נסה לטעון את הדף שוב או פנה לתמיכה.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                📦 ההזמנות שלי
              </h1>
              <p className="text-gray-600">
                מעקב וניהול כל ההזמנות שלך במקום אחד
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">שלום,</p>
              <p className="font-semibold text-gray-900">{user.name}</p>
            </div>
          </div>
        </header>

        {/* Filter Tabs */}
        <nav
          aria-label="סינון הזמנות"
          className="bg-white rounded-lg shadow-sm p-6 mb-8"
        >
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFilter("all")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🏠 הכל
            </button>
            <button
              onClick={() => setSelectedFilter("pending")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "pending"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ⏳ ממתין
            </button>
            <button
              onClick={() => setSelectedFilter("processing")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "processing"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🔄 בעיבוד
            </button>
            <button
              onClick={() => setSelectedFilter("shipped")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "shipped"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              🚚 נשלח
            </button>
            <button
              onClick={() => setSelectedFilter("delivered")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "delivered"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✅ נמסר
            </button>
            <button
              onClick={() => setSelectedFilter("cancelled")}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedFilter === "cancelled"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              aria-label="הצג הזמנות מבוטלות"
            >
              🚫 בוטל
            </button>
          </div>
        </nav>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              אין הזמנות למציאה
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedFilter === "all"
                ? "עדיין לא ביצעת הזמנות. בוא נתחיל לקנות!"
                : `אין הזמנות עם סטטוס "${selectedFilter}"`}
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🛍️ התחל לקנות
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order._id}
                order={order}
                onTrack={handleTrackOrder}
                onReorder={handleReorder}
                onDownloadInvoice={handleDownloadInvoice}
                onCancel={handleCancelOrder}
                getStatusBadge={getStatusBadge}
                getPaymentStatusBadge={getPaymentStatusBadge}
              />
            ))}
          </div>
        )}

        {/* API Integration Notice */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="text-green-600 text-xl">✅</div>
            <div>
              <h4 className="font-semibold text-green-900 mb-2">
                עמוד ההזמנות מחובר ל-API
              </h4>
              <p className="text-green-800 text-sm">
                ההזמנות המוצגות נטענות מהשרת בזמן אמת. כל הפעולות (ביטול הזמנה,
                מעקב) מתקשרות עם השרת.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Orders;
