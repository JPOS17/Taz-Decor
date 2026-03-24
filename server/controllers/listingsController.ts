import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// PRODUCTS - GET PREVIEW
// ============================================================================

/**
 * GET product preview with filters
 */
export const getProductPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { categoryId, minPrice, maxPrice, sortBy, onSaleOnly, freeShippingOnly } = req.query;
    
    // Base query to get all products
    const result = await pool.query(`
      SELECT 
          pv.variant_id,
          p.product_id,
          p.name,
          p.product_type_id,
          pv.price,
          pv.color,
          pv.size,
          pv.location_id,
          c.category_id,
          c.category_name AS category,
          c.display_order AS category_display_order,
          pi.img_url AS primary_image
        FROM products p
        JOIN product_variants pv 
            ON pv.product_id = p.product_id 
        JOIN product_categories pc
            ON pc.product_id = p.product_id
        JOIN categories c 
            ON c.category_id = pc.category_id
        JOIN product_images pi 
            ON pi.variant_id = pv.variant_id        
          AND pi.is_primary = TRUE
        WHERE pv.is_active = TRUE
          AND pv.quantity > 0
          AND c.is_active = TRUE
          AND ($1::int IS NULL AND pc.is_primary = TRUE OR pc.category_id = $1)
          AND ($2::numeric IS NULL OR pv.price >= $2)
          AND ($3::numeric IS NULL OR pv.price <= $3)
          AND (
            $5::boolean IS NULL 
            OR $5 = FALSE
            OR EXISTS (
              SELECT 1 FROM coupons coup
              WHERE coup.is_active = TRUE
                AND coup.valid_from <= NOW()
                AND (coup.valid_until IS NULL OR coup.valid_until >= NOW())
                AND (coup.usage_limit_total IS NULL OR coup.usage_count_total < coup.usage_limit_total)
                AND (coup.discount_value IS NOT NULL OR coup.discount_type = 'bogo')
                AND coup.discount_type != 'fixed'
                AND coup.discount_type != 'free_shipping_only'
                AND coup.applies_to_type != 'all'
                AND pv.location_id = ANY(coup.location_ids)
                AND (
                  (coup.applies_to_type = 'category' AND coup.applies_to_id = c.category_id)
                  OR (coup.applies_to_type = 'product' AND coup.applies_to_id = p.product_id)
                  OR (coup.applies_to_type = 'product_type' AND coup.applies_to_id = p.product_type_id)
                  OR (coup.applies_to_type = 'variant' AND coup.applies_to_id = pv.variant_id)
                  OR (coup.applies_to_type = 'custom_group' AND EXISTS (
                    SELECT 1 FROM coupon_variant_groups cvg
                    WHERE cvg.coupon_id = coup.coupon_id
                      AND cvg.variant_id = pv.variant_id
                  ))
                )
            )
          )
          AND (
            $6::boolean IS NULL 
            OR $6 = FALSE
            OR EXISTS (
              SELECT 1 FROM coupons coup
              WHERE coup.is_active = TRUE
                AND coup.valid_from <= NOW()
                AND (coup.valid_until IS NULL OR coup.valid_until >= NOW())
                AND (coup.usage_limit_total IS NULL OR coup.usage_count_total < coup.usage_limit_total)
                AND coup.free_shipping = TRUE
                AND pv.location_id = ANY(coup.location_ids)
                AND (
                  coup.applies_to_type = 'all'
                  OR (coup.applies_to_type = 'category' AND coup.applies_to_id = c.category_id)
                  OR (coup.applies_to_type = 'product' AND coup.applies_to_id = p.product_id)
                  OR (coup.applies_to_type = 'product_type' AND coup.applies_to_id = p.product_type_id)
                  OR (coup.applies_to_type = 'variant' AND coup.applies_to_id = pv.variant_id)
                  OR (coup.applies_to_type = 'custom_group' AND EXISTS (
                    SELECT 1 FROM coupon_variant_groups cvg
                    WHERE cvg.coupon_id = coup.coupon_id
                      AND cvg.variant_id = pv.variant_id
                  ))
                )
            )
          )
        ORDER BY
          CASE WHEN $4 = 'name-asc' THEN p.name END ASC,
          CASE WHEN $4 = 'name-desc' THEN p.name END DESC,
          CASE WHEN $4 = 'price-asc' THEN pv.price END ASC,
          CASE WHEN $4 = 'price-desc' THEN pv.price END DESC,
          CASE WHEN $4 IS NULL THEN c.display_order END ASC,
          CASE WHEN $4 IS NULL THEN p.product_id END ASC,
          pv.variant_id ASC;
    `, [
      categoryId || null, 
      minPrice || null, 
      maxPrice || null, 
      sortBy || null,
      onSaleOnly === 'true' ? true : null,
      freeShippingOnly === 'true' ? true : null
    ]);

    const products = result.rows.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));

    res.json(products);

  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PRODUCTS - GET DETAIL
// ============================================================================

/**
 * GET product detail by variant ID
 */
export const getProductDetail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;
    
    const productResult = await pool.query(`
      SELECT 
        pv.variant_id,
        p.product_id,
        p.name,
        p.description,
        p.product_type_id,
        pv.price,
        pv.quantity,
        pv.color,
        pv.size,
        pv.weight_oz,
        pv.length_in,
        pv.width_in,
        pv.height_in,
        sl.city AS location_city,
        sl.state AS location_state,
        -- Get primary category
        (
          SELECT c.category_name 
          FROM product_categories pc
          JOIN categories c ON c.category_id = pc.category_id
          WHERE pc.product_id = p.product_id AND pc.is_primary = TRUE
          LIMIT 1
        ) as category,
        -- Get primary category_id
        (
          SELECT c.category_id 
          FROM product_categories pc
          JOIN categories c ON c.category_id = pc.category_id
          WHERE pc.product_id = p.product_id AND pc.is_primary = TRUE
          LIMIT 1
        ) as category_id,
        -- Get all category names
        (
          SELECT ARRAY_AGG(c.category_name ORDER BY pc.is_primary DESC, c.display_order ASC)
          FROM product_categories pc
          JOIN categories c ON c.category_id = pc.category_id
          WHERE pc.product_id = p.product_id AND c.is_active = TRUE
        ) as all_categories
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
      LEFT JOIN seller_locations sl ON sl.location_id = pv.location_id
      WHERE pv.variant_id = $1
        AND pv.is_active = TRUE
    `, [variantId]);

    if (productResult.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const product = productResult.rows[0];
    
    // Check if product has at least one active category
    if (!product.all_categories || product.all_categories.length === 0) {
      res.status(404).json({ message: "Product not available" });
      return;
    }
    
    const productId = product.product_id;

    // Count total variants for this product
    const variantCountResult = await pool.query(`
      SELECT COUNT(*) as variant_count
      FROM product_variants
      WHERE product_id = $1 AND is_active = TRUE
    `, [productId]);

    const variantCount = parseInt(variantCountResult.rows[0].variant_count);

    // Only fetch all variants if there are more than 1
    let variantsWithImages = [];
    if (variantCount > 1) {
      const variantsResult = await pool.query(`
        SELECT 
          pv.variant_id,
          pv.sku,
          pv.price,
          pv.quantity,
          pv.color,
          pv.size,
          pv.weight_oz,
          pv.length_in,
          pv.width_in,
          pv.height_in
        FROM product_variants pv
        WHERE pv.product_id = $1 AND pv.is_active = TRUE
        ORDER BY pv.color, pv.size
      `, [productId]);

      // Get images for each variant
      variantsWithImages = await Promise.all(
        variantsResult.rows.map(async (variant) => {
          const imagesResult = await pool.query(`
            SELECT img_url
            FROM product_images
            WHERE variant_id = $1
            ORDER BY display_order ASC, image_id ASC
          `, [variant.variant_id]);

          return {
            ...variant,
            price: parseFloat(variant.price),
            weight_oz: variant.weight_oz ? parseFloat(variant.weight_oz) : null,
            length_in: variant.length_in ? parseFloat(variant.length_in) : null,
            width_in: variant.width_in ? parseFloat(variant.width_in) : null,
            height_in: variant.height_in ? parseFloat(variant.height_in) : null,
            images: imagesResult.rows.map(row => row.img_url)
          };
        })
      );
    }

    // Get images for current variant
    const imagesResult = await pool.query(`
      SELECT img_url
      FROM product_images
      WHERE variant_id = $1
      ORDER BY display_order ASC, image_id ASC
    `, [variantId]);

    const productDetail = {
      ...product,
      price: parseFloat(product.price),
      weight_oz: product.weight_oz ? parseFloat(product.weight_oz) : null,
      length_in: product.length_in ? parseFloat(product.length_in) : null,
      width_in: product.width_in ? parseFloat(product.width_in) : null,
      height_in: product.height_in ? parseFloat(product.height_in) : null,
      images: imagesResult.rows.map(row => row.img_url),
      variants: variantsWithImages,
      categories: product.all_categories
    };

    // Remove all_categories from the final response
    delete (productDetail as any).all_categories;

    res.json(productDetail);

  } catch (error) {
    console.error("Full error object:", error);
    res.status(500).json({ 
      message: "Server error",
      error: error instanceof Error ? error.message : 'Unknown error'  
    });
  }
};