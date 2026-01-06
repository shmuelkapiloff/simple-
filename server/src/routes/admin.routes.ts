import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { requireAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All admin routes require auth + admin role
router.use(requireAdmin);

// Products
router.get("/products", AdminController.listProducts);
router.post("/products", AdminController.createProduct);
router.put("/products/:id", AdminController.updateProduct);
router.delete("/products/:id", AdminController.deleteProduct);

// Users
router.get("/users", AdminController.listUsers);
router.put("/users/:id/role", AdminController.updateUserRole);

// Orders
router.get("/orders", AdminController.listOrders);
router.put("/orders/:id/status", AdminController.updateOrderStatus);

// Stats
router.get("/stats/summary", AdminController.getStats);

export default router;
