import { Request, Response } from "express";
import { AddressService } from "../services/addresses.service";
import {
  addressSchema,
  updateAddressSchema,
} from "../validators/address.validator";
import { UnauthorizedError, log } from "../utils/asyncHandler";

// DTO for address creation
export interface CreateAddressDTO {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export class AddressController {
  static async getAddresses(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError();
    log.info("Fetching addresses", { userId });
    const addresses = await AddressService.getAddresses(userId);
    res.status(200).json({ success: true, data: addresses });
  }

  static async getDefaultAddress(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError();
    log.info("Fetching default address", { userId });
    const address = await AddressService.getDefaultAddress(userId);
    res.status(200).json({ success: true, data: address });
  }

  static async setDefaultAddress(req: Request, res: Response) {
    const userId = req.user?._id;
    const { addressId } = req.params;
    if (!userId) throw new UnauthorizedError();
    log.info("Setting default address", { userId, addressId });
    const address = await AddressService.setDefaultAddress(userId, addressId);
    res
      .status(200)
      .json({
        success: true,
        data: address,
        message: "Default address set successfully",
      });
  }

  static async getAddressById(req: Request, res: Response) {
    const userId = req.user?._id;
    const { addressId } = req.params;
    if (!userId) throw new UnauthorizedError();
    log.info("Fetching address", { userId, addressId });
    const address = await AddressService.getAddressById(userId, addressId);
    res.status(200).json({ success: true, data: address });
  }

  static async createAddress(req: Request, res: Response) {
    const userId = req.user?._id;
    if (!userId) throw new UnauthorizedError();
    const validated: CreateAddressDTO = addressSchema.parse(req.body);
    log.info("Creating address", { userId });
    const address = await AddressService.createAddress(userId, validated);
    res
      .status(201)
      .json({
        success: true,
        data: address,
        message: "Address created successfully",
      });
  }

  static async updateAddress(req: Request, res: Response) {
    const userId = req.user?._id;
    const { addressId } = req.params;
    if (!userId) throw new UnauthorizedError();
    const validated = updateAddressSchema.parse(req.body);
    log.info("Updating address", { userId, addressId });
    const address = await AddressService.updateAddress(
      userId,
      addressId,
      validated,
    );
    res
      .status(200)
      .json({
        success: true,
        data: address,
        message: "Address updated successfully",
      });
  }

  static async deleteAddress(req: Request, res: Response) {
    const userId = req.user?._id;
    const { addressId } = req.params;
    if (!userId) throw new UnauthorizedError();
    log.info("Deleting address", { userId, addressId });
    await AddressService.deleteAddress(userId, addressId);
    res.status(204).send();
  }
}
