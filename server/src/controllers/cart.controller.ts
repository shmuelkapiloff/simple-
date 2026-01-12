import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { sendSuccess, sendError } from "../utils/response";
import { logger } from "../utils/logger";

export class CartController {
  static async getCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      logger.debug(`Getting cart for user: ${userId}`);

      const cart = await CartService.getCart(userId);

      if (!cart) {
        sendSuccess(res, {
          userId,
          items: [],
          total: 0,
        });
        return;
      }

      sendSuccess(res, cart);
    } catch (error) {
      logger.error({ error }, "Error getting cart");
      sendError(res, 500, "Failed to get cart");
    }
  }

  static async addToCart(req: Request, res: Response): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      if (!productId || !quantity) {
        sendError(res, 400, "Missing required fields: productId and quantity");
        return;
      }

      logger.info(
        `Adding to cart: product ${productId} x${quantity} for user ${userId}`
      );

      const cart = await CartService.addToCart(productId, quantity, userId);

      // 🔍 Debug: log the response
      logger.debug(
        `Cart response: ${cart.items.length} items, total: ${cart.total}`
      );
      if (cart.items.length > 0) {
        const firstItem = cart.items[0];
        logger.debug(
          `First item: ${JSON.stringify({
            productId: firstItem.product,
            hasName: !!(firstItem.product as any)?.name,
            hasPrice: !!(firstItem.product as any)?.price,
          })}`
        );
      }

      sendSuccess(res, cart, "Item added to cart");
    } catch (error: any) {
      logger.error({ error }, "Error adding to cart");

      if (error.message?.includes("not found")) {
        sendError(res, 404, error.message);
      } else if (error.message?.includes("stock")) {
        sendError(res, 400, error.message);
      } else {
        sendError(res, 500, "Failed to add item to cart");
      }
    }
  }

  static async updateQuantity(req: Request, res: Response): Promise<void> {
    try {
      const { productId, quantity } = req.body;
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      if (!productId || quantity === undefined) {
        sendError(res, 400, "Missing required fields: productId and quantity");
        return;
      }

      logger.info(
        `Updating quantity: product ${productId} to ${quantity} for user ${userId}`
      );

      const cart = await CartService.updateQuantity(
        productId,
        quantity,
        userId
      );

      if (!cart) {
        sendError(res, 404, "Cart not found");
        return;
      }

      sendSuccess(res, cart, "Quantity updated");
    } catch (error: any) {
      logger.error({ error }, "Error updating quantity");
      sendError(res, 500, "Failed to update quantity");
    }
  }

  static async removeFromCart(req: Request, res: Response): Promise<void> {
    try {
      const { productId } = req.body;
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      if (!productId) {
        sendError(res, 400, "Missing required field: productId");
        return;
      }

      logger.info(
        `Removing from cart: product ${productId} for user ${userId}`
      );

      const cart = await CartService.removeFromCart(productId, userId);

      if (!cart) {
        sendError(res, 404, "Cart not found");
        return;
      }

      sendSuccess(res, cart, "Item removed from cart");
    } catch (error: any) {
      logger.error({ error }, "Error removing from cart");
      sendError(res, 500, "Failed to remove item");
    }
  }

  static async clearCart(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      logger.info(`Clearing cart for user: ${userId}`);

      const success = await CartService.clearCart(userId);

      if (!success) {
        sendError(res, 500, "Failed to clear cart");
        return;
      }

      sendSuccess(res, { userId, items: [], total: 0 }, "Cart cleared");
    } catch (error: any) {
      logger.error({ error }, "Error clearing cart");
      sendError(res, 500, "Failed to clear cart");
    }
  }

  static async getCartCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        sendSuccess(res, { count: 0 });
        return;
      }

      const cart = await CartService.getCart(userId);
      const count = cart
        ? cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
        : 0;

      sendSuccess(res, { count });
    } catch (error: any) {
      logger.error({ error }, "Error getting cart count");
      sendSuccess(res, { count: 0 });
    }
  }
}
