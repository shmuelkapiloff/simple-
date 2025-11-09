"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProducts = listProducts;
exports.getProductById = getProductById;
const product_model_1 = require("../models/product.model");
async function listProducts() {
    return product_model_1.ProductModel.find({ isActive: true }).lean();
}
async function getProductById(id) {
    return product_model_1.ProductModel.findById(id).lean();
}
