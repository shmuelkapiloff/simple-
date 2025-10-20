import { Router } from 'express';
import { getProducts, getProduct } from '../controllers/product.controller';

export const productRouter = Router();

productRouter.get('/', getProducts);
productRouter.get('/:id', getProduct);
