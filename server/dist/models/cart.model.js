"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartModel = void 0;
const mongoose_1 = require("mongoose");
// Cart Item Schema - פריט בעגלה
const cartItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });
// Cart Schema - עגלת קניות
const cartSchema = new mongoose_1.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    items: [cartItemSchema],
    total: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    // Index compound לחיפוש מהיר
    index: [
        { sessionId: 1 },
        { userId: 1 },
        { sessionId: 1, userId: 1 }
    ]
});
exports.CartModel = (0, mongoose_1.model)("Cart", cartSchema);
