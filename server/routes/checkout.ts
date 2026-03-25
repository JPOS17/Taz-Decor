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

// Validate address for guests
checkoutRouter.post("/guest/validate-address", validateAddressGuest);

// Validate cart contents for guests
checkoutRouter.post("/guest/validate-cart", validateCartGuest);

// Calculate shipping rates for guests (address passed inline in body)
checkoutRouter.post("/guest/calculate-shipping", calculateShippingGuest);

// Create a guest order
checkoutRouter.post("/guest/create-order", createGuestOrder);

// ============================================================================
// AUTH ROUTES — User checkout 
// ============================================================================

checkoutRouter.use(authenticateToken);

// VALIDATE address
checkoutRouter.post("/validate-address", validateAddressEndpoint);

// VALIDATE cart before checkout
checkoutRouter.post("/validate-cart", validateCart);

// VALIDATE coupons
checkoutRouter.post("/validate-coupons", validateCoupons);

// CALCULATE shipping rates
checkoutRouter.post("/calculate-shipping", calculateShipping);

// CREATE new order
checkoutRouter.post("/create-order", createOrder);
