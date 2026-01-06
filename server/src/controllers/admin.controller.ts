import { Request, Response } from "express";
import { AdminService } from "../services/admin.service";

export class AdminController {
  // Products
  static async listProducts(req: Request, res: Response) {
    try {
      const includeInactive =
        req.query.includeInactive === "false" ? false : true;
      const products = await AdminService.listProducts(includeInactive);
      res.json({ success: true, data: { products } });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to fetch products",
        });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const product = await AdminService.createProduct(req.body);
      res.status(201).json({ success: true, data: { product } });
    } catch (error: any) {
      res
        .status(400)
        .json({
          success: false,
          message: error.message || "Failed to create product",
        });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const product = await AdminService.updateProduct(req.params.id, req.body);
      res.json({ success: true, data: { product } });
    } catch (error: any) {
      res
        .status(404)
        .json({
          success: false,
          message: error.message || "Product not found",
        });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const product = await AdminService.deleteProduct(req.params.id);
      res.json({
        success: true,
        data: { product },
        message: "Product disabled (soft delete)",
      });
    } catch (error: any) {
      res
        .status(404)
        .json({
          success: false,
          message: error.message || "Product not found",
        });
    }
  }

  // Users
  static async listUsers(req: Request, res: Response) {
    try {
      const page = parseInt((req.query.page as string) || "1", 10);
      const limit = parseInt((req.query.limit as string) || "20", 10);
      const users = await AdminService.listUsers(page, limit);
      res.json({ success: true, data: users });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to fetch users",
        });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const actingUserId = (req as any).userId;
      const { id } = req.params;
      const { role } = req.body;

      const user = await AdminService.updateUserRole(id, role, actingUserId);
      res.json({ success: true, data: { user } });
    } catch (error: any) {
      res
        .status(400)
        .json({
          success: false,
          message: error.message || "Failed to update role",
        });
    }
  }

  // Orders
  static async listOrders(req: Request, res: Response) {
    try {
      const { status, userId } = req.query;
      const orders = await AdminService.listOrders(
        status as string,
        userId as string
      );
      res.json({ success: true, data: { orders } });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to fetch orders",
        });
    }
  }

  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, message } = req.body;

      const order = await AdminService.updateOrderStatus(id, status, message);
      res.json({ success: true, data: { order } });
    } catch (error: any) {
      res
        .status(400)
        .json({
          success: false,
          message: error.message || "Failed to update order status",
        });
    }
  }

  // Stats
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getStatsSummary();
      res.json({ success: true, data: { stats } });
    } catch (error: any) {
      res
        .status(500)
        .json({
          success: false,
          message: error.message || "Failed to fetch stats",
        });
    }
  }
}
