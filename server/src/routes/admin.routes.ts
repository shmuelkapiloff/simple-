import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAdmin } from "../middlewares/auth.middleware";
import {
  validateProductId,
  validateObjectId,
} from "../middlewares/validateObjectId.middleware";
import { apiRateLimiter } from "../middlewares/rate-limiter.middleware";

const router = Router();

// All admin routes require auth + admin role + rate limiting
router.use(requireAdmin);
router.use(apiRateLimiter);

// Products
router.get("/products", AdminController.listProducts);
router.post("/products", AdminController.createProduct);
router.put("/products/:id", validateProductId, AdminController.updateProduct);
router.delete(
  "/products/:id",
  validateProductId,
  AdminController.deleteProduct,
);

// Users
router.get("/users", AdminController.listUsers);
router.put(
  "/users/:id/role",
  validateObjectId("id"),
  AdminController.updateUserRole,
);

// Orders
router.get("/orders", AdminController.listOrders);
router.put(
  "/orders/:id/status",
  validateObjectId("id"),
  AdminController.updateOrderStatus,
);

// Stats
router.get("/stats/summary", AdminController.getStats);

export default router;
