import {
  AddressModel,
  CreateAddressInput,
  UpdateAddressInput,
} from "../models/Address";

export class AddressService {
  /**
   * Get all addresses for a user
   */
  static async getAddresses(userId: string) {
    const addresses = await AddressModel.find({ userId }).sort({
      isDefault: -1,
      createdAt: -1,
    }); // Default first, then newest

    return addresses;
  }

  /**
   * Get default address for a user
   */
  static async getDefaultAddress(userId: string) {
    const address = await AddressModel.findOne({
      userId,
      isDefault: true,
    });

    if (!address) {
      throw new Error("No default address found");
    }

    return address;
  }

  /**
   * Get address by ID
   */
  static async getAddressById(userId: string, addressId: string) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    return address;
  }

  /**
   * Create new address
   */
  static async createAddress(
    userId: string,
    data: Omit<CreateAddressInput, "userId">
  ) {
    // Check if this is user's first address
    const existingAddresses = await AddressModel.countDocuments({ userId });

    // If first address, make it default
    const addressData: CreateAddressInput = {
      userId,
      ...data,
      isDefault: existingAddresses === 0 ? true : data.isDefault || false,
    };

    const address = await AddressModel.create(addressData);

    return address;
  }

  /**
   * Update address
   */
  static async updateAddress(
    userId: string,
    addressId: string,
    data: UpdateAddressInput
  ) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // Update fields
    Object.assign(address, data);
    await address.save();

    return address;
  }

  /**
   * Delete address
   */
  static async deleteAddress(userId: string, addressId: string) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // If deleting default address, set another as default
    if (address.isDefault) {
      const otherAddress = await AddressModel.findOne({
        userId,
        _id: { $ne: addressId },
      });

      if (otherAddress) {
        otherAddress.isDefault = true;
        await otherAddress.save();
      }
    }

    await AddressModel.deleteOne({ _id: addressId });

    return { message: "Address deleted successfully" };
  }

  /**
   * Set address as default
   */
  static async setDefaultAddress(userId: string, addressId: string) {
    const address = await AddressModel.findOne({
      _id: addressId,
      userId,
    });

    if (!address) {
      throw new Error("Address not found");
    }

    // The pre-save middleware will handle removing default from others
    address.isDefault = true;
    await address.save();

    return address;
  }
}
