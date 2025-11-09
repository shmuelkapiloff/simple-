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
    price: {
      type: Number,
      required: true,
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
export type ICartItem = InferSchemaType<typeof cartItemSchema>;
export type ICart = InferSchemaType<typeof cartSchema>;
export const CartModel = model("Cart", cartSchema);
