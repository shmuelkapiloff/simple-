import { Schema, model, Document } from "mongoose";

export interface IAddress extends Document {
  user: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: {
      type: String,
      required: true,
      ref: "User",
      index: true,
    },
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
      required: true,
      default: "Israel",
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

export const AddressModel = model<IAddress>("Address", AddressSchema);
export type CreateAddressInput = Omit<
  IAddress,
  "_id" | "createdAt" | "updatedAt"
>;
export type UpdateAddressInput = Partial<CreateAddressInput>;
