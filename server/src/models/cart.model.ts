import { Schema, model, InferSchemaType, Types } from "mongoose";

// Cart Item Schema - פריט בעגלה
const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // מחיר מנעול רק בזמן תשלום
    lockedPrice: {
      type: Number,
      default: null, // null = משתמש בחנות, value = נעול בתשלום
    },
  },
  { _id: false }
);

// Cart Schema - עגלת קניות
const cartSchema = new Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
    // Index compound לחיפוש מהיר
    index: [{ sessionId: 1 }, { userId: 1 }, { sessionId: 1, userId: 1 }],
  }
);

// Types
export interface ICartItem {
  product: Types.ObjectId | any;
  quantity: number;
  lockedPrice: number | null; // null = משתמש בחנות, value = נעול בתשלום
}

export type ICart = InferSchemaType<typeof cartSchema>;
export const CartModel = model("Cart", cartSchema);

// Default export for compatibility
export default CartModel;
