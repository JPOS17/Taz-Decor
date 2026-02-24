import express from "express";
import { requireManagerOrAdmin } from "../middleware/authMiddleware";
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
  getUserCouponUsage
} from "../controllers/couponCustomerController";

export const listingsRouter = express.Router();

// ============================================================================
// PRODUCT LISTINGS
// ============================================================================

// GET /api/products - Get product preview with filters
listingsRouter.get("/", getProductPreview);

// ============================================================================
// PRODUCT COUPONS
// ============================================================================

// GET /api/products/coupons/preview - Get all active coupons for listings page
listingsRouter.get("/coupons/preview", getProductCouponsPreview);

// GET /api/products/coupons/applicable - Get applicable coupons for a variant
listingsRouter.get("/coupons/applicable", getApplicableCouponsForVariant);

// GET /api/products/coupons/check-custom-groups - Check custom group coupons
listingsRouter.get("/coupons/check-custom-groups", checkCustomGroupCoupons);

// GET /api/products/coupons/:couponId/eligible-products - Get eligible products for a coupon
listingsRouter.get("/coupons/:couponId/eligible-products", getCouponEligibleProducts);

listingsRouter.get('/coupons/user-usage', getUserCouponUsage);

// ============================================================================
// PRODUCT STATS
// ============================================================================

// GET /api/products/:variantId/stats - Get popularity stats
listingsRouter.get("/:variantId/stats", getProductStats);

// ============================================================================
// PRODUCT CATEGORIES (Manager/Admin Only)
// ============================================================================

// GET /api/products/:productId/categories - Get all categories for a product
listingsRouter.get("/:productId/categories", getProductCategories);

// POST /api/products/:productId/categories - Add category to product
listingsRouter.post("/:productId/categories", requireManagerOrAdmin, addProductCategory);

// PUT /api/products/:productId/categories/:categoryId - Update product-category relationship
listingsRouter.put("/:productId/categories/:categoryId", requireManagerOrAdmin, updateProductCategory);

// DELETE /api/products/:productId/categories/:categoryId - Remove category from product
listingsRouter.delete("/:productId/categories/:categoryId", requireManagerOrAdmin, removeProductCategory);

// ============================================================================
// PRODUCT DETAIL
// ============================================================================

// GET /api/products/:variantId - Get product detail (MUST be last to avoid route conflicts)
listingsRouter.get("/:variantId", getProductDetail);