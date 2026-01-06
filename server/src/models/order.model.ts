import { Schema, model, Document } from "mongoose";

// Tracking History Item Interface
export interface ITrackingHistory {
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: Date;
  message?: string;
}

// Interface for Order document
export interface IOrder extends Document {
  _id: string;
  orderNumber: string;
  user: string;
  items: Array<{
    product: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  trackingHistory: ITrackingHistory[]; // ⬅️ חדש
  estimatedDelivery?: Date; // ⬅️ חדש
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Schema
const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    user: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
      index: true,
    },

    items: [
      {
        product: {
          type: String,
          ref: "Product",
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        image: String,
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'paypal', 'cash_on_delivery'],
    },

    shippingAddress: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        default: "Israel",
      },
    },

    // ⬅️ חדש - Tracking History
    trackingHistory: [
      {
        status: {
          type: String,
          enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        message: {
          type: String,
          maxlength: [500, "Message cannot exceed 500 characters"],
        },
      },
    ],

    // ⬅️ חדש - Estimated Delivery
    estimatedDelivery: {
      type: Date,
    },

    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ orderNumber: 1 });

// ⬅️ חדש - Pre-save middleware: add initial tracking entry
OrderSchema.pre("save", function (next) {
  if (this.isNew && this.trackingHistory.length === 0) {
    this.trackingHistory.push({
      status: 'pending',
      timestamp: new Date(),
      message: 'Order has been placed',
    });
    
    // Set estimated delivery (5 business days)
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 5);
    this.estimatedDelivery = estimatedDate;
  }
  next();
});

// Static methods
OrderSchema.statics.findByUserId = function (userId: string) {
  return this.find({ user: userId }).sort({ createdAt: -1 });
};

OrderSchema.statics.findByOrderNumber = function (orderNumber: string) {
  return this.findOne({ orderNumber });
};

// Create and export the Order model
export const OrderModel = model<IOrder>("Order", OrderSchema);

// Export types
export type CreateOrderInput = {
  user: string;
  items: Array<{
    product: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalAmount: number;
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country?: string;
  };
  notes?: string;
};

export type OrderResponse = {
  _id: string;
  orderNumber: string;
  user: string;
  items: any[];
  totalAmount: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  shippingAddress: any;
  trackingHistory: ITrackingHistory[];
  estimatedDelivery?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type TrackingResponse = {
  orderNumber: string;
  status: string;
  estimatedDelivery?: Date;
  trackingHistory: ITrackingHistory[];
  items: any[];
  totalAmount: number;
};