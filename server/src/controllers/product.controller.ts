import { Request, Response } from "express";
import { listProducts, getProductById, getCategories, ProductFilters } from "../services/product.service";
import { ok, fail } from "../utils/response";

export async function getProducts(req: Request, res: Response) {
  const filters: ProductFilters = {
    category: req.query.category as string,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    search: req.query.search as string,
    featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
    sort: req.query.sort as any,
  };

  const products = await listProducts(filters);
  res.json(ok(products));
}

export async function getProduct(req: Request, res: Response) {
  const { id } = req.params;
  const product = await getProductById(id);
  if (!product) return res.status(404).json(fail("Product not found"));
  res.json(ok(product));
}

export async function getCategoriesList(_req: Request, res: Response) {
  const categories = await getCategories();
  res.json(ok(categories));
}


