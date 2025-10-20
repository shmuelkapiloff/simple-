import { ProductModel } from '../models/product.model';

export async function listProducts() {
  return ProductModel.find({ isActive: true }).lean();
}

export async function getProductById(id: string) {
  return ProductModel.findById(id).lean();
}
