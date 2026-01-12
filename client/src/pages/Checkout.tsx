import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { selectIsAuthenticated } from "../app/authSlice";
import {
  selectCartItems,
  selectCartTotal,
  selectSessionId,
  clearCart,
} from "../app/cartSlice";
import {
  Address,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useCreateOrderMutation,
  useCreatePaymentIntentMutation,
  useClearCartMutation,
  useGetPaymentStatusQuery,
} from "../app/api";
import { useToast } from "../components/ToastProvider";
import { StripeElementsForm } from "../components/StripeElementsForm";

const Stepper: React.FC<{ step: number }> = ({ step }) => {
  const steps = ["עגלה", "כתובת", "תשלום", "סקירה"];
  return (
    <nav
      aria-label="שלבי הזמנה"
      className="flex items-center justify-between mb-6"
    >
      {steps.map((label, idx) => {
        const active = idx <= step;
        const isCurrent = idx === step;
        return (
          <div
            key={label}
            className="flex items-center flex-1"
            aria-current={isCurrent ? "step" : undefined}
          >
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                active ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-600"
              }`}
              aria-label={`שלב ${idx + 1}: ${label}`}
            >
              {idx + 1}
            </div>
            <span
              className={`ml-2 text-sm ${
                active ? "text-blue-700" : "text-gray-500"
              }`}
            >
              {label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 ${
                  active ? "bg-blue-300" : "bg-gray-200"
                }`}
              ></div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

const paymentLabels: Record<string, string> = {
  stripe: "כרטיס אשראי (Stripe)",
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const sessionId = useSelector(selectSessionId);
  const paymentSuccess = searchParams.get("payment") === "success";
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const returnedOrderId = searchParams.get("orderId");

  const [step, setStep] = useState(0); // 0 cart summary, 1 address, 2 payment, 3 review
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe"); // "stripe" (redirect) or "stripe-elements" (inline)
  const [useInlineElements, setUseInlineElements] = useState(false); // Toggle inline vs redirect
  const [currentOrder, setCurrentOrder] = useState<any>(null); // Store order for inline payment
  const [currentIntent, setCurrentIntent] = useState<any>(null); // Store intent for inline payment

  const { data: addresses = [], isLoading: isAddressesLoading } =
    useGetAddressesQuery(undefined, {
      skip: !isAuthenticated,
    });
  const [createAddressMutation, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();
  const [createOrderMutation, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [createPaymentIntent, { isLoading: isCreatingPayment }] =
    useCreatePaymentIntentMutation();
  const [clearCartMutation] = useClearCartMutation();

  // ✅ Poll payment status on return from Stripe ONLY
  const { data: paymentStatus } = useGetPaymentStatusQuery(
    returnedOrderId || "",
    {
      skip: !returnedOrderId, // Only poll if returning from payment
      pollingInterval: returnedOrderId && !paymentSuccess ? 3000 : 0, // Poll every 3s until confirmed
    }
  );

  // ✅ Handle return from Stripe redirect - confirm payment before clearing cart
  useEffect(() => {
    if (returnedOrderId && paymentStatus?.paymentStatus === "paid") {
      addToast("✅ התשלום הסתיים בהצלחה!", "success");
      try {
        // ✅ ONLY clear cart after confirmed paid status
        clearCartMutation({ sessionId })
          .unwrap()
          .catch(() => {});
        dispatch(clearCart());
        navigate(`/orders/${returnedOrderId}`);
      } catch (e) {
        console.error("Clear cart or navigate failed:", e);
      }
    } else if (returnedOrderId && paymentCancelled) {
      addToast("ביטלת את התשלום — העגלה שלך שמורה", "info");
    }
  }, [returnedOrderId, paymentStatus?.paymentStatus, paymentCancelled]);

  useEffect(() => {
    if (items.length === 0) {
      addToast("העגלה ריקה — בחר מוצרים והמשך", "error");
      navigate("/cart");
    }
  }, [items.length, addToast, navigate]);

  useEffect(() => {
    if (!selectedAddress && addresses.length > 0) {
      const savedId = localStorage.getItem("selectedAddressId");
      const found = savedId
        ? addresses.find((a) => a._id === savedId)
        : undefined;
      setSelectedAddress(
        found || addresses.find((a) => a.isDefault) || addresses[0]
      );
    }
  }, [addresses, selectedAddress]);

  const currencyTotal = useMemo(() => `₪${total.toLocaleString()}`, [total]);

  const placeOrder = async () => {
    if (!sessionId || !selectedAddress) return;
    try {
      const order = await createOrderMutation({
        sessionId,
        shippingAddress: {
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          postalCode: selectedAddress.zipCode || "",
          country: selectedAddress.country,
        },
        paymentMethod: paymentMethod as "stripe",
      }).unwrap();
      addToast(
        `הזמנה נוצרה בהצלחה! מס' הזמנה: ${order.orderNumber}`,
        "success"
      );

      // יצירת כוונת תשלום להזמנה
      const intent = await createPaymentIntent({ orderId: order._id }).unwrap();

      if (intent.status === "succeeded") {
        // ✅ Immediate success (e.g., mock setup) - clear cart now
        addToast("התשלום אושר בהצלחה", "success");
        try {
          await clearCartMutation({ sessionId }).unwrap();
          dispatch(clearCart());
        } catch (clearError) {
          console.error("Failed to clear cart:", clearError);
        }
        navigate(`/orders/${order._id}`);
        return;
      }

      // ✅ For inline Elements: store order & intent, show form
      if (useInlineElements && intent.clientSecret) {
        setCurrentOrder(order);
        setCurrentIntent(intent);
        addToast("אנא הזן פרטי כרטיס", "info");
        // Form will be displayed in render via conditional, and on success will redirect
        // ⚠️ DO NOT clear cart - inline form will redirect to return URL which triggers cart clear via useEffect
        return;
      }

      // ✅ For redirect: open Stripe, user will return to /checkout?payment=success&orderId=X
      if (intent.checkoutUrl) {
        addToast("מעביר אותך לדף התשלום...", "info");
        // ⚠️ DO NOT clear cart here - wait for return from Stripe
        setTimeout(() => {
          if (intent.checkoutUrl) {
            window.location.href = intent.checkoutUrl;
          }
        }, 500);
        return;
      }

      // Fallback: redirect to orders page
      addToast("המשך לעמוד ההזמנות", "info");
      navigate("/orders");
    } catch (e: any) {
      const msg = e?.data?.message || e?.message || "שגיאה ביצירת הזמנה";
      addToast(msg, "error");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                תהליך הזמנה
              </h1>
              <p className="text-gray-600">זרימה ברורה עד אישור הזמנה</p>
            </div>
            {/* Sticky Total */}
            <div className="text-right">
              <p className="text-sm text-gray-500">סכום כולל</p>
              <p className="text-3xl font-bold text-blue-600">
                {currencyTotal}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {items.length} מוצרים
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Stepper step={step} />

          {/* Empty Cart Warning */}
          {items.length === 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 font-semibold">
                ⚠️ העגלה ריקה - בחר מוצרים כדי להמשיך
              </p>
            </div>
          )}

          {/* Step 0: Cart Summary */}
          {step === 0 && (
            <section aria-labelledby="cart-summary-heading">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="cart-summary-heading"
                  className="text-xl font-semibold text-gray-900"
                >
                  🛒 סקירת עגלה
                </h2>
                <button
                  className="text-blue-600 hover:text-blue-800 text-sm"
                  onClick={() => navigate("/cart")}
                >
                  ערוך עגלה
                </button>
              </div>

              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-3 border rounded"
                  >
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      📦
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {item.product?.name || "Product"}
                      </p>
                      <p className="text-sm text-gray-600">
                        כמות: {item.quantity} × ₪
                        {(
                          item.price ??
                          item.product?.price ??
                          0
                        ).toLocaleString()}
                      </p>
                    </div>
                    <div className="font-semibold text-gray-900">
                      ₪
                      {(
                        item.quantity * (item.price ?? item.product?.price ?? 0)
                      ).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">סכום כולל</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencyTotal}
                  </p>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  onClick={() => setStep(1)}
                  disabled={items.length === 0}
                >
                  המשך לכתובת
                </button>
              </div>
            </section>
          )}

          {/* Step 1: Address */}
          {step === 1 && (
            <section aria-labelledby="address-heading">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="address-heading"
                  className="text-xl font-semibold text-gray-900"
                >
                  📍 כתובת משלוח
                </h2>
                <button
                  className="text-sm text-gray-700 hover:text-gray-900"
                  onClick={() => setStep(0)}
                >
                  ⬅️ חזרה לעגלה
                </button>
              </div>
              {isAddressesLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="p-4 border rounded-lg bg-gray-50 animate-pulse"
                    >
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : addresses.length === 0 ? (
                <div>
                  <p className="text-gray-700 mb-3">
                    אין כתובות — הוסף אחת עכשיו:
                  </p>
                  <QuickAddressForm
                    onCreate={async (payload) => {
                      const created = await createAddressMutation(
                        payload
                      ).unwrap();
                      setSelectedAddress(created);
                      try {
                        localStorage.setItem("selectedAddressId", created._id);
                      } catch {}
                      addToast("כתובת נוספה", "success");
                    }}
                    isSubmitting={isCreatingAddress}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr._id}
                      className={`p-4 border rounded-lg cursor-pointer ${
                        selectedAddress?._id === addr._id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300"
                      }`}
                      onClick={() => {
                        setSelectedAddress(addr);
                        try {
                          localStorage.setItem("selectedAddressId", addr._id);
                        } catch {}
                      }}
                    >
                      {addr.isDefault && (
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                          ⭐ ברירת מחדל
                        </span>
                      )}
                      <p className="font-medium text-gray-900">{addr.street}</p>
                      <p className="text-sm text-gray-600">
                        {addr.city}, {addr.state} {addr.zipCode}
                      </p>
                      <p className="text-sm text-gray-600">{addr.country}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                  onClick={() => setStep(0)}
                >
                  ⬅️ חזרה לעגלה
                </button>
                <button
                  disabled={!selectedAddress || isAddressesLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  onClick={() => {
                    if (!selectedAddress) {
                      addToast("בחר כתובת כדי להמשיך", "error");
                      return;
                    }
                    setStep(2);
                  }}
                  title={!selectedAddress ? "בחר כתובת קודם" : ""}
                >
                  {isAddressesLoading ? "טוען..." : "המשך לתשלום"}
                </button>
              </div>
            </section>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <section aria-labelledby="payment-heading">
              <h2
                id="payment-heading"
                className="text-xl font-semibold text-gray-900 mb-4"
              >
                💳 שיטת תשלום
              </h2>

              {/* Test Card Information */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <p className="font-semibold mb-2">🧪 מספרי אשראי לבדיקה:</p>
                <ul className="space-y-1 font-mono text-xs">
                  <li>
                    ✓ חדש: <code>4242 4242 4242 4242</code>
                  </li>
                  <li>
                    ✗ דחיה: <code>4000 0000 0000 0002</code>
                  </li>
                  <li>
                    3D: <code>4000 2500 0000 3010</code>
                  </li>
                  <li>אחרי זה הכנס כל תאריך ו-CVC</li>
                </ul>
              </div>

              {/* Payment Method Selection */}
              <fieldset className="space-y-3 mb-4">
                <legend className="font-medium text-gray-900 mb-2">
                  בחר שיטת תשלום:
                </legend>
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={!useInlineElements}
                    onChange={() => setUseInlineElements(false)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      🔗 Stripe Redirect
                    </p>
                    <p className="text-sm text-gray-600">
                      עבור ל-Stripe כדי להזין פרטי כרטיס. בטוח וקל.
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={useInlineElements}
                    onChange={() => setUseInlineElements(true)}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      💻 Inline Elements
                    </p>
                    <p className="text-sm text-gray-600">
                      הזן פרטי כרטיס ישירות כאן. מהיר יותר.
                    </p>
                  </div>
                </label>
              </fieldset>

              {/* Inline Elements Info */}
              {useInlineElements && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                  <p>📌 לאחר התשלום הצליח, תוידלג לדף ההזמנה שלך אוטומטית.</p>
                </div>
              )}

              <div className="flex justify-between mt-6">
                <button
                  disabled={isCreatingOrder || isCreatingPayment}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                  onClick={() => setStep(1)}
                >
                  ⬅️ חזרה לכתובת
                </button>
                <button
                  disabled={isCreatingOrder || isCreatingPayment}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  onClick={() => setStep(3)}
                >
                  המשך לסקירה
                </button>
              </div>
            </section>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <section aria-labelledby="review-heading">
              <div className="flex items-center justify-between mb-4">
                <h2
                  id="review-heading"
                  className="text-xl font-semibold text-gray-900"
                >
                  🧾 סקירת הזמנה
                </h2>
                <button
                  className="text-sm text-gray-700 hover:text-gray-900"
                  onClick={() => navigate("/cart")}
                >
                  ערוך עגלה
                </button>
              </div>

              {/* Info Alert */}
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  📋 בדוק את הפרטים שלך. לאחר לחיצה על "אשר הזמנה", תועבר דף
                  התשלום של Stripe.
                </p>
              </div>

              {/* ✅ Inline Payment Form - if waiting for inline payment */}
              {currentOrder &&
                currentIntent?.clientSecret &&
                useInlineElements && (
                  <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      💳 הזן פרטי כרטיס
                    </h3>
                    <StripeElementsForm
                      clientSecret={currentIntent.clientSecret}
                      orderId={currentOrder._id}
                      onSuccess={() => {
                        addToast("✅ תשלום מאושר!", "success");
                      }}
                      onError={(err) => {
                        addToast(`❌ ${err}`, "error");
                        setCurrentOrder(null);
                        setCurrentIntent(null);
                      }}
                      isSubmitting={isCreatingPayment}
                    />
                  </div>
                )}

              <div className="space-y-4">
                {items.length === 0 ? (
                  <div className="p-6 border rounded text-center">
                    <p className="text-gray-700">העגלה ריקה — חזור למוצרים</p>
                  </div>
                ) : (
                  items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        📦
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          כמות: {item.quantity} × ₪
                          {(
                            item.price ??
                            item.product?.price ??
                            0
                          ).toLocaleString()}
                        </p>
                      </div>
                      <div className="font-semibold text-gray-900">
                        ₪
                        {(
                          item.quantity *
                          (item.price ?? item.product?.price ?? 0)
                        ).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">כתובת משלוח</p>
                    <button
                      className="text-sm text-blue-600"
                      onClick={() => setStep(1)}
                    >
                      ערוך
                    </button>
                  </div>
                  {selectedAddress ? (
                    <div className="text-gray-800">
                      <p className="font-medium">{selectedAddress.street}</p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress.city}
                        {selectedAddress.state
                          ? `, ${selectedAddress.state}`
                          : ""}{" "}
                        {selectedAddress.zipCode}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress.country}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-600">לא נבחרה כתובת</p>
                  )}
                </div>
                <div className="p-4 border rounded">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">תשלום</p>
                    <button
                      className="text-sm text-blue-600"
                      onClick={() => setStep(2)}
                    >
                      ערוך
                    </button>
                  </div>
                  <p className="font-medium text-gray-900">
                    {useInlineElements
                      ? "💻 Inline Elements"
                      : "🔗 Stripe Redirect"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">סכום כולל</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currencyTotal}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={
                      isCreatingOrder || isCreatingPayment || currentOrder
                    }
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 disabled:opacity-50"
                    onClick={() => setStep(2)}
                  >
                    ⬅️ חזרה לתשלום
                  </button>
                  {!currentOrder && (
                    <button
                      disabled={
                        items.length === 0 ||
                        isCreatingOrder ||
                        isCreatingPayment ||
                        !selectedAddress
                      }
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                      onClick={placeOrder}
                      title={!selectedAddress ? "בחר כתובת קודם" : ""}
                    >
                      {isCreatingOrder || isCreatingPayment ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          עיבוד...
                        </>
                      ) : (
                        "✓ אשר הזמנה ותשלום"
                      )}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
};

export default Checkout;

// Quick address form (minimal re-use)
type QuickPayload = {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
};
const QuickAddressForm: React.FC<{
  onCreate: (p: QuickPayload) => Promise<void> | void;
  isSubmitting?: boolean;
}> = ({ onCreate, isSubmitting }) => {
  const [form, setForm] = useState<QuickPayload>({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Israel",
    isDefault: false,
  });
  const disabled = !form.street || !form.city || !form.zipCode || !form.country;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          placeholder="רחוב"
          className="border rounded px-3 py-2"
          value={form.street}
          onChange={(e) => setForm({ ...form, street: e.target.value })}
        />
        <input
          placeholder="עיר"
          className="border rounded px-3 py-2"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
        />
        <input
          placeholder="מחוז/מדינה"
          className="border rounded px-3 py-2"
          value={form.state}
          onChange={(e) => setForm({ ...form, state: e.target.value })}
        />
        <input
          placeholder="מיקוד"
          className="border rounded px-3 py-2"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isDefault2"
          type="checkbox"
          checked={!!form.isDefault}
          onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
        />
        <label htmlFor="isDefault2" className="text-sm text-gray-700">
          הגדר כברירת מחדל
        </label>
      </div>
      <div className="flex justify-end">
        <button
          disabled={disabled || isSubmitting}
          onClick={() => onCreate(form)}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
        >
          {isSubmitting ? "שומר..." : "שמור כתובת"}
        </button>
      </div>
    </div>
  );
};
