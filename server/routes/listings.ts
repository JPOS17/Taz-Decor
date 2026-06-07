import express from "express";
import { requireManagerOrAdmin, authenticateToken } from "../middleware/authMiddleware";
import { getProductDetail, getProductPreview } from "../controllers/listingsController";
import { getProductStats } from "../controllers/statisticsController";
import {
  getProductCategories,
  addProductCategory,
  updateProductCategory,
  removeProductCategory,
} from "../controllers/categoriesAssignments";
import {
  getProductCouponsPreview,
  getApplicableCouponsForVariant,
  checkCustomGroupCoupons,
  getCouponEligibleProducts,
  getUserCouponUsage,
} from "../controllers/couponCustomerController";
import { getProductReviews } from "../controllers/reviewsController";

export const listingsRouter = express.Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// GET all products with filters (listings page)
listingsRouter.get("/", getProductPreview);

// ============================================================================
// COUPON ROUTES — MUST BE BEFORE /:variantId
// ============================================================================

// GET all active coupons for listings page banners
listingsRouter.get("/coupons/preview", getProductCouponsPreview);

// GET applicable coupons for a specific variant
listingsRouter.get("/coupons/applicable", getApplicableCouponsForVariant);

// GET custom group coupon eligibility check
listingsRouter.get("/coupons/check-custom-groups", checkCustomGroupCoupons);

// GET per-user coupon usage counts — authentication required
listingsRouter.get("/coupons/usage", authenticateToken, getUserCouponUsage);

// GET eligible products for a specific coupon — MUST BE BEFORE /:variantId
listingsRouter.get("/coupons/:couponId/eligible-products", getCouponEligibleProducts);

// ============================================================================
// STATS ROUTE — MUST BE BEFORE /:variantId
// ============================================================================

// GET popularity stats (wishlist count, cart count, review count, average rating)
listingsRouter.get("/:variantId/stats", getProductStats);

// ============================================================================
// CATEGORY ROUTES — MUST BE BEFORE /:variantId
// ============================================================================

// GET all categories for a product
listingsRouter.get("/:productId/categories", getProductCategories);

// POST add category to product — manager/admin only
listingsRouter.post("/:productId/categories", requireManagerOrAdmin, addProductCategory);

// PUT update product-category relationship — manager/admin only
listingsRouter.put("/:productId/categories/:categoryId", requireManagerOrAdmin, updateProductCategory);

// DELETE remove category from product — manager/admin only
listingsRouter.delete("/:productId/categories/:categoryId", requireManagerOrAdmin, removeProductCategory);

// ============================================================================
// PRODUCT DETAIL — MUST BE LAST (catches all remaining /:id patterns)
// ============================================================================

// GET product reviews
listingsRouter.get("/:productId/reviews", getProductReviews);

// GET product detail by variant ID
listingsRouter.get("/:variantId", getProductDetail);