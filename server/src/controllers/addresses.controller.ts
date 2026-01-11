import { Request, Response } from "express";
import { AddressService } from "../services/addresses.service";
import {
  addressSchema,
  updateAddressSchema,
} from "../validators/address.validator";
import { UnauthorizedError, log } from "../utils/asyncHandler";

export class AddressController {
  /**
   * Get all addresses for user
   * GET /api/addresses
   */
  static async getAddresses(req: Request, res: Response) {
    const userId = (req as any).userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Fetching addresses", { userId });
    const addresses = await AddressService.getAddresses(userId);

    res.status(200).json({
      success: true,
      data: addresses,
    });
  }

  /**
   * Get default address
   * GET /api/addresses/default
   */
  static async getDefaultAddress(req: Request, res: Response) {
    const userId = (req as any).userId;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Fetching default address", { userId });
    const address = await AddressService.getDefaultAddress(userId);

    res.status(200).json({
      success: true,
      data: address,
    });
  }

  /**
   * Get address by ID
   * GET /api/addresses/:addressId
   */
  static async getAddressById(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { addressId } = req.params;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Fetching address", { userId, addressId });
    const address = await AddressService.getAddressById(userId, addressId);

    res.status(200).json({
      success: true,
      data: address,
    });
  }

  /**
   * Create new address
   * POST /api/addresses
   */
  static async createAddress(req: Request, res: Response) {
    const userId = (req as any).userId;
    const validated = addressSchema.parse(req.body);

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Creating address", { userId });
    const address = await AddressService.createAddress(userId, validated);

    res.status(201).json({
      success: true,
      data: address,
      message: "Address created successfully",
    });
  }

  /**
   * Update address
   * PUT /api/addresses/:addressId
   */
  static async updateAddress(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { addressId } = req.params;
    const validated = updateAddressSchema.parse(req.body);

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Updating address", { userId, addressId });
    const address = await AddressService.updateAddress(
      userId,
      addressId,
      validated
    );

    res.status(200).json({
      success: true,
      data: address,
      message: "Address updated successfully",
    });
  }

  /**
   * Delete address
   * DELETE /api/addresses/:addressId
   */
  static async deleteAddress(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { addressId } = req.params;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Deleting address", { userId, addressId });
    const result = await AddressService.deleteAddress(userId, addressId);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  }

  /**
   * Set address as default
   * POST /api/addresses/:addressId/set-default
   */
  static async setDefaultAddress(req: Request, res: Response) {
    const userId = (req as any).userId;
    const { addressId } = req.params;

    if (!userId) {
      throw new UnauthorizedError();
    }

    log.info("Setting default address", { userId, addressId });
    const address = await AddressService.setDefaultAddress(userId, addressId);

    res.status(200).json({
      success: true,
      data: address,
      message: "Default address updated successfully",
    });
  }
}
