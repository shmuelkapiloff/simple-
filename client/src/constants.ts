// ============================================================
// Shared status maps & constants used across multiple pages
// ============================================================

// Google OAuth Client ID (from .env, never hardcoded)
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const ORDER_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "ממתין", color: "bg-yellow-100 text-yellow-800" },
  pending_payment: {
    label: "ממתין לתשלום",
    color: "bg-orange-100 text-orange-800",
  },
  confirmed: { label: "אושר", color: "bg-blue-100 text-blue-800" },
  processing: { label: "בטיפול", color: "bg-purple-100 text-purple-800" },
  shipped: { label: "נשלח", color: "bg-indigo-100 text-indigo-800" },
  delivered: { label: "נמסר", color: "bg-green-100 text-green-800" },
  cancelled: { label: "בוטל", color: "bg-red-100 text-red-800" },
};

export const PAYMENT_STATUS_MAP: Record<
  string,
  { label: string; color: string }
> = {
  pending: { label: "ממתין", color: "text-yellow-600" },
  paid: { label: "שולם", color: "text-green-600" },
  failed: { label: "נכשל", color: "text-red-600" },
  refunded: { label: "הוחזר", color: "text-gray-600" },
};

export const ORDER_STATUSES = [
  "pending",
  "pending_payment",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
