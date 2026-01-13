import { Router } from "express";
import { getProducts, getProduct } from "../controllers/product.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { validateProductId } from "../middlewares/validateObjectId.middleware";

export const productRouter = Router();

productRouter.get("/", asyncHandler(getProducts));
productRouter.get("/:id", validateProductId, asyncHandler(getProduct));

export default productRouter;
