import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "../controllers/categoriesController";
import { requireManagerOrAdmin } from "../middleware/authMiddleware";

export const categoriesRouter = express.Router();

// ============================================================================
// CATEGORY ROUTES
// ============================================================================

// GET all categories - Public route (anyone can view categories)
categoriesRouter.get("/", getAllCategories);

// POST create new category - Requires manager or admin
categoriesRouter.post("/", requireManagerOrAdmin, createCategory);

// PUT reorder categories (drag and drop) - Requires manager or admin
categoriesRouter.put("/reorder", requireManagerOrAdmin, reorderCategories);

// PUT update category - Requires manager or admin
categoriesRouter.put("/:categoryId", requireManagerOrAdmin, updateCategory);

// DELETE category - Requires manager or admin
categoriesRouter.delete("/:categoryId", requireManagerOrAdmin, deleteCategory);