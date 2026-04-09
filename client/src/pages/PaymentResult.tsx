import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useGetPaymentStatusQuery } from "../api";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 45_000;

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const paymentParam = searchParams.get("payment"); // "success" | "cancelled"
  const orderId = searchParams.get("orderId");

  const isSuccessReturn = paymentParam === "success";
  const isCancelledReturn = paymentParam === "cancelled";

  const [stopPolling, setStopPolling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  const { data: paymentData } = useGetPaymentStatusQuery(orderId!, {
    skip: !orderId || !isSuccessReturn || stopPolling,
    pollingInterval: POLL_INTERVAL_MS,
  });

  const paymentStatus = paymentData?.data?.paymentStatus;
  const confirmed = paymentStatus === "succeeded" || paymentData?.data?.orderPaymentStatus === "paid";
  const failed = paymentStatus === "failed" || paymentStatus === "canceled";

  // Stop polling once the payment is resolved
  useEffect(() => {
    if (confirmed || failed) {
      setStopPolling(true);
    }
  }, [confirmed, failed]);

  // Timeout fallback — stop polling and show a "still processing" message
  useEffect(() => {
    if (!isSuccessReturn || !orderId) return;
    const timer = setTimeout(() => {
      setStopPolling(true);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [isSuccessReturn, orderId]);

  // Guard: invalid URL params → go home
  useEffect(() => {
    if (!orderId || (!isSuccessReturn && !isCancelledReturn)) {
      navigate("/", { replace: true });
    }
  }, [orderId, isSuccessReturn, isCancelledReturn, navigate]);

  if (!orderId) return null;

  // ── Cancelled ────────────────────────────────────────────────────────────
  if (isCancelledReturn) {
    return (
      <ResultWrapper>
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">התשלום בוטל</h1>
        <p className="text-gray-500 mb-8">לא בוצע חיוב. הפריטים בעגלה שלך נשמרו.</p>
        <ActionButtons primary={{ to: "/cart", label: "חזרה לעגלה" }} />
      </ResultWrapper>
    );
  }

  // ── Payment failed (confirmed by server) ─────────────────────────────────
  if (failed) {
    return (
      <ResultWrapper>
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">התשלום נכשל</h1>
        <p className="text-gray-500 mb-8">אירעה שגיאה בעיבוד התשלום. לא בוצע חיוב.</p>
        <ActionButtons primary={{ to: "/cart", label: "חזרה לעגלה" }} />
      </ResultWrapper>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (confirmed) {
    return (
      <ResultWrapper>
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
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
        <h1 className="text-2xl font-bold text-green-600 mb-2">התשלום בוצע בהצלחה!</h1>
        <p className="text-gray-600 mb-1">ההזמנה שלך אושרה ועומדת לטיפול.</p>
        <p className="text-sm text-gray-400 mb-8">תקבל עדכונים על סטטוס המשלוח</p>
        <ActionButtons primary={{ to: "/orders", label: "לצפייה בהזמנות" }} />
      </ResultWrapper>
    );
  }

  // ── Timed out ─────────────────────────────────────────────────────────────
  if (timedOut) {
    return (
      <ResultWrapper>
        <div className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⏳</span>
        </div>
        <h1 className="text-xl font-bold mb-2">ההזמנה עוד מעובדת</h1>
        <p className="text-gray-500 mb-8">
          זה לוקח יותר זמן מהרגיל.{" "}
          <Link to="/orders" className="text-primary-600 hover:underline">
            לצפייה בהזמנות
          </Link>{" "}
          לבדיקת הסטטוס.
        </p>
        <ActionButtons primary={{ to: "/orders", label: "לצפייה בהזמנות" }} />
      </ResultWrapper>
    );
  }

  // ── Pending (polling) ─────────────────────────────────────────────────────
  return (
    <ResultWrapper>
      <div className="w-14 h-14 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6" />
      <h1 className="text-xl font-bold mb-2">ממתין לאישור תשלום...</h1>
      <p className="text-gray-500 text-sm">זה יכול לקחת כמה שניות</p>
    </ResultWrapper>
  );
}

// ── Shared layout ────────────────────────────────────────────────────────────
function ResultWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-6 py-20 text-center">{children}</div>
  );
}

// ── Shared action buttons (primary + secondary "המשך קניות") ────────────────
function ActionButtons({ primary }: { primary: { to: string; label: string } }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Link
        to={primary.to}
        className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition"
      >
        {primary.label}
      </Link>
      <Link
        to="/"
        className="inline-block bg-white text-primary-600 border border-primary-300 px-6 py-2.5 rounded-lg font-medium hover:bg-primary-50 transition"
      >
        המשך קניות
      </Link>
    </div>
  );
}
