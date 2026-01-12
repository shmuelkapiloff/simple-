import React, { useState } from "react";
import { useToast } from "./ToastProvider";

/**
 * ✅ Inline Stripe Elements form for direct card input (Demo Mode)
 *
 * To use the full implementation with real Stripe Elements:
 * 1. npm install @stripe/react-stripe-js @stripe/stripe-js
 * 2. Import and use the real component from StripeElementsFormFull.tsx
 *
 * This demo version:
 * - Shows the UI that users will see
 * - Simulates payment success
 * - Redirects with same URL params as real flow
 */
export const StripeElementsForm: React.FC<{
  clientSecret: string;
  orderId: string;
  onSuccess: () => void;
  onError?: (error: string) => void;
  isSubmitting?: boolean;
}> = ({ clientSecret, orderId, onSuccess, onError, isSubmitting = false }) => {
  const { addToast } = useToast();
  const [cardNumber, setCardNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Demo: Simulate Stripe processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check for test card patterns
      if (cardNumber.includes("4242")) {
        // Success
        addToast("✅ התשלום הסתיים בהצלחה!", "success");
        onSuccess();
        setTimeout(() => {
          window.location.href = `/checkout?payment=success&orderId=${orderId}`;
        }, 1000);
      } else if (cardNumber.includes("4000")) {
        // Simulated decline
        addToast("❌ שגיאת תשלום: הכרטיס נדחה", "error");
        onError?.("Card declined");
        setLoading(false);
      } else {
        addToast("⚠️ אנא השתמש בכרטיס בדיקה: 4242... או 4000...", "info");
        setLoading(false);
      }
    } catch (err: any) {
      const msg = err?.message || "שגיאה לא ידועה";
      addToast(`❌ ${msg}`, "error");
      onError?.(msg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          פרטי כרטיס (Demo)
        </label>

        <div className="space-y-3">
          <div>
            <input
              type="text"
              placeholder="מספר כרטיס (דוגמה: 4242 4242 4242 4242)"
              className="w-full border rounded px-3 py-2 font-mono text-sm"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ✓ בדיקה: 4242 4242 4242 4242
              <br />✗ דחיה: 4000 0000 0000 0002
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="תאריך (MM/YY)"
              className="border rounded px-3 py-2 text-sm"
              defaultValue="12/25"
            />
            <input
              type="text"
              placeholder="CVC"
              className="border rounded px-3 py-2 text-sm"
              defaultValue="123"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-600">
          🔒 במצב אמיתי: התשלום יהיה מוצפן ע"י Stripe
        </p>
        <button
          type="submit"
          disabled={loading || isSubmitting || !cardNumber}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          {loading || isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              עיבוד...
            </>
          ) : (
            "💳 אשר תשלום"
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        📌 זה מצב דמו. לשימוש בפיתוח: npm install @stripe/react-stripe-js
      </p>
    </form>
  );
};

export default StripeElementsForm;
