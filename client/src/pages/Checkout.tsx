import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetCartQuery,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useCreateOrderMutation,
} from "../api";
import CartItem from "../components/CartItem";
import AddressForm from "../components/AddressForm";
import { useToast } from "../components/Toast";
import type { AddressRequest, CartItem as CartItemType } from "../types";

export default function Checkout() {
  const navigate = useNavigate();
  return <CheckoutFlow navigate={navigate} />;
}

// ---- Main checkout flow ----
function CheckoutFlow({
  navigate,
}: {
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: cartData, isLoading: cartLoading } = useGetCartQuery();
  const { data: addrData, isLoading: addrLoading } = useGetAddressesQuery();
  const [createAddress, { isLoading: creatingAddr }] =
    useCreateAddressMutation();
  const [createOrder, { isLoading: ordering }] = useCreateOrderMutation();
  const [selectedAddr, setSelectedAddr] = useState<string>("");
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  // Server returns data directly, not wrapped in { cart: ... } or { addresses: ... }
  const items = cartData?.data?.items ?? [];
  const total = cartData?.data?.total ?? 0;
  const addresses = Array.isArray(addrData?.data) ? addrData.data : [];

  // Auto-select default address
  useEffect(() => {
    if (!selectedAddr && addresses.length > 0) {
      const def = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddr(def._id);
    }
  }, [addresses, selectedAddr]);

  if (cartLoading || addrLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    navigate("/cart", { replace: true });
    return null;
  }

  const handleAddAddress = async (data: AddressRequest) => {
    try {
      const result = await createAddress(data).unwrap();
      setSelectedAddr(result.data.address._id);
      setShowAddrForm(false);
      toast.success("הכתובת נוספה בהצלחה");
    } catch {
      toast.error("שגיאה ביצירת כתובת");
    }
  };

  const handleOrder = async () => {
    setError("");
    const addr = addresses.find((a) => a._id === selectedAddr);
    if (!addr) {
      setError("יש לבחור כתובת למשלוח");
      return;
    }

    try {
      const result = await createOrder({
        shippingAddress: {
          fullName: addr.fullName,
          phone: addr.phone,
          street: addr.street,
          city: addr.city,
          postalCode: addr.postalCode,
          country: addr.country,
        },
        paymentMethod: "stripe",
      }).unwrap();

      const order = result.data.order;
      // checkoutUrl is inside payment object
      const checkoutUrl = result.data.payment?.checkoutUrl;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        navigate(`/orders/${order._id}`);
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { message?: string } };
      setError(apiErr.data?.message || "שגיאה ביצירת ההזמנה");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">השלמת הזמנה</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Address + Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Address selection */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">כתובת למשלוח</h2>

            {addresses.length === 0 && !showAddrForm ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-3">אין כתובות שמורות</p>
                <button
                  onClick={() => setShowAddrForm(true)}
                  className="text-primary-600 font-medium hover:underline"
                >
                  + הוסף כתובת
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {addresses.map((addr) => (
                    <label
                      key={addr._id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        selectedAddr === addr._id
                          ? "border-primary-500 bg-primary-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={selectedAddr === addr._id}
                        onChange={() => setSelectedAddr(addr._id)}
                        className="accent-primary-600"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{addr.fullName}</p>
                        <p className="text-sm text-gray-500" dir="ltr">
                          {addr.phone}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.street}, {addr.city}
                        </p>
                        <p className="text-sm text-gray-500">
                          {addr.postalCode}, {addr.country}
                        </p>
                      </div>
                      {addr.isDefault && (
                        <span className="mr-auto text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                          ברירת מחדל
                        </span>
                      )}
                    </label>
                  ))}
                </div>

                {!showAddrForm ? (
                  <button
                    onClick={() => setShowAddrForm(true)}
                    className="text-sm text-primary-600 font-medium hover:underline"
                  >
                    + כתובת חדשה
                  </button>
                ) : (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">כתובת חדשה</h3>
                    <AddressForm
                      onSubmit={handleAddAddress}
                      onCancel={() => setShowAddrForm(false)}
                      isLoading={creatingAddr}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Order items summary */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="font-bold text-lg mb-4">פריטים בהזמנה</h2>
            {items.map((item: CartItemType) => (
              <CartItem key={item.product._id} item={item} compact />
            ))}
          </div>
        </div>

        {/* Right: Summary */}
        <div>
          <div className="bg-white rounded-xl border p-6 sticky top-24">
            <h2 className="font-bold text-lg mb-4">סיכום הזמנה</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">פריטים ({items.length})</span>
                <span>₪{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">משלוח</span>
                <span className="text-green-600">חינם</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-lg font-bold">
                <span>סה"כ</span>
                <span>₪{total.toLocaleString()}</span>
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-50 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <button
              onClick={handleOrder}
              disabled={ordering || !selectedAddr}
              className="w-full mt-6 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50"
            >
              {ordering ? "יוצר הזמנה..." : "לתשלום עם Stripe"}
            </button>

            <p className="text-xs text-gray-400 text-center mt-3">
              תועבר לדף תשלום מאובטח של Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
