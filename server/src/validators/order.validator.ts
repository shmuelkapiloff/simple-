import { z } from "zod";

// Shipping address validation
export const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// Create order validation
export const createOrderSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required").optional(),
  shippingAddress: shippingAddressSchema,
  billingAddress: shippingAddressSchema.optional(),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Cancel order validation (just needs orderId from params)
export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
