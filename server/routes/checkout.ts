import express from "express";
import {
  validateAddressEndpoint,
  validateAddressGuest,
  validateCart,
  validateCartGuest,
  calculateShipping,
  calculateShippingGuest,
  createOrder,
  createGuestOrder,
  getUserOrders,
  getOrderDetails,
  getOrderByNumber,
  getGuestOrderByNumber,
  validateCoupons, 
  updateOrderStatus,
  getOrderStatusHistory
} from "../controllers/checkoutController";
import { authenticateToken } from "../middleware/authMiddleware";

export const checkoutRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES — Guest checkout (no authentication required)
// ============================================================================

// Validate address for guests
checkoutRouter.post("/guest/validate-address", validateAddressGuest);

// Validate cart contents for guests
checkoutRouter.post("/guest/validate-cart", validateCartGuest);

// Calculate shipping rates for guests (address passed inline in body)
checkoutRouter.post("/guest/calculate-shipping", calculateShippingGuest);

// Create a guest order
checkoutRouter.post("/guest/create-order", createGuestOrder);

// Look up a guest order by order number + email (?email=...)
checkoutRouter.get("/guest/orders/by-number/:orderNumber", getGuestOrderByNumber);

// ============================================================================
// AUTHENTICATED ROUTES — All routes below require a valid JWT
// ============================================================================

checkoutRouter.use(authenticateToken);

// ============================================================================
// ADDRESS VALIDATION
// ============================================================================

// VALIDATE address using Shippo (for new/editing addresses)
checkoutRouter.post("/validate-address", validateAddressEndpoint);

// ============================================================================
// CART & VALIDATION ROUTES
// ============================================================================

// VALIDATE cart before checkout
checkoutRouter.post("/validate-cart", validateCart);

// VALIDATE coupons
checkoutRouter.post("/validate-coupons", validateCoupons);

// ============================================================================
// SHIPPING ROUTES
// ============================================================================

// CALCULATE shipping rates
checkoutRouter.post("/calculate-shipping", calculateShipping);

// ============================================================================
// ORDER ROUTES
// ============================================================================

// CREATE new order
checkoutRouter.post("/create-order", createOrder);

// GET all orders (admin/manager only - returns all orders regardless of user)
checkoutRouter.get("/admin/orders", getUserOrders);

// GET user's order history (customers - returns only their own orders)
checkoutRouter.get("/orders", getUserOrders);

// GET order by order number - MUST BE BEFORE :orderId route
checkoutRouter.get("/orders/by-number/:orderNumber", getOrderByNumber);

// GET order details by ID
checkoutRouter.get("/orders/:orderId", getOrderDetails);

// UPDATE order status (admin only)
checkoutRouter.put("/orders/:orderId/status", updateOrderStatus);

// GET order status history
checkoutRouter.get("/orders/:orderId/status-history", getOrderStatusHistory);