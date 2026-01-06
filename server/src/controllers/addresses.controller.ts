import { Request, Response } from "express";
import { AddressService } from "../services/addresses.service";
import { CreateAddressInput, UpdateAddressInput } from "../models/Address";

export class AddressController {
  /**
   * Get all addresses for user
   * GET /api/addresses
   */
  static async getAddresses(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const addresses = await AddressService.getAddresses(userId);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch addresses",
      });
    }
  }

  /**
   * Get default address
   * GET /api/addresses/default
   */
  static async getDefaultAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const address = await AddressService.getDefaultAddress(userId);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "No default address found",
      });
    }
  }

  /**
   * Get address by ID
   * GET /api/addresses/:addressId
   */
  static async getAddressById(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { addressId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const address = await AddressService.getAddressById(userId, addressId);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        message: error.message || "Address not found",
      });
    }
  }

  /**
   * Create new address
   * POST /api/addresses
   */
  static async createAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const data: Omit<CreateAddressInput, "userId"> = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      // Validate required fields
      if (!data.street || !data.city || !data.postalCode) {
        return res.status(400).json({
          success: false,
          message: "Street, city, and postal code are required",
        });
      }

      const address = await AddressService.createAddress(userId, data);

      res.status(201).json({
        success: true,
        data: address,
        message: "Address created successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create address",
      });
    }
  }

  /**
   * Update address
   * PUT /api/addresses/:addressId
   */
  static async updateAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { addressId } = req.params;
      const data: UpdateAddressInput = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const address = await AddressService.updateAddress(
        userId,
        addressId,
        data
      );

      res.status(200).json({
        success: true,
        data: address,
        message: "Address updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to update address",
      });
    }
  }

  /**
   * Delete address
   * DELETE /api/addresses/:addressId
   */
  static async deleteAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { addressId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const result = await AddressService.deleteAddress(userId, addressId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to delete address",
      });
    }
  }

  /**
   * Set address as default
   * POST /api/addresses/:addressId/set-default
   */
  static async setDefaultAddress(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { addressId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Not authenticated",
        });
      }

      const address = await AddressService.setDefaultAddress(userId, addressId);

      res.status(200).json({
        success: true,
        data: address,
        message: "Default address updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message || "Failed to set default address",
      });
    }
  }
}
