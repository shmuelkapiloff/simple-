import { z } from "zod";

// Shipping address validation
export const shippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

// Payment method enum - currently only Stripe; add more later if needed
export const PaymentMethodEnum = z.enum([
  "stripe", // Online payment via Stripe (requires sessionId)
]);

export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// Create order validation with conditional sessionId requirement
export const createOrderSchema = z
  .object({
    sessionId: z.string().min(1, "Session ID is required").optional(),
    shippingAddress: shippingAddressSchema,
    billingAddress: shippingAddressSchema.optional(),
    paymentMethod: PaymentMethodEnum.default("stripe"),
    notes: z.string().optional(),
  })
  .refine(
    (data) => {
      // Require sessionId only for Stripe payments
      if (data.paymentMethod === "stripe" && !data.sessionId) {
        return false;
      }
      return true;
    },
    {
      message: "sessionId is required for Stripe payments",
      path: ["sessionId"],
    }
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// Cancel order validation (just needs orderId from params)
export const cancelOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;
