import React, { useState } from "react";
import { useToast } from "./ToastProvider";

interface StripeElementsFormProps {
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  isSubmitting?: boolean;
}

/**
 * 🎭 DEMO MODE - Stripe Elements Form (ללא תלות ב-@stripe/react-stripe-js)
 * להתקנת Stripe אמיתי: npm install @stripe/react-stripe-js @stripe/stripe-js
 *
 * גרסה זו משתמשת בכרטיסי מבחן:
 * - 4242 4242 4242 4242 = הצלחה
 * - 4000 0000 0000 0002 = דחייה
 */
export const StripeElementsForm: React.FC<StripeElementsFormProps> = ({
  clientSecret,
  orderId,
  onSuccess,
  onError,
  isSubmitting = false,
}) => {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!cardNumber || !expiry || !cvc) {
      addToast("❌ אנא מלא את כל שדות הכרטיס", "error");
      return;
    }

    setLoading(true);

    try {
      // 🎭 DEMO: Simulate payment processing (2 seconds)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check card number for success/failure
      if (cardNumber.includes("4242")) {
        // ✅ Success card
        addToast("✅ התשלום הסתיים בהצלחה! (DEMO)", "success");
        onSuccess();
        // Redirect to return with success params
        setTimeout(() => {
          window.location.href = `/checkout?payment=success&orderId=${orderId}`;
        }, 1000);
      } else if (cardNumber.includes("4000")) {
        // ❌ Decline card
        addToast("❌ התשלום נדחה. נסה כרטיס אחר (4242...)", "error");
        onError?.("Card declined");
        setLoading(false);
      } else {
        // ⚠️ Unknown card
        addToast("⚠️ כרטיס לא מוכר. השתמש ב-4242... להצלחה", "info");
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err?.message || "שגיאה לא ידועה";
      addToast(`❌ ${msg}`, "error");
      onError?.(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-gray-50 p-6 rounded-lg border"
    >
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-sm text-blue-800 font-semibold">
          🎭 DEMO MODE - כרטיסי מבחן:
        </p>
        <ul className="text-xs text-blue-700 mt-2 space-y-1">
          <li>
            ✅ הצלחה: <code>4242 4242 4242 4242</code>
          </li>
          <li>
            ❌ דחייה: <code>4000 0000 0000 0002</code>
          </li>
          <li>📅 תאריך תפוגה: כל תאריך עתידי</li>
          <li>🔒 CVC: כל 3 ספרות</li>
        </ul>
      </div>

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          מספר כרטיס
        </label>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
          placeholder="4242 4242 4242 4242"
          maxLength={16}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required
        />
      </div>

      {/* Expiry & CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תאריך תפוגה
          </label>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            placeholder="MM/YY"
            maxLength={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVC
          </label>
          <input
            type="text"
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            placeholder="123"
            maxLength={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-xs text-gray-600">🔒 התשלום מוצפן באופן מאובטח</p>
        <button
          type="submit"
          disabled={loading || isSubmitting}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 font-semibold"
        >
          {loading || isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              מעבד...
            </>
          ) : (
            "💳 אשר תשלום"
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        לאחר אישור התשלום, תועבר לדף ההזמנה שלך
      </p>
    </form>
  );
};

export default StripeElementsForm;
