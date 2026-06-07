import { Request, Response } from 'express';
import { pool } from '../db';

// ============================================================================
// PRODUCT TYPES - GET
// ============================================================================

/**
 * GET all active product types
 */
export const getAllProductTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        product_type_id,
        type_name,
        sku_prefix,
        description
      FROM product_types
      WHERE is_active = true
      ORDER BY type_name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product types:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET a single product type by ID
 */
export const getProductTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        product_type_id,
        type_name,
        sku_prefix,
        description,
        is_active
      FROM product_types
      WHERE product_type_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Product type not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching product type:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// ============================================================================
// PRODUCT TYPES - FUNCTIONS
// ============================================================================

/**
 * CREATE a new product type
 */
export const createProductType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type_name, sku_prefix, description } = req.body;

    // Validation
    if (!type_name || !sku_prefix || !description) {
      res.status(400).json({ 
        message: 'All fields are required: type_name, sku_prefix, description' 
      });
      return;
    }

    if (sku_prefix.length !== 3) {
      res.status(400).json({ 
        message: 'SKU prefix must be exactly 3 characters' 
      });
      return;
    }

    // Check if SKU prefix already exists
    const existingPrefix = await pool.query(
      'SELECT product_type_id FROM product_types WHERE UPPER(sku_prefix) = UPPER($1)',
      [sku_prefix]
    );

    if (existingPrefix.rows.length > 0) {
      res.status(409).json({ 
        message: 'A product type with this SKU prefix already exists' 
      });
      return;
    }

    // Insert new product type
    const result = await pool.query(`
      INSERT INTO product_types (type_name, sku_prefix, description, is_active)
      VALUES ($1, UPPER($2), $3, true)
      RETURNING product_type_id, type_name, sku_prefix, description, is_active, created_at, updated_at
    `, [type_name, sku_prefix, description]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating product type:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * UPDATE product type description
 */
export const updateProductTypeDescription = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description || !description.trim()) {
      res.status(400).json({ 
        message: 'Description is required' 
      });
      return;
    }

    const result = await pool.query(`
      UPDATE product_types
      SET description = $1, updated_at = CURRENT_TIMESTAMP
      WHERE product_type_id = $2
      RETURNING product_type_id, type_name, sku_prefix, description, is_active, created_at, updated_at
    `, [description, id]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Product type not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product type:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};