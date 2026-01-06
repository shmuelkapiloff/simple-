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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    total: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Pre-save middleware to calculate total
cartSchema.pre("save", async function (next) {
  if (this.isModified("items")) {
    // Populate products if not already populated
    await this.populate("items.product");

    // Calculate total
    let total = 0;
    for (const item of this.items) {
      const product = item.product as any;
      const price = item.lockedPrice ?? product?.price ?? 0;
      total += price * item.quantity;
    }

    this.total = total;
    console.log(`💰 Cart total calculated: ${total}`);
  }
  next();
});

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
