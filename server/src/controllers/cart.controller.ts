import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { sendSuccess, sendError } from "../utils/response";
import { logger } from "../utils/logger";
import { asyncHandler } from "../utils/asyncHandler";

export class CartController {
  static getCart = asyncHandler(async (req: Request, res: Response) => {
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
  });

  static addToCart = asyncHandler(async (req: Request, res: Response) => {
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
  });

  static updateQuantity = asyncHandler(async (req: Request, res: Response) => {
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

    const cart = await CartService.updateQuantity(productId, quantity, userId);

    if (!cart) {
      sendError(res, 404, "Cart not found");
      return;
    }

    sendSuccess(res, cart, "Quantity updated");
  });

  static removeFromCart = asyncHandler(async (req: Request, res: Response) => {
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

    logger.info(`Removing from cart: product ${productId} for user ${userId}`);

    const cart = await CartService.removeFromCart(productId, userId);

    if (!cart) {
      sendError(res, 404, "Cart not found");
      return;
    }

    sendSuccess(res, cart, "Item removed from cart");
  });

  static clearCart = asyncHandler(async (req: Request, res: Response) => {
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
  });

  static getCartCount = asyncHandler(async (req: Request, res: Response) => {
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
  });
}
