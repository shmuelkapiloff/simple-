import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { selectIsAuthenticated } from "../app/authSlice";
import {
  selectCartItems,
  selectCartTotal,
  selectSessionId,
} from "../app/cartSlice";
import {
  Address,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useCreateOrderMutation,
  useCreatePaymentIntentMutation,
  useGetPaymentStatusQuery,
} from "../app/api";
import { useToast } from "../components/ToastProvider";

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
  credit_card: "כרטיס אשראי",
  paypal: "PayPal",
  cash: "מזומן",
};

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const items = useSelector(selectCartItems);
  const total = useSelector(selectCartTotal);
  const sessionId = useSelector(selectSessionId);

  const [step, setStep] = useState(0); // 0 cart summary, 1 address, 2 payment, 3 review
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>("credit_card");

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

  useEffect(() => {
    if (!isAuthenticated) {
      addToast("יש להתחבר כדי לבצע הזמנה", "error");
      navigate("/login");
      return;
    }
    if (!sessionId) {
      addToast("בעיה בסשן עגלה — נסה לרענן", "error");
      navigate("/");
    }
  }, [isAuthenticated, sessionId, addToast, navigate]);

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

  const canProceedAddress = !!selectedAddress || !isAddressesLoading;
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
          postalCode: selectedAddress.postalCode ?? selectedAddress.zipCode,
          country: selectedAddress.country,
        },
        paymentMethod,
      }).unwrap();
      addToast(
        `הזמנה נוצרה בהצלחה! מס' הזמנה: ${order.orderNumber}`,
        "success"
      );

      // יצירת כוונת תשלום להזמנה
      const intent = await createPaymentIntent({ orderId: order._id }).unwrap();

      if (intent.status === "succeeded") {
        addToast("התשלום אושר בהצלחה", "success");
        navigate("/orders");
        return;
      }

      if (intent.checkoutUrl) {
        // בדמו של mock אפשר לפתוח בלשונית חדשה
        try {
          window.open(intent.checkoutUrl, "_blank");
          addToast("נפתח דף תשלום", "info");
        } catch {
          addToast("פתח את קישור התשלום מהפרטים", "info");
        }
      }

      // אחרי יצירת intent, אפשר להציג סטטוס או להפנות לעמוד ההזמנות
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">תהליך הזמנה</h1>
          <p className="text-gray-600">זרימה ברורה עד אישור הזמנה</p>
        </header>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <Stepper step={step} />

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
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded"
                  onClick={() => setStep(0)}
                >
                  ⬅️ חזרה לעגלה
                </button>
                <button
                  disabled={!canProceedAddress}
                  className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  onClick={() => setStep(2)}
                >
                  המשך לתשלום
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
              <fieldset className="space-y-2">
                <legend className="sr-only">בחר שיטת תשלום</legend>
                {[
                  { key: "credit_card", label: "כרטיס אשראי" },
                  { key: "paypal", label: "PayPal" },
                  { key: "cash", label: "מזומן" },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-3 p-3 border rounded"
                  >
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === opt.key}
                      onChange={() => setPaymentMethod(opt.key)}
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </fieldset>
              <div className="flex justify-between mt-6">
                <button
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded"
                  onClick={() => setStep(1)}
                >
                  ⬅️ חזרה לכתובת
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded"
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
                        {selectedAddress.postalCode ?? selectedAddress.zipCode}
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
                    {paymentLabels[paymentMethod] || paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">סכום כולל</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {currencyTotal}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded"
                    onClick={() => setStep(2)}
                  >
                    ⬅️ חזרה לתשלום
                  </button>
                  <button
                    disabled={
                      items.length === 0 ||
                      isCreatingOrder ||
                      isCreatingPayment ||
                      !selectedAddress
                    }
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-400"
                    onClick={placeOrder}
                  >
                    {isCreatingOrder || isCreatingPayment
                      ? "מייצר הזמנה/תשלום..."
                      : "אשר הזמנה"}
                  </button>
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
