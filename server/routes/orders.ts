import express from "express";
import {
  getUserOrders,
  getAllOrders,
  getOrderDetails,
  getOrderByNumber,
  getGuestOrderByNumber,
  updateOrderStatus,
  getOrderStatusHistory,
} from "../controllers/ordersControllers";
import { authenticateToken, requireRole } from "../middleware/authMiddleware";

export const ordersRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES — No authentication required
// ============================================================================

// GET guest order by order number and email
ordersRouter.get("/guest/orders/by-number/:orderNumber", getGuestOrderByNumber);

// ============================================================================
// AUTHENTICATED ROUTES — Authentication required for all routes below
// ============================================================================

ordersRouter.use(authenticateToken);

// ============================================================================
// MANAGER/ADMIN ROUTES
// ============================================================================

// GET all orders across all users
ordersRouter.get("/admin/orders", requireRole("manager", "admin"), getAllOrders);

// PUT update order status (shipped, delivered, cancelled, etc.)
ordersRouter.put("/orders/:orderId/status", requireRole("manager", "admin"), updateOrderStatus);

// ============================================================================
// CUSTOMER ROUTES
// ============================================================================

// GET current user's order history
ordersRouter.get("/orders", getUserOrders);

// GET order by order number — MUST BE BEFORE /:orderId
ordersRouter.get("/orders/by-number/:orderNumber", getOrderByNumber);

// GET order details by ID
ordersRouter.get("/orders/:orderId", getOrderDetails);

// GET order status history
ordersRouter.get("/orders/:orderId/status-history", getOrderStatusHistory);