import express from "express";
import { 
  getWishlist,
  syncWishlist,
  addToWishlist,
  removeFromWishlist
} from "../controllers/wishlistController";
import { authenticateToken } from "../middleware/authMiddleware";

export const wishlistRouter = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// All wishlist routes require authentication
wishlistRouter.use(authenticateToken);

// ============================================================================
// WISHLIST ROUTES
// ============================================================================

// GET user's wishlist from database
wishlistRouter.get("/", getWishlist);

// POST sync localStorage wishlist to database
wishlistRouter.post("/sync", syncWishlist);

// POST add item to wishlist
wishlistRouter.post("/add", addToWishlist);

// DELETE remove item from wishlist
wishlistRouter.delete("/:variantId", removeFromWishlist);