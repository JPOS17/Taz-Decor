import express from 'express';
import { 
  getAllProductTypes, 
  getProductTypeById,
  createProductType,
  updateProductTypeDescription 
} from '../controllers/productTypesController';
import { requireManagerOrAdmin } from '../middleware/authMiddleware';

export const productTypesRouter = express.Router();

// Protect all product type routes - only managers and admins
productTypesRouter.use(requireManagerOrAdmin);

// ============================================================================
// PRODUCT TYPE ROUTES
// ============================================================================

// GET all active product types (for dropdowns)
productTypesRouter.get('/', getAllProductTypes);

// GET single product type by ID
productTypesRouter.get('/:id', getProductTypeById);

// POST create new product type
productTypesRouter.post('/', createProductType);

// PATCH update product type description
productTypesRouter.patch('/:id', updateProductTypeDescription);