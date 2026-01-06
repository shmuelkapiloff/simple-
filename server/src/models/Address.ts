import { Schema, model, Document } from "mongoose";

// Interface for Address document
export interface IAddress extends Document {
  _id: string;
  userId: string;
  label: 'home' | 'work' | 'other';
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Address Schema
const AddressSchema = new Schema<IAddress>(
  {
    userId: {
      type: String,
      required: [true, "User ID is required"],
      ref: "User",
      index: true, // Index for fast queries by userId
    },

    label: {
      type: String,
      enum: {
        values: ['home', 'work', 'other'],
        message: 'Label must be either home, work, or other'
      },
      default: 'home',
    },

    street: {
      type: String,
      required: [true, "Street address is required"],
      trim: true,
      minlength: [3, "Street address must be at least 3 characters"],
      maxlength: [200, "Street address cannot exceed 200 characters"],
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
      minlength: [2, "City must be at least 2 characters"],
      maxlength: [100, "City cannot exceed 100 characters"],
    },

    postalCode: {
      type: String,
      required: [true, "Postal code is required"],
      trim: true,
      match: [/^[0-9]{5,10}$/, "Please provide a valid postal code"],
    },

    country: {
      type: String,
      trim: true,
      default: "Israel",
      maxlength: [100, "Country cannot exceed 100 characters"],
    },

    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Compound index for userId + isDefault for fast default address lookup
AddressSchema.index({ userId: 1, isDefault: 1 });

// Pre-save middleware: ensure only one default address per user
AddressSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    try {
      // Remove default from all other addresses of this user
      await AddressModel.updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { isDefault: false }
      );
      next();
    } catch (error) {
      next(error as Error);
    }
  } else {
    next();
  }
});

// Static method to get user's default address
AddressSchema.statics.findDefaultByUserId = function (userId: string) {
  return this.findOne({ userId, isDefault: true });
};

// Static method to get all addresses for a user
AddressSchema.statics.findByUserId = function (userId: string) {
  return this.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
};

// Create and export the Address model
export const AddressModel = model<IAddress>("Address", AddressSchema);

// Export types
export type CreateAddressInput = {
  userId: string;
  label?: 'home' | 'work' | 'other';
  street: string;
  city: string;
  postalCode: string;
  country?: string;
  isDefault?: boolean;
};

export type UpdateAddressInput = {
  label?: 'home' | 'work' | 'other';
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
};

export type AddressResponse = {
  _id: string;
  userId: string;
  label: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};