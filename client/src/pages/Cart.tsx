import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetCartQuery, useClearCartMutation } from "../api";
import { useAuth } from "../hooks";
import CartItem from "../components/CartItem";
import ConfirmDialog from "../components/ConfirmDialog";
import { useToast } from "../components/Toast";
import type { CartItem as CartItemType } from "../types";

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { data, isLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  });
  const [clearCart, { isLoading: clearing }] = useClearCartMutation();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const toast = useToast();

  // Server returns cart directly in data, not wrapped in { cart: ... }
  const cart = data?.data;
  const items = cart?.items ?? [];
  const total = cart?.total ?? 0;

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">העגלה שלך</h1>
        <p className="text-gray-500">יש להתחבר כדי לצפות בעגלה</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">העגלה שלך</h1>
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 py-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-6xl mb-4">🛒</p>
        <h1 className="text-2xl font-bold mb-2">העגלה ריקה</h1>
        <p className="text-gray-500 mb-4">עדיין לא הוספת מוצרים לעגלה</p>
        <Link
          to="/"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          לחנות
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          העגלה שלך ({items.length} פריטים)
        </h1>
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={clearing}
          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
        >
          נקה עגלה
        </button>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-6">
        {items.map((item: CartItemType) => (
          <CartItem key={item.product._id} item={item} />
        ))}
      </div>

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-center text-lg mb-4">
          <span className="font-medium">סה"כ</span>
          <span className="text-2xl font-bold">₪{total.toLocaleString()}</span>
        </div>
        <Link
          to="/checkout"
          className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-medium hover:bg-primary-700 transition"
        >
          לתשלום
        </Link>
        <Link
          to="/"
          className="block text-center text-sm text-gray-500 hover:text-gray-700 mt-3"
        >
          המשך בקניות
        </Link>
      </div>

      {showClearConfirm && (
        <ConfirmDialog
          title="ניקוי עגלה"
          message="האם לרוקן את כל פריטי העגלה?"
          confirmLabel="נקה עגלה"
          isLoading={clearing}
          onConfirm={async () => {
            try {
              await clearCart().unwrap();
              toast.success("העגלה נוקתה");
              setShowClearConfirm(false);
            } catch {
              toast.error("שגיאה בניקוי העגלה");
            }
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}
