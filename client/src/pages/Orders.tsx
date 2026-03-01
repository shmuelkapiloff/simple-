import { Link } from "react-router-dom";
import { useGetOrdersQuery } from "../api";

const statusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "ממתין", color: "bg-yellow-100 text-yellow-800" },
  pending_payment: { label: "ממתין לתשלום", color: "bg-orange-100 text-orange-800" },
  confirmed: { label: "אושר", color: "bg-blue-100 text-blue-800" },
  processing: { label: "בטיפול", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "נשלח", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "נמסר", color: "bg-green-100 text-green-800" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-800" },
};

const paymentStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "ממתין", color: "text-yellow-600" },
  paid: { label: "שולם", color: "text-green-600" },
  failed: { label: "נכשל", color: "text-red-600" },
  refunded: { label: "הוחזר", color: "text-gray-600" },
};

export default function Orders() {
  const { data, isLoading } = useGetOrdersQuery();
  // Server returns orders array directly
  const orders = Array.isArray(data?.data) ? data.data : [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">ההזמנות שלי</h1>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border p-6 h-28" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">ההזמנות שלי</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-6xl mb-4">📦</p>
          <h2 className="text-xl font-bold mb-2">אין הזמנות עדיין</h2>
          <p className="text-gray-500 mb-4">ההזמנות שלך יופיעו כאן</p>
          <Link to="/" className="text-primary-600 hover:underline">לחנות</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const s = statusMap[order.status] ?? { label: order.status, color: "bg-gray-100 text-gray-800" };
            const ps = paymentStatusMap[order.paymentStatus] ?? { label: order.paymentStatus, color: "text-gray-600" };

            return (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="block bg-white rounded-xl border p-6 hover:shadow-md transition"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg">{order.orderNumber}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("he-IL")} •{" "}
                      {order.items.length} פריטים
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold">₪{order.totalAmount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
                        {s.label}
                      </span>
                      <span className={`text-xs font-medium ${ps.color}`}>
                        {ps.label}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
