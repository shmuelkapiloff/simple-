import React, { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { selectIsAuthenticated } from "../app/authSlice";
      </nav>
    </div>
  );
};

  const handleSuccessNavigation = async () => {
    if (!returnedOrderId) return;
    try {
      await clearCartMutation({ sessionId }).unwrap();
    } catch {}
    dispatch(clearCart());
    navigate(`/orders/${returnedOrderId}`);
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
  const paymentCancelled = searchParams.get("payment") === "cancelled";
  const returnedOrderId = searchParams.get("orderId");

  const [step, setStep] = useState(0); // 0 cart, 1 address, 2 pay
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod] = useState<string>("stripe"); // Always use Stripe Redirect
  const [shouldPollPayment, setShouldPollPayment] = useState(
    Boolean(returnedOrderId)
  );
  const [isCartUpdating, setIsCartUpdating] = useState(false);

  // 🧪 Detect test mode
  const isTestMode = import.meta.env.VITE_API_URL?.includes("localhost") ||
    import.meta.env.DEV;

  const { data: addresses = [], isLoading: isAddressesLoading } =
    useGetAddressesQuery(undefined, {
      skip: !isAuthenticated,
    });
  const [createAddressMutation, { isLoading: isCreatingAddress }] =
    useCreateAddressMutation();
  const [createOrderMutation, { isLoading: isCreatingOrder }] =
    useCreateOrderMutation();
  const [clearCartMutation] = useClearCartMutation();
  const [updateCartQuantityMutation] = useUpdateCartQuantityMutation();
  const [removeFromCartMutation] = useRemoveFromCartMutation();

  // ✅ Poll payment status on return from Stripe ONLY
  const { data: paymentStatus, refetch: refetchPaymentStatus } =
    useGetPaymentStatusQuery(returnedOrderId || "", {
      skip: !shouldPollPayment,
      pollingInterval: shouldPollPayment ? 3000 : 0,
    });

  useEffect(() => {
    setShouldPollPayment(Boolean(returnedOrderId));
  }, [returnedOrderId]);

  useEffect(() => {
    if (paymentStatus?.paymentStatus === "paid") {
      setShouldPollPayment(false);
    }
  }, [paymentStatus?.paymentStatus]);

  // ✅ Handle return from Stripe redirect - confirm payment before clearing cart
  useEffect(() => {
    if (!returnedOrderId) return;
    if (paymentStatus?.paymentStatus === "paid") {
      const timer = setTimeout(() => {
        handleSuccessNavigation();
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (paymentCancelled) {
      addToast("התשלום בוטל — העגלה שלך נשמרה", "info");
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

  const calculateTotalFromItems = (list: typeof items) =>
    list.reduce((sum, item) => {
      const price = item.price ?? item.product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0);

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      return handleRemoveItem(productId);
    }

    const snapshot = items.map((i) => ({
      ...i,
      product: { ...i.product },
    }));

    dispatch(updateQuantityOptimistic({ productId, quantity }));
    setIsCartUpdating(true);

    try {
      const updated = await updateCartQuantityMutation({
        productId,
        quantity,
      }).unwrap();

      if (updated) {
        dispatch(
          setCart({
            items: updated.items,
            total: updated.total ?? calculateTotalFromItems(updated.items || []),
            sessionId: updated.sessionId,
          })
        );
      }
    } catch (error: any) {
      dispatch(
        setCart({
          items: snapshot,
          total: calculateTotalFromItems(snapshot),
        })
      );
      addToast(
        error?.data?.message || "עדכון כמות נכשל - נסה שוב",
        "error"
      );
    } finally {
      setIsCartUpdating(false);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    const snapshot = items.map((i) => ({
      ...i,
      product: { ...i.product },
    }));

    dispatch(removeItemOptimistic({ productId }));
    setIsCartUpdating(true);

    try {
      const updated = await removeFromCartMutation({ productId }).unwrap();
      if (updated) {
        dispatch(
          setCart({
            items: updated.items,
            total: updated.total ?? calculateTotalFromItems(updated.items || []),
            sessionId: updated.sessionId,
          })
        );
      }
    } catch (error: any) {
      dispatch(
        setCart({
          items: snapshot,
          total: calculateTotalFromItems(snapshot),
        })
      );
      addToast(error?.data?.message || "מחיקה נכשלה - נסה שוב", "error");
    } finally {
      setIsCartUpdating(false);
    }
  };

  const handleSuccessNavigation = async () => {
    if (!returnedOrderId) return;
    try {
      await clearCartMutation({ sessionId }).unwrap();
    } catch {}
    dispatch(clearCart());
    navigate(`/orders/${returnedOrderId}`);
  };

  const placeOrder = async () => {
    if (!sessionId || !selectedAddress) return;
    try {
      const orderResponse = await createOrderMutation({
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
      const createdOrder = (orderResponse as any).order || orderResponse;
      const payment = (orderResponse as any).payment;

      if (!createdOrder?._id) {
        throw new Error("שגיאה ביצירת הזמנה - חסר מזהה הזמנה");
      }

      addToast(
        `הזמנה נוצרה בהצלחה! מס' הזמנה: ${createdOrder.orderNumber}`,
        "success"
      );

      if (payment?.status === "succeeded") {
        // ✅ Immediate success (e.g., mock payment) - clear cart now
        addToast("התשלום אושר בהצלחה", "success");
        try {
          await clearCartMutation({ sessionId }).unwrap();
          dispatch(clearCart());
        } catch (clearError) {
          // Log error silently - cart clearing is non-critical
        }
        navigate(`/orders/${createdOrder._id}`);
        return;
      }

      // ✅ Redirect to Stripe Checkout - user will return to /checkout?payment=success&orderId=X
      if (payment?.checkoutUrl) {
        addToast("מעביר אותך לדף התשלום המאובטח של Stripe...", "info");
        // ⚠️ DO NOT clear cart here - wait for webhook confirmation after payment
        setTimeout(() => {
          if (payment.checkoutUrl) {
            window.location.href = payment.checkoutUrl;
          }
        }, 800);
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
        {/* Success Screen */}
        {returnedOrderId && paymentStatus?.paymentStatus === "paid" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
            <div className="max-w-md mx-auto">
              {/* Success Animation */}
              <div className="mb-6 relative">
                <div className="inline-block">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                    <div className="text-6xl animate-bounce-slow">🎉</div>
                  </div>
                  {/* Checkmark overlay */}
                  <div className="absolute top-0 right-0 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl animate-scale-in-delayed shadow-lg">
                    ✓
                  </div>
                </div>
              </div>

              {/* Success Message */}
              <h1 className="text-3xl font-bold text-gray-900 mb-3 animate-slide-up">
                תודה רבה על ההזמנה! 🎊
              </h1>
              <p className="text-lg text-gray-600 mb-6 animate-slide-up-delayed">
                התשלום אושר בהצלחה והזמנתך בדרך אליך
              </p>

              {/* Order Details */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 mb-6 animate-slide-up-delayed-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">מספר הזמנה</span>
                  <span className="font-mono font-bold text-gray-900">
                    #{returnedOrderId.slice(-8).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-600">סכום ששולם</span>
                  <span className="font-bold text-green-600 text-lg">
                    {currencyTotal}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">זמן משוער</span>
                  <span className="font-medium text-gray-900">
                    3-5 ימי עסקים
                  </span>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-right animate-slide-up-delayed-3">
                <p className="text-sm text-blue-900 leading-relaxed">
                  📧 אישור ההזמנה נשלח למייל שלך
                  <br />
                  📦 תקבל עדכונים על מצב המשלוח
                  <br />
                  💬 צוות התמיכה זמין עבורך 24/7
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mb-4">
                <button
                  onClick={handleSuccessNavigation}
                  className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  הצג את ההזמנה עכשיו
                </button>
                <button
                  onClick={() => navigate("/orders")}
                  className="px-5 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  כל ההזמנות
                </button>
              </div>

              {/* Loading Indicator */}
              <div className="text-sm text-gray-500 animate-pulse">
                ננווט אוטומטית בעוד רגע (ניתן להמשיך ידנית)
              </div>
            </div>
          </div>
        )}

        {/* Payment Verification Loading Screen */}
        {returnedOrderId &&
          !paymentStatus?.paymentStatus &&
          !paymentCancelled && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-3">
                  ⏳ מאמת תשלום...
                </h1>
                <p className="text-gray-600 mb-4">
                  אנחנו מאשרים את התשלום שלך עם Stripe
                </p>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>✓ ההזמנה שלך נוצרה</p>
                  <p className="animate-pulse">⏱️ ממתין לאישור תשלום...</p>
                  <p className="text-xs mt-4 text-gray-400">
                    זה בדרך כלל לוקח 2-5 שניות. אפשר לרענן ידנית במידת הצורך.
                  </p>
                </div>
                <div className="mt-6 p-3 bg-blue-50 rounded-lg space-y-2">
                  <p className="text-xs text-blue-800">
                    💡 הזמנה {" "}
                    <span className="font-mono font-semibold">
                      {returnedOrderId.slice(-8)}
                    </span>
                  </p>
                  <p className="text-xs text-blue-800">
                    🔔 ההודעה הסופית מגיעה מ-webhook, אל תסגור את החלון
                  </p>
                  <div className="flex items-center justify-center gap-3 text-xs">
                    <button
                      onClick={() => refetchPaymentStatus()}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      רענון ידני
                    </button>
                    <button
                      onClick={() => navigate(`/orders/${returnedOrderId}`)}
                      className="px-3 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
                    >
                      עבור להזמנה
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Payment Cancelled Message */}
        {paymentCancelled && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center mb-6">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                התשלום בוטל
              </h1>
              <p className="text-gray-600 mb-6">
                לא נגרע כסף מהחשבון שלך. העגלה שלך נשמרה.
              </p>
              <button
                onClick={() => navigate("/checkout")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                נסה שוב
              </button>
            </div>
          </div>
        )}

        {/* Regular Checkout Flow - only show when not returning from payment */}
        {!returnedOrderId && !paymentCancelled && (
          <>
            {/* 🧪 Test Mode Warning */}
            {isTestMode && (
              <div className="bg-amber-100 border-2 border-amber-400 rounded-lg p-4 mb-6 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="text-3xl">⚠️</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 mb-1 text-lg">
                      🧪 מצב בדיקה (Test Mode)
                    </h3>
                    <p className="text-sm text-amber-800 mb-2">
                      המערכת פועלת במצב פיתוח. תשלומים לא אמיתיים.
                    </p>
                    <div className="bg-amber-50 border border-amber-300 rounded p-2 text-xs font-mono text-amber-900">
                      <p className="font-semibold mb-1">כרטיס בדיקה לתשלום מוצלח:</p>
                      <p>💳 4242 4242 4242 4242</p>
                      <p>📅 תאריך: כל תאריך עתידי | CVC: כל 3 ספרות</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">
                        ניהול מלא כאן בלי לצאת
                      </span>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => navigate("/cart")}
                      >
                        צפה בעגלה המלאה
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {items.map((item, idx) => {
                      const productId = item.product?._id;
                      if (!productId) return null;

                      const unitPrice =
                        item.price ?? item.product?.price ?? 0;

                      return (
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
                              ₪{unitPrice.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-sm">
                              <button
                                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                onClick={() =>
                                  handleUpdateQuantity(productId, item.quantity - 1)
                                }
                                disabled={isCartUpdating}
                                aria-label="הפחת כמות"
                              >
                                -
                              </button>
                              <span className="px-2 font-semibold text-gray-900">
                                {item.quantity}
                              </span>
                              <button
                                className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                onClick={() =>
                                  handleUpdateQuantity(productId, item.quantity + 1)
                                }
                                disabled={isCartUpdating}
                                aria-label="הוסף כמות"
                              >
                                +
                              </button>
                              <button
                                className="ml-3 text-red-600 hover:text-red-700 disabled:opacity-50"
                                onClick={() => handleRemoveItem(productId)}
                                disabled={isCartUpdating}
                              >
                                🗑️ הסר
                              </button>
                            </div>
                          </div>
                          <div className="text-right font-semibold text-gray-900">
                            ₪
                            {(item.quantity * unitPrice).toLocaleString()}
                          </div>
                        </div>
                      );
                    })}
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
                            localStorage.setItem(
                              "selectedAddressId",
                              created._id
                            );
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
                              localStorage.setItem(
                                "selectedAddressId",
                                addr._id
                              );
                            } catch {}
                          }}
                        >
                          {addr.isDefault && (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-2">
                              ⭐ ברירת מחדל
                            </span>
                          )}
                          <p className="font-medium text-gray-900">
                            {addr.street}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state} {addr.zipCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.country}
                          </p>
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

              {/* Step 2: Pay & Review */}
              {step === 2 && (
                <section aria-labelledby="payment-heading">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2
                        id="payment-heading"
                        className="text-2xl font-bold text-gray-900"
                      >
                        💳 תשלום ואישור
                      </h2>
                      <p className="text-sm text-gray-600">
                        סגור הכל כאן ואז עובר ל-Stripe. אפשר לשנות כמות וכתובת לפני התשלום.
                      </p>
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <p>סטטוס מתעדכן בזמן אמת</p>
                      <p>אל תסגור את החלון בזמן התשלום</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="text-3xl">🔒</div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">
                              תשלום מאובטח דרך Stripe
                            </h3>
                            <p className="text-sm text-gray-700 mb-2">
                              נחזיר אותך אוטומטית אחרי התשלום ונאמת דרך webhook.
                            </p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              <li>✓ כרטיס אשראי, Apple Pay, Google Pay</li>
                              <li>✓ אבטחה ברמה בנקאית (PCI DSS Level 1)</li>
                              <li>✓ אין צורך לנקות עגלה – השרת עושה זאת אחרי אישור</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {isTestMode && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                          <p className="font-semibold text-amber-900 mb-2">
                            🧪 מצב פיתוח - כרטיסי בדיקה
                          </p>
                          <ul className="space-y-1 font-mono text-xs text-amber-800">
                            <li>✓ הצלחה: 4242 4242 4242 4242</li>
                            <li>✗ דחייה: 4000 0000 0000 0002</li>
                            <li>🔐 3D Secure: 4000 0025 0000 3155</li>
                          </ul>
                        </div>
                      )}

                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <span>🛒</span> סיכום עגלה
                          </h3>
                          <span className="text-xs text-gray-500">
                            שינויי כמות מתעדכנים מיד
                          </span>
                        </div>

                        {items.length === 0 ? (
                          <div className="p-6 text-center text-gray-600 bg-gray-50 rounded">
                            העגלה ריקה — הוסף פריטים
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {items.map((item, idx) => {
                              const productId = item.product?._id;
                              if (!productId) return null;
                              const unitPrice =
                                item.price ?? item.product?.price ?? 0;

                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-4 p-3 border rounded"
                                >
                                  <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-500">
                                    📦
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                      {item.product?.name || "Product"}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      ₪{unitPrice.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2 text-sm">
                                      <button
                                        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            productId,
                                            item.quantity - 1
                                          )
                                        }
                                        disabled={isCartUpdating}
                                      >
                                        -
                                      </button>
                                      <span className="px-2 font-semibold text-gray-900">
                                        {item.quantity}
                                      </span>
                                      <button
                                        className="px-2 py-1 border rounded hover:bg-gray-50 disabled:opacity-50"
                                        onClick={() =>
                                          handleUpdateQuantity(
                                            productId,
                                            item.quantity + 1
                                          )
                                        }
                                        disabled={isCartUpdating}
                                      >
                                        +
                                      </button>
                                      <button
                                        className="ml-3 text-red-600 hover:text-red-700 disabled:opacity-50"
                                        onClick={() => handleRemoveItem(productId)}
                                        disabled={isCartUpdating}
                                      >
                                        הסר
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-right font-semibold text-gray-900">
                                    ₪
                                    {(item.quantity * unitPrice).toLocaleString()}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-white border rounded-lg p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <span className="text-xl">📍</span>
                            כתובת משלוח
                          </h3>
                          <button
                            className="text-sm text-blue-600 hover:text-blue-800"
                            onClick={() => setStep(1)}
                          >
                            ערוך
                          </button>
                        </div>
                        {selectedAddress ? (
                          <div className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                            <p className="font-semibold mb-1">
                              {selectedAddress.street}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedAddress.city}
                              {selectedAddress.state
                                ? `, ${selectedAddress.state}`
                                : ""}{" "}
                              {selectedAddress.zipCode}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedAddress.country}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                            ⚠️ לא נבחרה כתובת
                          </p>
                        )}
                      </div>

                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              💳
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">Stripe Checkout</p>
                              <p className="text-xs text-gray-600 flex items-center gap-1">
                                <span>🔒</span> תשלום מאובטח
                              </p>
                            </div>
                          </div>
                          <span className="text-green-600 font-semibold text-sm">
                            מוכן לתשלום
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm mb-1">סכום כולל</p>
                            <p className="text-3xl font-bold">{currencyTotal}</p>
                            <p className="text-blue-100 text-xs mt-1">
                              {items.length} פריטים בהזמנה
                            </p>
                          </div>
                          <div className="text-6xl opacity-20">💰</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      disabled={isCreatingOrder}
                      className="px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition-all font-medium"
                      onClick={() => setStep(1)}
                    >
                      ⬅️ חזרה לכתובת
                    </button>
                    <button
                      disabled={
                        items.length === 0 ||
                        isCreatingOrder ||
                        !selectedAddress ||
                        isCartUpdating
                      }
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 font-bold text-lg shadow-lg hover:shadow-xl"
                      onClick={placeOrder}
                      title={!selectedAddress ? "בחר כתובת קודם" : ""}
                    >
                      {isCreatingOrder ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                          <span>יוצר הזמנה...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-2xl">🔒</span>
                          <span>אשר הזמנה ועבור לתשלום</span>
                          <span className="text-2xl">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Checkout;

// Add animation styles
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { transform: scale(0); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  @keyframes bounceSlow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out;
  }
  .animate-scale-in {
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .animate-scale-in-delayed {
    animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both;
  }
  .animate-slide-up {
    animation: slideUp 0.5s ease-out 0.2s both;
  }
  .animate-slide-up-delayed {
    animation: slideUp 0.5s ease-out 0.4s both;
  }
  .animate-slide-up-delayed-2 {
    animation: slideUp 0.5s ease-out 0.6s both;
  }
  .animate-slide-up-delayed-3 {
    animation: slideUp 0.5s ease-out 0.8s both;
  }
  .animate-bounce-slow {
    animation: bounceSlow 2s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

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
