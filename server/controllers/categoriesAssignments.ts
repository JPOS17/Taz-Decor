import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// PRODUCT CATEGORIES - GET
// ============================================================================

/**
 * GET categories for a specific product
 */
export const getProductCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;

    const result = await pool.query(`
      SELECT 
        pc.product_category_id,
        pc.product_id,
        pc.category_id,
        pc.is_primary,
        c.category_name,
        c.is_active as category_is_active
      FROM product_categories pc
      JOIN categories c ON c.category_id = pc.category_id
      WHERE pc.product_id = $1
      ORDER BY pc.is_primary DESC, c.display_order ASC
    `, [productId]);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching product categories:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PRODUCT CATEGORIES - ADD
// ============================================================================

/**
 * ADD category to product
 */
export const addProductCategory = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { productId } = req.params;
    const { category_id, is_primary } = req.body;

    if (!category_id) {
      res.status(400).json({ message: "category_id is required" });
      return 
    }

    // Check if product exists
    const productCheck = await client.query(
      "SELECT * FROM products WHERE product_id = $1",
      [productId]
    );

    if (productCheck.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return 
    }

    // Check if category exists
    const categoryCheck = await client.query(
      "SELECT * FROM categories WHERE category_id = $1",
      [category_id]
    );

    if (categoryCheck.rows.length === 0) {
      res.status(404).json({ message: "Category not found" });
      return 
    }

    // Check if relationship already exists
    const existingCheck = await client.query(
      "SELECT * FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, category_id]
    );

    if (existingCheck.rows.length > 0) {
      res.status(409).json({ message: "Product already belongs to this category" });
      return 
    }

    await client.query('BEGIN');

    // If setting as primary, remove primary flag from other categories
    if (is_primary) {
      await client.query(
        "UPDATE product_categories SET is_primary = FALSE WHERE product_id = $1",
        [productId]
      );
    }

    // Check if product has any categories - if not, force this to be primary
    const categoryCount = await client.query(
      "SELECT COUNT(*) as count FROM product_categories WHERE product_id = $1",
      [productId]
    );

    const shouldBePrimary = is_primary || parseInt(categoryCount.rows[0].count) === 0;

    // Add the new category
    const result = await client.query(`
      INSERT INTO product_categories (product_id, category_id, is_primary)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [productId, category_id, shouldBePrimary]);

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error adding product category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// PRODUCT CATEGORIES - UPDATE
// ============================================================================

/**
 * UPDATE product category (mainly for changing primary status)
 */
export const updateProductCategory = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { productId, categoryId } = req.params;
    const { is_primary } = req.body;

    // Check if relationship exists
    const existingCheck = await client.query(
      "SELECT * FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, categoryId]
    );

    if (existingCheck.rows.length === 0) {
      res.status(404).json({ message: "Product category relationship not found" });
      return 
    }

    await client.query('BEGIN');

    if (is_primary === true) {
      // Remove primary flag from all other categories for this product
      await client.query(
        "UPDATE product_categories SET is_primary = FALSE WHERE product_id = $1 AND category_id != $2",
        [productId, categoryId]
      );

      // Set this category as primary
      await client.query(
        "UPDATE product_categories SET is_primary = TRUE WHERE product_id = $1 AND category_id = $2",
        [productId, categoryId]
      );
    }

    await client.query('COMMIT');

    // Return updated relationship
    const result = await client.query(
      "SELECT * FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, categoryId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error updating product category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// PRODUCT CATEGORIES - DELETE
// ============================================================================

/**
 * DELETE category from product
 */
export const removeProductCategory = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { productId, categoryId } = req.params;

    // Check if relationship exists
    const existingCheck = await client.query(
      "SELECT * FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, categoryId]
    );

    if (existingCheck.rows.length === 0) {
      res.status(404).json({ message: "Product category relationship not found" });
      return 
    }

    const isPrimary = existingCheck.rows[0].is_primary;

    // Count total categories for this product
    const countResult = await client.query(
      "SELECT COUNT(*) as count FROM product_categories WHERE product_id = $1",
      [productId]
    );

    const totalCategories = parseInt(countResult.rows[0].count);

    // Don't allow removing the last category
    if (totalCategories === 1) {
      res.status(409).json({ 
        message: "Cannot remove the last category from a product. Products must belong to at least one category." 
      });
      return
    }

    await client.query('BEGIN');

    // Delete the relationship
    await client.query(
      "DELETE FROM product_categories WHERE product_id = $1 AND category_id = $2",
      [productId, categoryId]
    );

    // If we removed the primary category, make another category primary
    if (isPrimary) {
      await client.query(`
        UPDATE product_categories 
        SET is_primary = TRUE 
        WHERE product_id = $1 
        AND product_category_id = (
          SELECT product_category_id 
          FROM product_categories 
          WHERE product_id = $1 
          ORDER BY product_category_id 
          LIMIT 1
        )
      `, [productId]);
    }

    await client.query('COMMIT');

    res.json({ message: "Category removed from product successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error removing product category:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};