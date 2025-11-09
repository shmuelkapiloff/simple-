"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProducts = getProducts;
exports.getProduct = getProduct;
const product_service_1 = require("../services/product.service");
const response_1 = require("../utils/response");
async function getProducts(_req, res) {
    const products = await (0, product_service_1.listProducts)();
    res.json((0, response_1.ok)(products));
}
async function getProduct(req, res) {
    const { id } = req.params;
    const product = await (0, product_service_1.getProductById)(id);
    if (!product)
        return res.status(404).json((0, response_1.fail)("Product not found"));
    res.json((0, response_1.ok)(product));
}
