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

// ============================================================================
// MIDDLEWARE — Manager/admin only for all coupon management routes
// ============================================================================

couponManagementRouter.use(requireManagerOrAdmin);

// ============================================================================
// COLLECTION ROUTES
// ============================================================================

// GET all coupons with optional filters
couponManagementRouter.get("/", getAllCoupons);

// POST create new coupon
couponManagementRouter.post("/", createCoupon);

// ============================================================================
// STATIC ROUTES — MUST BE BEFORE /:couponId
// ============================================================================

// GET all coupon codes (for duplicate validation)
couponManagementRouter.get("/codes", getAllCouponCodes);

// GET categories list for coupon creation form
couponManagementRouter.get("/categories", getCategoriesForCoupons);

// GET product types list for coupon creation form
couponManagementRouter.get("/product-types", getProductTypesForCoupons);

// GET products list for coupon creation form
couponManagementRouter.get("/products", getProductsForCoupons);

// GET locations list for coupon creation form
couponManagementRouter.get("/locations", getLocationsForCoupons);

// GET preview of draft coupon before creation
couponManagementRouter.get("/preview-draft", previewDraftCoupon);

// GET variant by ID for coupon editing
couponManagementRouter.get("/variant/:variantId", getVariantForCoupon);

// ============================================================================
// DYNAMIC ROUTES — MUST BE AFTER STATIC ROUTES
// ============================================================================

// GET single coupon by ID
couponManagementRouter.get("/:couponId", getCouponById);

// PUT update coupon
couponManagementRouter.put("/:couponId", updateCoupon);

// PUT toggle coupon active status
couponManagementRouter.put("/:couponId/status", toggleCouponStatus);

// GET preview of products affected by coupon
couponManagementRouter.get("/:couponId/preview", previewCouponProducts);

// DELETE coupon
couponManagementRouter.delete("/:couponId", deleteCoupon);