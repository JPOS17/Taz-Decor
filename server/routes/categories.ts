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

// GET all categories — public
categoriesRouter.get("/", getAllCategories);

// POST create new category — manager/admin only
categoriesRouter.post("/", requireManagerOrAdmin, createCategory);

// PUT reorder categories — manager/admin only — MUST BE BEFORE /:categoryId
categoriesRouter.put("/reorder", requireManagerOrAdmin, reorderCategories);

// PUT update category — manager/admin only
categoriesRouter.put("/:categoryId", requireManagerOrAdmin, updateCategory);

// DELETE category — manager/admin only
categoriesRouter.delete("/:categoryId", requireManagerOrAdmin, deleteCategory);