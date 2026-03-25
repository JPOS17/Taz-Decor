import express from "express";
import {
  getUserOrders,
  getOrderDetails,
  getOrderByNumber,
  getGuestOrderByNumber,
  updateOrderStatus,
  getOrderStatusHistory
} from "../controllers/ordersControllers";
import { authenticateToken } from "../middleware/authMiddleware";

export const ordersRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES — Guest checkout (no authentication required)
// ============================================================================

// Look up a guest order by order number + email (?email=...)
ordersRouter.get("/guest/orders/by-number/:orderNumber", getGuestOrderByNumber);

// ============================================================================
// AUTHENTICATED ROUTES — All routes below require a valid JWT
// ============================================================================

ordersRouter.use(authenticateToken);

// ============================================================================
// ORDER ROUTES
// ============================================================================

// GET all orders (admin/manager only - returns all orders regardless of user)
ordersRouter.get("/admin/orders", getUserOrders);

// GET user's order history (customers - returns only their own orders)
ordersRouter.get("/orders", getUserOrders);

// GET order by order number - MUST BE BEFORE :orderId route
ordersRouter.get("/orders/by-number/:orderNumber", getOrderByNumber);

// GET order details by ID
ordersRouter.get("/orders/:orderId", getOrderDetails);

// UPDATE order status (admin only)
ordersRouter.put("/orders/:orderId/status", updateOrderStatus);

// GET order status history
ordersRouter.get("/orders/:orderId/status-history", getOrderStatusHistory);