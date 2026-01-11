import { Router } from "express";
import { AddressController } from "../controllers/addresses.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

/**
 * All address routes require authentication
 */
router.use(authenticate);

/**
 * Address CRUD operations
 */

// GET /api/addresses - Get all addresses for user
router.get("/", asyncHandler(AddressController.getAddresses));

// GET /api/addresses/default - Get default address
router.get("/default", asyncHandler(AddressController.getDefaultAddress));

// GET /api/addresses/:addressId - Get address by ID
router.get("/:addressId", asyncHandler(AddressController.getAddressById));

// POST /api/addresses - Create new address
router.post("/", asyncHandler(AddressController.createAddress));

// PUT /api/addresses/:addressId - Update address
router.put("/:addressId", asyncHandler(AddressController.updateAddress));

// DELETE /api/addresses/:addressId - Delete address
router.delete("/:addressId", asyncHandler(AddressController.deleteAddress));

// POST /api/addresses/:addressId/set-default - Set address as default
router.post(
  "/:addressId/set-default",
  asyncHandler(AddressController.setDefaultAddress)
);

export default router;
