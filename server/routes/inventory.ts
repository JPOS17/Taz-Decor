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
  previewVariantSKU
} from "../controllers/inventoryController";

export const inventoryRouter = express.Router();

// Protect all product management routes - only managers and admins
inventoryRouter.use(requireManagerOrAdmin);

// ============================================================================
// PRODUCT ROUTES
// ============================================================================

// GET all products for management with optional category filter
inventoryRouter.get("/", getAllProductsForManagement);

// GET all variants for a specific product - MUST BE BEFORE /:variantId
inventoryRouter.get("/by-product/:productId/variants", getProductVariants);

// GET preview SKU for new product (based on product_type_id)
inventoryRouter.get("/preview-sku/product-type/:productTypeId", previewProductSKUByType);

// GET preview SKU for new variant
inventoryRouter.get("/preview-sku/product/:productId", previewVariantSKU);

// CREATE new product
inventoryRouter.post("/", createProduct);

// ============================================================================
// VARIANT ROUTES
// ============================================================================

// GET specific variant for editing
inventoryRouter.get("/:variantId", getVariantForEdit);

// CREATE new variant for existing product
inventoryRouter.post("/by-product/:productId/variants", createVariant);

// UPDATE variant details
inventoryRouter.put("/:variantId", updateVariant);

// TOGGLE variant status
inventoryRouter.put("/:variantId/status", toggleVariantStatus);

// DELETE variant
inventoryRouter.delete("/:variantId", deleteVariant);

// ============================================================================
// IMAGE MANAGEMENT ROUTES
// ============================================================================

// POST add image to variant
inventoryRouter.post("/:variantId/images", addImageToVariant);

// PUT reorder images for variant
inventoryRouter.put("/:variantId/images/reorder", updateImageOrder);

// PUT set image as primary
inventoryRouter.put("/images/:imageId/primary", setPrimaryImage);

// DELETE image
inventoryRouter.delete("/images/:imageId", deleteImage);