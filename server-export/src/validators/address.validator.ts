import { z } from "zod";

// Address validation
export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
  isDefault: z.boolean().optional(),
});

export type AddressInput = z.infer<typeof addressSchema>;

// Update address validation
export const updateAddressSchema = addressSchema.partial();

export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
