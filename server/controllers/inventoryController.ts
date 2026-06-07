import { Request, Response } from "express";
import { pool } from "../db";
import { generateProductSKU, generateVariantSKU } from "../utils/skuGenerator"; 

// ============================================================================
// PRODUCTS - GET
// ============================================================================

/**
 * GET all products for management (includes all variants)
 */
export const getAllProductsForManagement = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, locationId, productStatus, stockStatus, categoryStatus, sortBy } = req.query;
    
    let whereConditions = ['1=1']; 
    const queryParams: any[] = [];
    let paramCounter = 1;

    // Category filter
    if (categoryId) {
      queryParams.push(categoryId);
      whereConditions.push(`pc.category_id = $${paramCounter}`);
      paramCounter++;
    }

    // Location filter
    if (locationId) {
      queryParams.push(locationId);
      whereConditions.push(`pv.location_id = $${paramCounter}`);
      paramCounter++;
    }

    // Product status filter
    if (productStatus === 'active') {
      whereConditions.push('pv.is_active = TRUE');
    } else if (productStatus === 'inactive') {
      whereConditions.push('pv.is_active = FALSE');
    }

    // Stock status filter
    if (stockStatus === 'out-of-stock') {
      whereConditions.push('pv.quantity = 0');
    } else if (stockStatus === 'low-stock') {
      whereConditions.push('pv.quantity > 0 AND pv.quantity <= 3');
    } else if (stockStatus === 'in-stock') {
      whereConditions.push('pv.quantity > 0');
    }

    // Category status filter
    if (categoryStatus === 'active') {
      whereConditions.push('c.is_active = TRUE');
    } else if (categoryStatus === 'inactive') {
      whereConditions.push('c.is_active = FALSE');
    } else if (categoryStatus === 'multiple') {
      whereConditions.push(`
        (SELECT COUNT(*) FROM product_categories WHERE product_id = p.product_id) >= 2
      `);
    }

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'name-asc':
        orderByClause = 'ORDER BY p.name ASC, pv.variant_id ASC';
        break;
      case 'name-desc':
        orderByClause = 'ORDER BY p.name DESC, pv.variant_id ASC';
        break;
      case 'price-asc':
        orderByClause = 'ORDER BY pv.price ASC, p.product_id DESC, pv.variant_id DESC';
        break;
      case 'price-desc':
        orderByClause = 'ORDER BY pv.price DESC, p.product_id DESC, pv.variant_id DESC';
        break;
      case 'stock-asc':
        orderByClause = 'ORDER BY pv.quantity ASC, p.product_id DESC, pv.variant_id DESC';
        break;
      case 'stock-desc':
        orderByClause = 'ORDER BY pv.quantity DESC, p.product_id DESC, pv.variant_id DESC';
        break;
      case 'newest':
        orderByClause = 'ORDER BY p.product_id DESC, pv.variant_id DESC';
        break;
      case 'oldest':
        orderByClause = 'ORDER BY p.product_id ASC, pv.variant_id ASC';
        break;
      default:
        orderByClause = 'ORDER BY p.product_id DESC, pv.variant_id DESC';
    }
    
    const result = await pool.query(`
      SELECT 
        pv.variant_id,
        pv.product_id,
        p.name,
        pv.price,
        pv.color,
        pv.size,
        pv.quantity AS stock_quantity,
        pc.category_id,
        c.category_name AS category,
        c.is_active AS category_is_active,
        p.product_type_id,
        pt.type_name AS product_type,
        pt.sku_prefix,
        pv.location_id,
        sl.location_name,
        pi.img_url AS primary_image,
        pv.is_active,
        (SELECT COUNT(*) FROM product_variants WHERE product_id = p.product_id) as variant_count
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      JOIN product_categories pc ON pc.product_id = p.product_id AND pc.is_primary = TRUE
      JOIN categories c ON c.category_id = pc.category_id
      LEFT JOIN product_types pt ON pt.product_type_id = p.product_type_id
      LEFT JOIN seller_locations sl ON sl.location_id = pv.location_id
      LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = TRUE
      WHERE ${whereConditions.join(' AND ')}
      ${orderByClause}
    `, queryParams);
    
    const products = result.rows.map(row => ({
      ...row,
      price: parseFloat(row.price)
    }));

    res.json(products);
  } catch (error) {
    console.error("Error fetching products for management:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * GET all variants for a specific product
 */
export const getProductVariants = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        pv.variant_id,
        pv.product_id,
        pv.price,
        pv.color,
        pv.size,
        pv.quantity AS stock_quantity,
        pv.sku,
        pi.img_url AS primary_image
      FROM product_variants pv
      LEFT JOIN product_images pi ON pi.variant_id = pv.variant_id AND pi.is_primary = TRUE
      WHERE pv.product_id = $1
      ORDER BY pv.variant_id
    `, [productId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching product variants:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PRODUCTS - CREATE 
// ============================================================================

/**
 * POST create new product
 */
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      price,
      color,
      size,
      stock_quantity,
      category_id,
      product_type_id,
      location_id,
      weight_oz,
      length_in,
      width_in,
      height_in,
      images,
      additional_category_ids 
    } = req.body;

    // Validate required fields
    if (!name || !price || !category_id || !location_id) {
      await client.query('ROLLBACK');
      res.status(400).json({ 
        message: "Missing required fields: name, price, category_id, location_id" 
      });
      return;
    }

    // Generate SKU for the new product
    const sku = await generateProductSKU(client, product_type_id);

    // Insert product
    const productResult = await client.query(
      `INSERT INTO products (name, description, product_type_id) 
       VALUES ($1, $2, $3) 
       RETURNING product_id`,
      [name, description || null, product_type_id || null]
    );

    const productId = productResult.rows[0].product_id;

    // Insert variant
    const variantResult = await client.query(
      `INSERT INTO product_variants (
        product_id, sku, price, color, size, quantity, location_id,
        weight_oz, length_in, width_in, height_in, is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE) 
      RETURNING variant_id`,
      [
        productId,
        sku,
        price,
        color || null,
        size || null,
        stock_quantity || 0,
        location_id,
        weight_oz || null,
        length_in || null,
        width_in || null,
        height_in || null
      ]
    );

    const variantId = variantResult.rows[0].variant_id;

    // Link product to PRIMARY category
    await client.query(
      `INSERT INTO product_categories (product_id, category_id, is_primary) 
       VALUES ($1, $2, TRUE)`,
      [productId, category_id]
    );

    // Link product to ADDITIONAL categories (if any)
    if (additional_category_ids && Array.isArray(additional_category_ids) && additional_category_ids.length > 0) {
      for (const additionalCategoryId of additional_category_ids) {
        await client.query(
          `INSERT INTO product_categories (product_id, category_id, is_primary) 
           VALUES ($1, $2, FALSE)`,
          [productId, additionalCategoryId]
        );
      }
    }

    // Insert images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      for (let i = 0; i < images.length; i++) {
        const isPrimary = i === 0;
        await client.query(
          `INSERT INTO product_images (variant_id, img_url, is_primary, display_order) 
          VALUES ($1, $2, $3, $4)`,
          [variantId, images[i], isPrimary, i + 1]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ 
      message: "Product created successfully",
      product_id: productId,
      variant_id: variantId,
      sku: sku
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating product:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

/**
 * POST create new variant for existing product
 */
export const createVariant = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { productId } = req.params;
    const {
      price,
      color,
      size,
      stock_quantity,
      location_id,
      weight_oz,
      length_in,
      width_in,
      height_in,
      image_urls
    } = req.body;

    // Validate required fields
    if (!price || !location_id) {
      await client.query('ROLLBACK');
      res.status(400).json({ 
        message: "Missing required fields: price, location_id" 
      });
      return;
    }

    // Generate SKU for new variant
    const sku = await generateVariantSKU(client, parseInt(productId));

    // Insert variant
    const variantResult = await client.query(
      `INSERT INTO product_variants (
        product_id, sku, price, color, size, quantity, location_id,
        weight_oz, length_in, width_in, height_in, is_active
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE) 
      RETURNING variant_id`,
      [
        productId,
        sku,
        price,
        color || null,
        size || null,
        stock_quantity || 0,
        location_id,
        weight_oz || null,
        length_in || null,
        width_in || null,
        height_in || null
      ]
    );

    const variantId = variantResult.rows[0].variant_id;

    // Insert images if provided
    if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
      for (let i = 0; i < image_urls.length; i++) {
        const isPrimary = i === 0;
        await client.query(
          `INSERT INTO product_images (variant_id, img_url, is_primary, display_order) 
           VALUES ($1, $2, $3, $4)`,
          [variantId, image_urls[i], isPrimary, i + 1]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ 
      message: "Variant created successfully",
      variant_id: variantId,
      sku: sku
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error creating variant:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// VARIANTS - FUNCTIONS
// ============================================================================

/**
 * GET detailed product variant for editing
 */
export const getVariantForEdit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    
    const variantResult = await pool.query(`
      SELECT 
        pv.variant_id,
        pv.product_id,
        p.name,
        p.description,
        pv.price,
        pv.color,
        pv.size,
        pv.quantity AS stock_quantity,
        pv.sku,
        pv.weight_oz,
        pv.length_in,
        pv.width_in,
        pv.height_in,
        pv.is_active,
        pc.category_id,
        c.category_name AS category,
        p.product_type_id,
        pt.type_name AS product_type,
        pt.sku_prefix,
        pv.location_id,
        sl.location_name
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      JOIN product_categories pc ON pc.product_id = p.product_id AND pc.is_primary = TRUE
      JOIN categories c ON c.category_id = pc.category_id
      LEFT JOIN product_types pt ON pt.product_type_id = p.product_type_id
      LEFT JOIN seller_locations sl ON sl.location_id = pv.location_id
      WHERE pv.variant_id = $1
    `, [variantId]);

    if (variantResult.rows.length === 0) {
      res.status(404).json({ message: "Variant not found" });
      return;
    }

    const variant = variantResult.rows[0];

    // Get images for this variant
    const imagesResult = await pool.query(`
      SELECT 
        image_id,
        img_url,
        is_primary,
        display_order
      FROM product_images
      WHERE variant_id = $1
      ORDER BY display_order ASC, image_id ASC
    `, [variantId]);

    res.json({
      ...variant,
      price: parseFloat(variant.price),
      weight_oz: variant.weight_oz ? parseFloat(variant.weight_oz) : null,
      length_in: variant.length_in ? parseFloat(variant.length_in) : null,
      width_in: variant.width_in ? parseFloat(variant.width_in) : null,
      height_in: variant.height_in ? parseFloat(variant.height_in) : null,
      images: imagesResult.rows
    });
  } catch (error) {
    console.error("Error fetching variant for edit:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT update variant
 */
export const updateVariant = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { variantId } = req.params;
    const {
      price,
      color,
      size,
      stock_quantity,
      weight_oz,
      length_in,
      width_in,
      height_in,
      name,
      description,
      location_id,
      category_id,
    } = req.body;

    // Check if variant exists
    const variantCheck = await client.query(
      "SELECT product_id FROM product_variants WHERE variant_id = $1",
      [variantId]
    );

    if (variantCheck.rows.length === 0) {
      res.status(404).json({ message: "Variant not found" });
      return;
    }

    const productId = variantCheck.rows[0].product_id;

    await client.query("BEGIN");

    // Update product name / description
    if (name !== undefined || description !== undefined) {
      const productUpdates: string[] = [];
      const productValues: any[] = [];
      let productParamCount = 1;

      if (name !== undefined) {
        productUpdates.push(`name = $${productParamCount}`);
        productValues.push(name);
        productParamCount++;
      }

      if (description !== undefined) {
        productUpdates.push(`description = $${productParamCount}`);
        productValues.push(description);
        productParamCount++;
      }

      if (productUpdates.length > 0) {
        productValues.push(productId);
        await client.query(
          `UPDATE products SET ${productUpdates.join(", ")} WHERE product_id = $${productParamCount}`,
          productValues
        );
      }
    }

    // Update category assignment
    if (category_id !== undefined) {
      const existingCategory = await client.query(
        "SELECT product_category_id FROM product_categories WHERE product_id = $1 AND is_primary = true",
        [productId]
      );

      if (existingCategory.rows.length > 0) {
        await client.query(
          "UPDATE product_categories SET category_id = $1 WHERE product_id = $2 AND is_primary = true",
          [category_id, productId]
        );
      } else {
        await client.query(
          "INSERT INTO product_categories (product_id, category_id, is_primary) VALUES ($1, $2, true)",
          [productId, category_id]
        );
      }
    }

    // Update variant details
    const variantUpdates: string[] = [];
    const variantValues: any[] = [];
    let variantParamCount = 1;

    if (price !== undefined) {
      variantUpdates.push(`price = $${variantParamCount}`);
      variantValues.push(price);
      variantParamCount++;
    }

    if (color !== undefined) {
      variantUpdates.push(`color = $${variantParamCount}`);
      variantValues.push(color || null);
      variantParamCount++;
    }

    if (size !== undefined) {
      variantUpdates.push(`size = $${variantParamCount}`);
      variantValues.push(size || null);
      variantParamCount++;
    }

    if (stock_quantity !== undefined) {
      variantUpdates.push(`quantity = $${variantParamCount}`);
      variantValues.push(stock_quantity);
      variantParamCount++;
    }

    if (weight_oz !== undefined) {
      variantUpdates.push(`weight_oz = $${variantParamCount}`);
      variantValues.push(weight_oz || null);
      variantParamCount++;
    }

    if (length_in !== undefined) {
      variantUpdates.push(`length_in = $${variantParamCount}`);
      variantValues.push(length_in || null);
      variantParamCount++;
    }

    if (width_in !== undefined) {
      variantUpdates.push(`width_in = $${variantParamCount}`);
      variantValues.push(width_in || null);
      variantParamCount++;
    }

    if (height_in !== undefined) {
      variantUpdates.push(`height_in = $${variantParamCount}`);
      variantValues.push(height_in || null);
      variantParamCount++;
    }

    if (location_id !== undefined) {
      variantUpdates.push(`location_id = $${variantParamCount}`);
      variantValues.push(location_id);
      variantParamCount++;
    }

    if (variantUpdates.length > 0) {
      variantValues.push(variantId);
      await client.query(
        `UPDATE product_variants 
         SET ${variantUpdates.join(", ")}, updated_at = NOW()
         WHERE variant_id = $${variantParamCount}`,
        variantValues
      );
    }

    await client.query("COMMIT");
    res.json({ message: "Variant updated successfully" });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error updating variant:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * DELETE variant
 */
export const deleteVariant = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { variantId } = req.params;

    await client.query('BEGIN');

    // Check if variant exists and get product info
    const variantCheck = await client.query(
      `SELECT product_id, 
        (SELECT COUNT(*) FROM product_variants WHERE product_id = pv.product_id) as variant_count
       FROM product_variants pv
       WHERE variant_id = $1`,
      [variantId]
    );

    if (variantCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: "Variant not found" });
      return;
    }

    const { product_id, variant_count } = variantCheck.rows[0];
    const isLastVariant = parseInt(variant_count) === 1;

    if (isLastVariant) {
      // This is the last variant — delete the entire product

      // 1. Null out historical references (preserve order/review history)
      await client.query(
        "UPDATE manager_activity_log SET related_variant_id = NULL WHERE related_variant_id = $1",
        [variantId]
      );

      // 2. Remove from live user data
      await client.query(
        "DELETE FROM shopping_cart_items WHERE variant_id = $1",
        [variantId]
      );
      await client.query(
        "DELETE FROM wishlist_items WHERE variant_id = $1",
        [variantId]
      );

      // 3. Remove coupon variant group associations
      await client.query(
        "DELETE FROM coupon_variant_groups WHERE variant_id = $1",
        [variantId]
      );

      // 4. Delete product images
      await client.query(
        "DELETE FROM product_images WHERE variant_id = $1",
        [variantId]
      );

      // 5. Delete the variant
      await client.query(
        "DELETE FROM product_variants WHERE variant_id = $1",
        [variantId]
      );

      // 6. Delete product categories
      await client.query(
        "DELETE FROM product_categories WHERE product_id = $1",
        [product_id]
      );

      // 7. Delete the product itself
      await client.query(
        "DELETE FROM products WHERE product_id = $1",
        [product_id]
      );

      await client.query('COMMIT');
      res.json({
        message: "Product and all associated data deleted successfully",
        deleted_entire_product: true
      });

    } else {
      // Product has multiple variants — delete only this variant

      // 1. Null out historical references (preserve order/review history)
      await client.query(
        "UPDATE manager_activity_log SET related_variant_id = NULL WHERE related_variant_id = $1",
        [variantId]
      );

      // 2. Remove from live user data
      await client.query(
        "DELETE FROM shopping_cart_items WHERE variant_id = $1",
        [variantId]
      );
      await client.query(
        "DELETE FROM wishlist_items WHERE variant_id = $1",
        [variantId]
      );

      // 3. Remove coupon variant group associations
      await client.query(
        "DELETE FROM coupon_variant_groups WHERE variant_id = $1",
        [variantId]
      );

      // 4. Delete product images for this variant
      await client.query(
        "DELETE FROM product_images WHERE variant_id = $1",
        [variantId]
      );

      // 5. Delete the variant
      await client.query(
        "DELETE FROM product_variants WHERE variant_id = $1",
        [variantId]
      );

      await client.query('COMMIT');
      res.json({
        message: "Variant deleted successfully",
        deleted_entire_product: false
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error deleting variant:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    client.release();
  }
};

// ============================================================================
// VARIANTS - TOGGLE STATUS
// ============================================================================

/**
 * PATCH toggle variant active status
 */
export const toggleVariantStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;

    const result = await pool.query(
      "UPDATE product_variants SET is_active = NOT is_active WHERE variant_id = $1 RETURNING is_active",
      [variantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Variant not found" });
      return;
    }

    res.json({ 
      message: "Variant status updated successfully",
      is_active: result.rows[0].is_active
    });
  } catch (error) {
    console.error("Error toggling variant status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// IMAGES - FUNCTIONS
// ============================================================================

/**
 * POST add image to variant
 */
export const addImageToVariant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { img_url } = req.body;

    if (!img_url) {
      res.status(400).json({ message: "Image URL is required" });
      return;
    }

    // Get next display_order
    const orderResult = await pool.query(
      "SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM product_images WHERE variant_id = $1",
      [variantId]
    );

    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      "INSERT INTO product_images (variant_id, img_url, is_primary, display_order) VALUES ($1, $2, FALSE, $3) RETURNING *",
      [variantId, img_url, nextOrder]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error adding image:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE image
 */
export const deleteImage = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { imageId } = req.params;

    // Get image details
    const imageResult = await client.query(
      "SELECT variant_id, is_primary FROM product_images WHERE image_id = $1",
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: "Image not found" });
      return;
    }

    const { variant_id, is_primary } = imageResult.rows[0];

    // Delete the image
    await client.query("DELETE FROM product_images WHERE image_id = $1", [imageId]);

    // If deleted image was primary, make another image primary
    if (is_primary) {
      await client.query(`
        UPDATE product_images 
        SET is_primary = TRUE 
        WHERE variant_id = $1 
        AND image_id = (
          SELECT image_id 
          FROM product_images 
          WHERE variant_id = $1 
          ORDER BY display_order 
          LIMIT 1
        )
      `, [variant_id]);
    }

    await client.query('COMMIT');

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error deleting image:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};

/**
 * PUT update image display order
 */
export const updateImageOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images)) {
      res.status(400).json({ message: "Images must be an array" });
      return;
    }

    // Update display_order for each image
    for (const image of images) {
      await pool.query(
        "UPDATE product_images SET display_order = $1 WHERE image_id = $2 AND variant_id = $3",
        [image.display_order, image.image_id, variantId]
      );
    }

    res.json({ message: "Image order updated successfully" });
  } catch (error) {
    console.error("Error updating image order:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT set primary image
 */
export const setPrimaryImage = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { imageId } = req.params;

    // Get variant_id for this image
    const imageResult = await client.query(
      "SELECT variant_id FROM product_images WHERE image_id = $1",
      [imageId]
    );

    if (imageResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ message: "Image not found" });
      return;
    }

    const variantId = imageResult.rows[0].variant_id;

    // Remove primary flag from all images for this variant
    await client.query(
      "UPDATE product_images SET is_primary = FALSE WHERE variant_id = $1",
      [variantId]
    );

    // Set this image as primary
    await client.query(
      "UPDATE product_images SET is_primary = TRUE WHERE image_id = $1",
      [imageId]
    );

    await client.query('COMMIT');

    res.json({ message: "Primary image updated successfully" });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error setting primary image:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
};
 
// ============================================================================
// SKU PREVIEW 
// ============================================================================

/**
 * POST preview SKU for new product by type
 */
export const previewProductSKUByType = async (req: Request, res: Response) => {
  try {
    const productTypeId = parseInt(req.params.productTypeId);
    const sku = await generateProductSKU(pool, productTypeId);
    res.json({ sku });
  } catch (error) {
    console.error('Error previewing product SKU:', error);
    res.status(500).json({ error: 'Failed to preview SKU' });
  }
};

/**
 * POST preview SKU for new variant
 */
export const previewVariantSKU = async (req: Request, res: Response) => {
  try {
    const productId = parseInt(req.params.productId);
    const sku = await generateVariantSKU(pool, productId);
    res.json({ sku });
  } catch (error) {
    console.error('Error previewing variant SKU:', error);
    res.status(500).json({ error: 'Failed to preview SKU' });
  }
};