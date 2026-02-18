import express from "express";
import { 
  getCart,
  syncCart,
  addToCart,
  removeFromCart,
  updateCartQuantity,
  updateCartCoupon,
  clearCart
} from "../controllers/cartController";
import { authenticateToken } from "../middleware/authMiddleware";

export const cartRouter = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// All cart routes require authentication
cartRouter.use(authenticateToken);

// ============================================================================
// CART ROUTES
// ============================================================================

// GET user's cart from database
cartRouter.get("/", getCart);

// POST sync localStorage cart to database
cartRouter.post("/sync", syncCart);

// POST add item to cart
cartRouter.post("/add", addToCart);

// PUT update cart item's selected coupon - MUST BE BEFORE /:variantId
cartRouter.put("/:variantId/coupon", updateCartCoupon);

// PUT update cart item quantity
cartRouter.put("/:variantId", updateCartQuantity);

// DELETE clear entire cart - MUST BE BEFORE /:variantId
cartRouter.delete("/clear", clearCart);

// DELETE remove specific item from cart
cartRouter.delete("/:variantId", removeFromCart);