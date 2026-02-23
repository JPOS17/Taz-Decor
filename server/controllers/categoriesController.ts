import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * List of words that should remain lowercase in category names
 */
const LOWERCASE_WORDS = ['of', 'in', 'on', 'the', 'and', 'a', 'an'];

/**
 * Formats a category name with proper capitalization rules
 */
function formatCategoryName(input: string): string {
  if (!input || !input.trim()) {
    return '';
  }

  const normalized = input.trim().replace(/\s+/g, ' ');
  const words = normalized.split(' ');
  
  const formattedWords = words.map((word, index) => {
    const isFirstWord = index === 0;
    const isLastWord = index === words.length - 1;
    const lowerWord = word.toLowerCase();
    
    if (isFirstWord || isLastWord) {
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }
    
    if (LOWERCASE_WORDS.includes(lowerWord)) {
      return lowerWord;
    }
    
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return formattedWords.join(' ');
}

// ============================================================================
// CATEGORIES - GET ALL
// ============================================================================

/**
 * GET all categories
 */
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { includeInactive } = req.query;
    
    let query = "SELECT * FROM categories";
    
    // By default, only return active categories
    if (includeInactive !== 'true') {
      query += " WHERE is_active = TRUE";
    }
    
    query += " ORDER BY display_order ASC, category_id ASC";
    
    const result = await pool.query(query);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// CATEGORIES - CREATE
// ============================================================================

/**
 * POST create new category
 */
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category_name } = req.body;

    if (!category_name || !category_name.trim()) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }

    // Format the category name with proper capitalization
    const formattedName = formatCategoryName(category_name);

    // Check if category already exists (case-insensitive)
    const existingCategory = await pool.query(
      "SELECT * FROM categories WHERE LOWER(category_name) = LOWER($1)",
      [formattedName]
    );

    if (existingCategory.rows.length > 0) {
      res.status(409).json({ message: "Category already exists" });
      return;
    }

    // Get the next display_order value
    const maxOrderResult = await pool.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM categories"
    );
    const nextOrder = maxOrderResult.rows[0].next_order;

    const result = await pool.query(
      "INSERT INTO categories (category_name, display_order, is_active) VALUES ($1, $2, TRUE) RETURNING *",
      [formattedName, nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CATEGORIES - UPDATE
// ============================================================================

/**
 * PUT update category
 */
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;
    const { category_name, is_active } = req.body;

    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE category_id = $1",
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (category_name !== undefined) {
      if (!category_name.trim()) {
        res.status(400).json({ message: "Category name cannot be empty" });
        return;
      }

      const formattedName = formatCategoryName(category_name);

      // Check if new name conflicts with existing category (excluding current one)
      const duplicateCheck = await pool.query(
        "SELECT * FROM categories WHERE LOWER(category_name) = LOWER($1) AND category_id != $2",
        [formattedName, categoryId]
      );

      if (duplicateCheck.rows.length > 0) {
        res.status(409).json({ message: "Category name already exists" });
        return;
      }

      updates.push(`category_name = $${paramCount}`);
      values.push(formattedName);
      paramCount++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }

    if (updates.length === 0) {
      res.status(400).json({ message: "No updates provided" });
      return;
    }

    values.push(categoryId);
    const query = `UPDATE categories SET ${updates.join(', ')} WHERE category_id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CATEGORIES - DELETE
// ============================================================================

/**
 * DELETE category
 */
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId } = req.params;

    // Check if category exists
    const categoryCheck = await pool.query(
      "SELECT * FROM categories WHERE category_id = $1",
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      res.status(404).json({ message: "Category not found" });
      return;
    }

    // Check if category has products
    const productCheck = await pool.query(
      "SELECT COUNT(*) as count FROM product_categories WHERE category_id = $1",
      [categoryId]
    );

    if (parseInt(productCheck.rows[0].count) > 0) {
      res.status(409).json({ 
        message: "Cannot delete category with existing products. Please reassign or delete the products first." 
      });
      return;
    }

    await pool.query("DELETE FROM categories WHERE category_id = $1", [categoryId]);

    res.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// CATEGORIES - REORDER
// ============================================================================

/**
 * PUT update display order for multiple categories
 */
export const reorderCategories = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      res.status(400).json({ message: "Categories array is required" });
      return;
    }

    // Validate that each category has category_id and display_order
    for (const cat of categories) {
      if (typeof cat.category_id !== 'number' || typeof cat.display_order !== 'number') {
        res.status(400).json({ 
          message: "Each category must have category_id and display_order" 
        });
        return;
      }
    }

    await client.query('BEGIN');

    // Update display_order for each category
    for (const cat of categories) {
      await client.query(
        'UPDATE categories SET display_order = $1 WHERE category_id = $2',
        [cat.display_order, cat.category_id]
      );
    }

    await client.query('COMMIT');

    // Return updated categories
    const result = await client.query(
      "SELECT * FROM categories ORDER BY display_order ASC, category_id ASC"
    );

    res.json(result.rows);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error reordering categories:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};