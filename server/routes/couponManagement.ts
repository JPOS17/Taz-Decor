import express from "express";
import { requireManagerOrAdmin } from "../middleware/authMiddleware";
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCategoriesForCoupons,
  getProductTypesForCoupons,
  getProductsForCoupons,
  getLocationsForCoupons,
  previewCouponProducts,
  previewDraftCoupon,
  getAllCouponCodes,
  getVariantForCoupon,
} from "../controllers/couponManagementController";

export const couponManagementRouter = express.Router();

// Protect all coupon routes - only managers and admins
couponManagementRouter.use(requireManagerOrAdmin);

// ============================================================================
// COUPON MANAGEMENT
// ============================================================================

// GET /api/coupons - Get all coupons with filters
couponManagementRouter.get("/", getAllCoupons);

// ============================================================================
// DROPDOWN DATA (MUST BE BEFORE /:couponId)
// ============================================================================

// GET /api/coupons/codes - Get all coupon codes (for validation)
couponManagementRouter.get("/codes", getAllCouponCodes);

// GET /api/coupons/categories - Get categories for coupon creation
couponManagementRouter.get("/categories", getCategoriesForCoupons);

// GET /api/coupons/product-types - Get product types for coupon creation
couponManagementRouter.get("/product-types", getProductTypesForCoupons);

// GET /api/coupons/products - Get products for coupon creation
couponManagementRouter.get("/products", getProductsForCoupons);

// GET /api/coupons/locations - Get locations for coupon creation
couponManagementRouter.get("/locations", getLocationsForCoupons);

// ============================================================================
// PREVIEW & UTILITY (MUST BE BEFORE /:couponId)
// ============================================================================

// GET /api/coupons/preview-draft - Get preview of draft coupon (before creation)
couponManagementRouter.get("/preview-draft", previewDraftCoupon);

// GET /api/coupons/variant/:variantId - Get variant by ID (for editing)
couponManagementRouter.get("/variant/:variantId", getVariantForCoupon);

// ============================================================================
// DYNAMIC ROUTES (MUST BE LAST)
// ============================================================================

// GET /api/coupons/:couponId - Get single coupon by ID
couponManagementRouter.get("/:couponId", getCouponById);

// PUT /api/coupons/:couponId - Update coupon
couponManagementRouter.put("/:couponId", updateCoupon);

// DELETE /api/coupons/:couponId - Delete coupon
couponManagementRouter.delete("/:couponId", deleteCoupon);

// PUT /api/coupons/:couponId/status - Toggle coupon status
couponManagementRouter.put("/:couponId/status", toggleCouponStatus);

// GET /api/coupons/:couponId/preview - Get preview of products affected by coupon
couponManagementRouter.get("/:couponId/preview", previewCouponProducts);

// ============================================================================
// CREATE (POST can be anywhere since it's a different HTTP method)
// ============================================================================

// POST /api/coupons - Create new coupon
couponManagementRouter.post("/", createCoupon);
