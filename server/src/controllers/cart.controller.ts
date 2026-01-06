import { Request, Response } from "express";
import { CartService } from "../services/cart.service";
import { sendSuccess, sendError } from "../utils/response";

export class CartController {
  static async getCart(req: Request, res: Response): Promise<void> {
    console.log("\n\n\n\n\nGetting cart...\n\n\n\n\n");

    try {
      const userId = (req as any).userId; // From requireAuth middleware

      console.log(`\nGetting cart for user: ${userId}`);

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

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
      console.error("Error getting cart:", error);
      sendError(res, 500, "Failed to get cart");
    }
  }

  static async addToCart(req: Request, res: Response): Promise<void> {
    console.log("\n\n\n\n\nAdding item to cart...\n\n\n\n\n$");
    try {
      const { productId, quantity } = req.body;
      const userId = (req as any).userId; // From requireAuth middleware

      console.log(`\nAdding to cart:\n ${productId}\n x${quantity}\n user: ${userId}`);

      if (!userId || !productId || !quantity) {
        sendError(res, 400, "Missing required fields");
        return;
      }

      const cart = await CartService.addToCart(productId, quantity, userId);
      sendSuccess(res, cart, "Item added to cart");
    } catch (error: any) {
      console.error("Error adding to cart:", error);

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
    console.log("\n\n\n\n\nUpdating item quantity...\n\n\n\n\n");

    try {
      const { productId, quantity } = req.body;
      const userId = (req as any).userId;

      console.log(`Updating quantity: ${productId} to ${quantity}`);

      if (!userId || !productId || quantity === undefined) {
        sendError(res, 400, "Missing required fields");
        return;
      }

      const cart = await CartService.updateQuantity(productId, quantity, userId);

      if (!cart) {
        sendError(res, 404, "Cart not found");
        return;
      }

      sendSuccess(res, cart, "Quantity updated");
    } catch (error: any) {
      console.error("Error updating quantity:", error);
      sendError(res, 500, "Failed to update quantity");
    }
  }

  static async removeFromCart(req: Request, res: Response): Promise<void> {
    console.log("\n\n\n\n\nRemoving item from cart...\n\n\n\n\n");

    try {
      const { productId } = req.body;
      const userId = (req as any).userId;

      console.log(`Removing from cart: ${productId}`);

      if (!userId || !productId) {
        sendError(res, 400, "Missing required fields");
        return;
      }

      const cart = await CartService.removeFromCart(productId, userId);

      if (!cart) {
        sendError(res, 404, "Cart not found");
        return;
      }

      sendSuccess(res, cart, "Item removed from cart");
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      sendError(res, 500, "Failed to remove item");
    }
  }

  static async clearCart(req: Request, res: Response): Promise<void> {
    console.log("\n\n\n\n\nClearing cart...\n\n\n\n\n");
    try {
      const userId = (req as any).userId;

      console.log(`Clearing cart for user: ${userId}`);

      if (!userId) {
        sendError(res, 401, "Authentication required");
        return;
      }

      const success = await CartService.clearCart(userId);

      if (!success) {
        sendError(res, 500, "Failed to clear cart");
        return;
      }

      sendSuccess(res, { userId, items: [], total: 0 }, "Cart cleared");
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      sendError(res, 500, "Failed to clear cart");
    }
  }

  static async getCartCount(req: Request, res: Response): Promise<void> {
    console.log("\n\n\n\n\nGetting cart count...\n\n\n\n\n");
    try {
      const userId = (req as any).userId;

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
      console.error("Error getting cart count:", error);
      sendSuccess(res, { count: 0 });
    }
  }
}
        sendError(res, 400, "Guest session ID is required");
        return;
      }

      const mergedCart = await CartService.mergeGuestCartToUser(
        guestSessionId,
        userId
      );

      if (!mergedCart) {
        sendSuccess(res, { message: "No guest cart to merge" });
        return;
      }

      sendSuccess(res, mergedCart, "Cart merged successfully");
    } catch (error: any) {
      console.error("Error merging cart:", error);
      sendError(res, 500, "Failed to merge cart");
    }
  }
}
