import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { sendSuccess, sendError } from "../utils/response";

export class CartController {
  static async getCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.query;
      console.log(`Getting cart for session: ${sessionId}`);

      if (!sessionId) {
        sendError(res, "Session ID is required", 400);
        return;
      }

      const cart = await CartService.getCart(sessionId as string);

      if (!cart) {
        sendSuccess(res, { sessionId, items: [], total: 0 });
        return;
      }

      sendSuccess(res, cart);
    } catch (error) {
      console.error("Error getting cart:", error);
      sendError(res, "Failed to get cart", 500);
    }
  }

  static async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, productId, quantity } = req.body;
      console.log(`Adding to cart: ${productId} x${quantity}`);

      if (!sessionId || !productId || !quantity) {
        sendError(res, "Missing required fields", 400);
        return;
      }

      const cart = await CartService.addToCart(sessionId, productId, quantity);
      sendSuccess(res, cart, "Item added to cart");
    } catch (error: any) {
      console.error("Error adding to cart:", error);

      if (error.message?.includes("not found")) {
        sendError(res, error.message, 404);
      } else if (error.message?.includes("stock")) {
        sendError(res, error.message, 400);
      } else {
        sendError(res, "Failed to add item to cart", 500);
      }
    }
  }

  static async updateQuantity(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, productId, quantity } = req.body;
      console.log(`Updating quantity: ${productId} to ${quantity}`);

      if (!sessionId || !productId || quantity === undefined) {
        sendError(res, "Missing required fields", 400);
        return;
      }

      const cart = await CartService.updateQuantity(
        sessionId,
        productId,
        quantity
      );

      if (!cart) {
        sendError(res, "Cart not found", 404);
        return;
      }

      sendSuccess(res, cart, "Quantity updated");
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      sendError(res, "Failed to update quantity", 500);
    }
  }

  static async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, productId } = req.body;
      console.log(`Removing from cart: ${productId}`);

      if (!sessionId || !productId) {
        sendError(res, "Missing required fields", 400);
        return;
      }

      const cart = await CartService.removeFromCart(sessionId, productId);

      if (!cart) {
        sendError(res, "Cart not found", 404);
        return;
      }

      sendSuccess(res, cart, "Item removed from cart");
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      sendError(res, "Failed to remove item", 500);
    }
  }

  static async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      console.log(`Clearing cart: ${sessionId}`);

      if (!sessionId) {
        sendError(res, "Session ID is required", 400);
        return;
      }

      const success = await CartService.clearCart(sessionId);

      if (!success) {
        sendError(res, "Failed to clear cart", 500);
        return;
      }

      sendSuccess(res, { sessionId, items: [], total: 0 }, "Cart cleared");
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      sendError(res, "Failed to clear cart", 500);
    }
  }

  static async getCartCount(req: Request, res: Response): Promise<void> {
    console.log("9999Getting cart count...");
    try {
      const { sessionId } = req.query;

      if (!sessionId) {
        sendSuccess(res, { count: 0 });
        return;
      }

      const cart = await CartService.getCart(sessionId as string);
      const count = cart
        ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        : 0;

      sendSuccess(res, { count });
    } catch (error: any) {
      console.error("Error getting cart count:", error);
      sendSuccess(res, { count: 0 });
    }
  }
}
