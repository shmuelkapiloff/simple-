"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductModel = void 0;
const mongoose_1 = require("mongoose");
const productSchema = new mongoose_1.Schema({
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    featured: { type: Boolean, default: false },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });
exports.ProductModel = (0, mongoose_1.model)("Product", productSchema);
