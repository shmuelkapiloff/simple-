import { Request, Response } from "express";
import { listProducts, getProductById } from "../services/product.service";
import { ok, fail } from "../utils/response";

export async function getProducts(_req: Request, res: Response) {
  const products = await listProducts();
  res.json(ok(products));
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params;
  const product = await getProductById(id);
  if (!product) return res.status(404).json(fail("Product not found"));
  res.json(ok(product));
}

