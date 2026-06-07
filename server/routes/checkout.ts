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
  validateCoupons,
} from "../controllers/checkoutController";
import { authenticateToken } from "../middleware/authMiddleware";

export const checkoutRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES — Guest checkout (no authentication required)
// ============================================================================

// POST validate shipping address for guest
checkoutRouter.post("/guest/validate-address", validateAddressGuest);

// POST validate cart contents for guest
checkoutRouter.post("/guest/validate-cart", validateCartGuest);

// POST calculate shipping rates for guest
checkoutRouter.post("/guest/calculate-shipping", calculateShippingGuest);

// POST create guest order
checkoutRouter.post("/guest/create-order", createGuestOrder);

// ============================================================================
// AUTHENTICATED ROUTES — Authentication required
// ============================================================================

checkoutRouter.use(authenticateToken);

// POST validate shipping address
checkoutRouter.post("/validate-address", validateAddressEndpoint);

// POST validate cart before checkout
checkoutRouter.post("/validate-cart", validateCart);

// POST validate applied coupons
checkoutRouter.post("/validate-coupons", validateCoupons);

// POST calculate shipping rates
checkoutRouter.post("/calculate-shipping", calculateShipping);

// POST create order
checkoutRouter.post("/create-order", createOrder);