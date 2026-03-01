import { Router } from "express";
import { AddressController } from "../controllers/address.controller";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";
import { validateAddressId } from "../middlewares/validateObjectId.middleware";

const router = Router();

/**
 * All address routes require authentication
 */
router.use(requireAuth);

/**
 * Address CRUD operations
 */

// GET /api/addresses - Get all addresses for user
router.get("/", asyncHandler(AddressController.getAddresses));

// GET /api/addresses/default - Get default address
router.get("/default", asyncHandler(AddressController.getDefaultAddress));

// GET /api/addresses/:addressId - Get address by ID
router.get(
  "/:addressId",
  validateAddressId,
  asyncHandler(AddressController.getAddressById),
);

// POST /api/addresses - Create new address
router.post("/", asyncHandler(AddressController.createAddress));

// PUT /api/addresses/:addressId - Update address
router.put(
  "/:addressId",
  validateAddressId,
  asyncHandler(AddressController.updateAddress),
);

// DELETE /api/addresses/:addressId - Delete address
router.delete(
  "/:addressId",
  validateAddressId,
  asyncHandler(AddressController.deleteAddress),
);

// POST /api/addresses/:addressId/set-default - Set address as default
router.post(
  "/:addressId/set-default",
  validateAddressId,
  asyncHandler(AddressController.setDefaultAddress),
);

export default router;
