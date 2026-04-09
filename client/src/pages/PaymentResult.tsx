import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useGetPaymentStatusQuery, useGetOrderQuery } from "../api";

const POLL_TIMEOUT_MS = 45_000;

type ResultState = "polling" | "success" | "failed" | "cancelled" | "timeout";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const cancelled = searchParams.get("cancelled");

  const [state, setState] = useState<ResultState>(() => {
    if (cancelled) return "cancelled";
    if (orderId) return "polling";
    return "failed";
  });

  const startedAt = useRef(Date.now());

  const { data: paymentData, isError: paymentError } =
    useGetPaymentStatusQuery(orderId!, {
      skip: !orderId || state !== "polling",
      pollingInterval: 3000,
    });

  const { data: orderData } = useGetOrderQuery(orderId!, {
    skip: !orderId || state !== "success",
  });

  useEffect(() => {
    if (state !== "polling") return;

    const status = paymentData?.data?.payment?.status;

    if (status === "succeeded") {
      localStorage.removeItem("checkout_order_id");
      setState("success");
      return;
    }
    if (status === "failed" || status === "canceled") {
      setState("failed");
      return;
    }
    if (paymentError) {
      setState("failed");
      return;
    }
    if (Date.now() - startedAt.current > POLL_TIMEOUT_MS) {
      setState("timeout");
    }
  }, [paymentData, paymentError, state]);

  const order = orderData?.data?.order;

  if (state === "polling") return <PollingView />;
  if (state === "success") return <SuccessView orderId={orderId!} order={order} />;
  if (state === "failed") return <FailedView />;
  if (state === "cancelled") return <CancelledView />;
  return <TimeoutView orderId={orderId} />;
}

/* ── Sub-views ───────────────────────────────────────────── */

function PollingView() {
  return (
    <PageShell>
      <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
      <h1 className="text-xl font-bold mt-6 mb-2">מעבד את התשלום...</h1>
      <p className="text-gray-500 text-sm">
        זה יכול לקחת כמה שניות, אנא המתן
      </p>
    </PageShell>
  );
}

function SuccessView({
  orderId,
  order,
}: {
  orderId: string;
  order?: { orderNumber?: string; totalAmount?: number } | null;
}) {
  return (
    <PageShell>
      {/* Checkmark circle */}
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-green-700 mt-6 mb-2">
        התשלום בוצע בהצלחה!
      </h1>

      {order?.orderNumber && (
        <p className="text-gray-500 text-sm mb-1">
          מספר הזמנה: <span className="font-mono font-medium text-gray-700">{order.orderNumber}</span>
        </p>
      )}
      {order?.totalAmount != null && (
        <p className="text-gray-500 text-sm mb-4">
          סכום שחויב: <span className="font-semibold text-gray-700">₪{order.totalAmount.toLocaleString()}</span>
        </p>
      )}
      {!order?.orderNumber && (
        <p className="text-gray-500 text-sm mb-4">ההזמנה שלך אושרה ונמצאת בטיפול</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-2">
        <Link
          to={`/orders/${orderId}`}
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition text-center"
        >
          הצג את ההזמנה
        </Link>
        <Link
          to="/"
          className="inline-block bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition text-center"
        >
          המשך לקנות
        </Link>
      </div>
    </PageShell>
  );
}

function FailedView() {
  return (
    <PageShell>
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-red-700 mt-6 mb-2">
        התשלום נכשל
      </h1>
      <p className="text-gray-500 mb-6">
        לא בוצע חיוב. ניתן לנסות שוב או לפנות לתמיכה.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/cart"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition text-center"
        >
          חזרה לעגלה
        </Link>
        <Link
          to="/orders"
          className="inline-block bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition text-center"
        >
          הזמנות שלי
        </Link>
      </div>
    </PageShell>
  );
}

function CancelledView() {
  return (
    <PageShell>
      <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-yellow-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-yellow-700 mt-6 mb-2">
        התשלום בוטל
      </h1>
      <p className="text-gray-500 mb-6">לא בוצע חיוב. העגלה שלך נשמרה.</p>

      <Link
        to="/cart"
        className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition"
      >
        חזרה לעגלה
      </Link>
    </PageShell>
  );
}

function TimeoutView({ orderId }: { orderId: string | null }) {
  return (
    <PageShell>
      <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z"
          />
        </svg>
      </div>

      <h1 className="text-xl font-bold mt-6 mb-2">
        בדיקת הסטטוס אורכת זמן רב
      </h1>
      <p className="text-gray-500 mb-2 text-sm">
        יתכן שהתשלום עובד ברקע. אנא בדוק את ההזמנות שלך.
      </p>
      <p className="text-gray-400 text-xs mb-6">
        אם לא תראה הזמנה חדשה תוך מספר דקות, לא בוצע חיוב.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {orderId && (
          <Link
            to={`/orders/${orderId}`}
            className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition text-center"
          >
            בדוק את ההזמנה
          </Link>
        )}
        <Link
          to="/orders"
          className="inline-block bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition text-center"
        >
          כל ההזמנות
        </Link>
      </div>
    </PageShell>
  );
}

/* ── Layout wrapper ──────────────────────────────────────── */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-[70vh] flex items-center justify-center px-4"
      dir="rtl"
    >
      <div className="bg-white rounded-2xl border shadow-sm p-10 max-w-md w-full text-center">
        {children}
      </div>
    </div>
  );
}
