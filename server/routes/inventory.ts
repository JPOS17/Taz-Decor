import express from "express";
import { requireManagerOrAdmin } from "../middleware/authMiddleware";
import {
  getAllProductsForManagement,
  getVariantForEdit,
  createProduct,
  createVariant,
  updateVariant,
  addImageToVariant,
  deleteImage,
  updateImageOrder,
  setPrimaryImage,
  deleteVariant,
  getProductVariants,
  toggleVariantStatus,
  previewProductSKUByType,
  previewVariantSKU,
} from "../controllers/inventoryController";

export const inventoryRouter = express.Router();

// ============================================================================
// MIDDLEWARE — Manager/admin only for all inventory routes
// ============================================================================

inventoryRouter.use(requireManagerOrAdmin);

// ============================================================================
// PRODUCT ROUTES
// ============================================================================

// GET all products for management with optional filters
inventoryRouter.get("/", getAllProductsForManagement);

// GET all variants for a specific product — MUST BE BEFORE /:variantId
inventoryRouter.get("/by-product/:productId/variants", getProductVariants);

// GET SKU preview for new product by product type
inventoryRouter.get("/preview-sku/product-type/:productTypeId", previewProductSKUByType);

// GET SKU preview for new variant on an existing product
inventoryRouter.get("/preview-sku/product/:productId", previewVariantSKU);

// POST create new product
inventoryRouter.post("/", createProduct);

// POST create new variant for an existing product
inventoryRouter.post("/by-product/:productId/variants", createVariant);

// ============================================================================
// VARIANT ROUTES — MUST BE AFTER STATIC ROUTES
// ============================================================================

// GET specific variant for editing
inventoryRouter.get("/:variantId", getVariantForEdit);

// PUT update variant details
inventoryRouter.put("/:variantId", updateVariant);

// PUT toggle variant active status
inventoryRouter.put("/:variantId/status", toggleVariantStatus);

// DELETE variant (and product if last variant)
inventoryRouter.delete("/:variantId", deleteVariant);

// ============================================================================
// IMAGE MANAGEMENT ROUTES
// ============================================================================

// POST add image to variant
inventoryRouter.post("/:variantId/images", addImageToVariant);

// PUT reorder images for a variant
inventoryRouter.put("/:variantId/images/reorder", updateImageOrder);

// PUT set image as primary
inventoryRouter.put("/images/:imageId/primary", setPrimaryImage);

// DELETE image
inventoryRouter.delete("/images/:imageId", deleteImage);