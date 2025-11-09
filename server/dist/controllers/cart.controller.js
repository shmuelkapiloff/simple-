"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const cart_service_1 = require("../services/cart.service");
const response_1 = require("../utils/response");
class CartController {
    static async getCart(req, res) {
        try {
            const { sessionId } = req.query;
            console.log(`Getting cart for session: ${sessionId}`);
            if (!sessionId) {
                (0, response_1.sendError)(res, 'Session ID is required', 400);
                return;
            }
            const cart = await cart_service_1.CartService.getCart(sessionId);
            if (!cart) {
                (0, response_1.sendSuccess)(res, { sessionId, items: [], total: 0 });
                return;
            }
            (0, response_1.sendSuccess)(res, cart);
        }
        catch (error) {
            console.error('Error getting cart:', error);
            (0, response_1.sendError)(res, 'Failed to get cart', 500);
        }
    }
    static async addToCart(req, res) {
        try {
            const { sessionId, productId, quantity } = req.body;
            console.log(`Adding to cart: ${productId} x${quantity}`);
            if (!sessionId || !productId || !quantity) {
                (0, response_1.sendError)(res, 'Missing required fields', 400);
                return;
            }
            const cart = await cart_service_1.CartService.addToCart(sessionId, productId, quantity);
            (0, response_1.sendSuccess)(res, cart, 'Item added to cart');
        }
        catch (error) {
            console.error('Error adding to cart:', error);
            if (error.message?.includes('not found')) {
                (0, response_1.sendError)(res, error.message, 404);
            }
            else if (error.message?.includes('stock')) {
                (0, response_1.sendError)(res, error.message, 400);
            }
            else {
                (0, response_1.sendError)(res, 'Failed to add item to cart', 500);
            }
        }
    }
    static async updateQuantity(req, res) {
        try {
            const { sessionId, productId, quantity } = req.body;
            console.log(`Updating quantity: ${productId} to ${quantity}`);
            if (!sessionId || !productId || quantity === undefined) {
                (0, response_1.sendError)(res, 'Missing required fields', 400);
                return;
            }
            const cart = await cart_service_1.CartService.updateQuantity(sessionId, productId, quantity);
            if (!cart) {
                (0, response_1.sendError)(res, 'Cart not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, cart, 'Quantity updated');
        }
        catch (error) {
            console.error('Error updating quantity:', error);
            (0, response_1.sendError)(res, 'Failed to update quantity', 500);
        }
    }
    static async removeFromCart(req, res) {
        try {
            const { sessionId, productId } = req.body;
            console.log(`Removing from cart: ${productId}`);
            if (!sessionId || !productId) {
                (0, response_1.sendError)(res, 'Missing required fields', 400);
                return;
            }
            const cart = await cart_service_1.CartService.removeFromCart(sessionId, productId);
            if (!cart) {
                (0, response_1.sendError)(res, 'Cart not found', 404);
                return;
            }
            (0, response_1.sendSuccess)(res, cart, 'Item removed from cart');
        }
        catch (error) {
            console.error('Error removing from cart:', error);
            (0, response_1.sendError)(res, 'Failed to remove item', 500);
        }
    }
    static async clearCart(req, res) {
        try {
            const { sessionId } = req.body;
            console.log(`Clearing cart: ${sessionId}`);
            if (!sessionId) {
                (0, response_1.sendError)(res, 'Session ID is required', 400);
                return;
            }
            const success = await cart_service_1.CartService.clearCart(sessionId);
            if (!success) {
                (0, response_1.sendError)(res, 'Failed to clear cart', 500);
                return;
            }
            (0, response_1.sendSuccess)(res, { sessionId, items: [], total: 0 }, 'Cart cleared');
        }
        catch (error) {
            console.error('Error clearing cart:', error);
            (0, response_1.sendError)(res, 'Failed to clear cart', 500);
        }
    }
    static async getCartCount(req, res) {
        try {
            const { sessionId } = req.query;
            if (!sessionId) {
                (0, response_1.sendSuccess)(res, { count: 0 });
                return;
            }
            const cart = await cart_service_1.CartService.getCart(sessionId);
            const count = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            (0, response_1.sendSuccess)(res, { count });
        }
        catch (error) {
            console.error('Error getting cart count:', error);
            (0, response_1.sendSuccess)(res, { count: 0 });
        }
    }
}
exports.CartController = CartController;
