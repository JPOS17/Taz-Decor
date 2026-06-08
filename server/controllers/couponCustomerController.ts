import { Request, Response } from "express";
import { pool } from "../db";
import { getUserFromToken } from "../middleware/authMiddleware";

// ============================================================================
// PRODUCT COUPONS - PREVIEWS
// ============================================================================

/**
 * GET all active coupons for listings page
 */
export const getProductCouponsPreview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query; // optional — passed when user is logged in
 
    // Pre-aggregate per-user coupon usage in a CTE so the join is a single scan
    // rather than a correlated subquery executing once per coupon row
    const result = await pool.query(`
      WITH user_usage AS (
        SELECT oc.coupon_id, COUNT(DISTINCT oc.order_id) AS usage_count
        FROM order_coupons oc
        JOIN orders o ON o.order_id = oc.order_id
        WHERE o.user_id = $1::int
        GROUP BY oc.coupon_id
      )
      SELECT
        c.coupon_id,
        c.coupon_code,
        c.discount_type,
        c.discount_value,
        c.min_purchase_amount,
        c.max_discount_amount,
        c.free_shipping,
        c.applies_to_type,
        c.applies_to_id,
        c.requires_verified_email,
        c.usage_limit_total,
        c.usage_count_total,
        c.usage_limit_per_user,
        c.description,
        c.bogo_buy_quantity,
        c.bogo_get_quantity,
        c.bogo_discount_percentage,
        c.valid_until,
        c.location_ids,
        -- Per-user usage count: 0 for guests or when the coupon has never been used
        COALESCE(uu.usage_count, 0) AS user_usage_count,
        CASE
          WHEN c.applies_to_type = 'all' THEN 'All Products'
          WHEN c.applies_to_type = 'category' THEN cat.category_name
          WHEN c.applies_to_type = 'product' THEN p.name
          WHEN c.applies_to_type = 'product_type' THEN pt.type_name
          WHEN c.applies_to_type = 'variant' THEN 'Specific variant'
          WHEN c.applies_to_type = 'custom_group' THEN 'Selected products'
          ELSE 'Unknown'
        END AS applies_to_name
      FROM coupons c
      LEFT JOIN user_usage uu ON uu.coupon_id = c.coupon_id
      LEFT JOIN categories cat ON c.applies_to_type = 'category' AND c.applies_to_id = cat.category_id
      LEFT JOIN products p ON c.applies_to_type = 'product' AND c.applies_to_id = p.product_id
      LEFT JOIN product_types pt ON c.applies_to_type = 'product_type' AND c.applies_to_id = pt.product_type_id
      WHERE c.is_active = TRUE
        AND c.valid_from <= NOW()
        AND (c.valid_until IS NULL OR c.valid_until >= NOW())
        AND (c.usage_limit_total IS NULL OR c.usage_count_total < c.usage_limit_total)
      ORDER BY
        c.applies_to_type,
        CASE c.discount_type
          WHEN 'percentage' THEN c.discount_value
          WHEN 'fixed' THEN c.discount_value
          ELSE 0
        END DESC
    `, [userId ? parseInt(userId as string) : null]);
 
    const coupons = result.rows.map(row => ({
      ...row,
      discount_value: row.discount_value ? parseFloat(row.discount_value) : null,
      min_purchase_amount: row.min_purchase_amount ? parseFloat(row.min_purchase_amount) : null,
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      bogo_discount_percentage: row.bogo_discount_percentage ? parseFloat(row.bogo_discount_percentage) : null,
      location_ids: row.location_ids || [],
      user_usage_count: parseInt(row.user_usage_count),
      usage_limit_per_user: row.usage_limit_per_user ? parseInt(row.usage_limit_per_user) : null,
    }));
 
    // Group coupons by type
    const grouped = {
      all: coupons.filter(c => c.applies_to_type === 'all'),
      category: coupons.filter(c => c.applies_to_type === 'category'),
      product_type: coupons.filter(c => c.applies_to_type === 'product_type'),
      product: coupons.filter(c => c.applies_to_type === 'product'),
      variant: coupons.filter(c => c.applies_to_type === 'variant'),
      custom_group: coupons.filter(c => c.applies_to_type === 'custom_group')
    };
 
    res.json(grouped);
 
  } catch (error) {
    console.error("Error fetching product coupons preview:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET eligible products for a coupon 
 */
export const getCouponEligibleProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { couponId } = req.params;
 
    // Get the coupon details
    const couponResult = await pool.query(
      'SELECT applies_to_type, applies_to_id, location_ids FROM coupons WHERE coupon_id = $1 AND is_active = TRUE',
      [couponId]
    );
 
    if (couponResult.rows.length === 0) {
      res.status(404).json({ message: 'Coupon not found' });
      return;
    }
 
    const { applies_to_type, applies_to_id, location_ids } = couponResult.rows[0];
 
    let productsQuery = '';
    let queryParams: any[] = [];
 
    if (applies_to_type === 'category') {
      productsQuery = `
        SELECT DISTINCT ON (p.product_id)
          pv.variant_id,
          p.product_id,
          p.name,
          pv.price,
          (
            SELECT pi.img_url
            FROM product_images pi
            WHERE pi.variant_id = pv.variant_id
            ORDER BY pi.display_order
            LIMIT 1
          ) as primary_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN product_categories pc ON p.product_id = pc.product_id
        WHERE pc.category_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.product_id, pv.variant_id
        LIMIT 10
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'product') {
      productsQuery = `
        SELECT DISTINCT ON (p.product_id)
          pv.variant_id,
          p.product_id,
          p.name,
          pv.price,
          (
            SELECT pi.img_url
            FROM product_images pi
            WHERE pi.variant_id = pv.variant_id
            ORDER BY pi.display_order
            LIMIT 1
          ) as primary_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        WHERE p.product_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.product_id, pv.variant_id
        LIMIT 10
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'product_type') {
      productsQuery = `
        SELECT DISTINCT ON (p.product_id)
          pv.variant_id,
          p.product_id,
          p.name,
          pv.price,
          (
            SELECT pi.img_url
            FROM product_images pi
            WHERE pi.variant_id = pv.variant_id
            ORDER BY pi.display_order
            LIMIT 1
          ) as primary_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        WHERE p.product_type_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.product_id, pv.variant_id
        LIMIT 10
      `;
      queryParams = [applies_to_id, location_ids];
    } else if (applies_to_type === 'variant') {
      productsQuery = `
        SELECT
          pv.variant_id,
          p.product_id,
          p.name,
          pv.price,
          (
            SELECT pi.img_url
            FROM product_images pi
            WHERE pi.variant_id = pv.variant_id
            ORDER BY pi.display_order
            LIMIT 1
          ) as primary_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        WHERE pv.variant_id = $1
        LIMIT 10
      `;
      queryParams = [applies_to_id];
    } else if (applies_to_type === 'custom_group') {
      productsQuery = `
        SELECT DISTINCT ON (p.product_id)
          pv.variant_id,
          p.product_id,
          p.name,
          pv.price,
          (
            SELECT pi.img_url
            FROM product_images pi
            WHERE pi.variant_id = pv.variant_id
            ORDER BY pi.display_order
            LIMIT 1
          ) as primary_image
        FROM product_variants pv
        JOIN products p ON pv.product_id = p.product_id
        JOIN coupon_variant_groups cvg ON pv.variant_id = cvg.variant_id
        WHERE cvg.coupon_id = $1
          AND pv.location_id = ANY($2)
        ORDER BY p.product_id, pv.variant_id
        LIMIT 10
      `;
      queryParams = [couponId, location_ids];
    } else {
      res.json({ products: [] });
      return;
    }
 
    const result = await pool.query(productsQuery, queryParams);
 
    const products = result.rows.map(row => ({
      ...row,
      price: row.price ? parseFloat(row.price) : 0,
    }));
 
    res.json({ products });
  } catch (error) {
    console.error("Error fetching coupon eligible products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PRODUCT COUPONS - APPLICABLE
// ============================================================================

/**
 * GET applicable coupons for a specific variant
 */
export const getApplicableCouponsForVariant = async (req: Request, res: Response): Promise<void> => {
  try {
    // userId extracted here alongside the other query params
    const { variantId, productId, categoryId, productTypeId, userId } = req.query;
 
    // Validate required parameters
    if (!variantId || !productId || !categoryId) {
      res.status(400).json({ message: "Missing required parameters" });
      return;
    }
 
    // Single query: folds the separate location_id lookup and the correlated
    // per-coupon usage subquery into one using a CTE and a direct JOIN on
    // product_variants — eliminates the first round trip entirely
    const result = await pool.query(`
      WITH variant_info AS (
        SELECT location_id FROM product_variants WHERE variant_id = $1::int
      ),
      user_usage AS (
        SELECT oc.coupon_id, COUNT(DISTINCT oc.order_id) AS usage_count
        FROM order_coupons oc
        JOIN orders o ON o.order_id = oc.order_id
        WHERE o.user_id = $5::int
        GROUP BY oc.coupon_id
      )
      SELECT
        c.coupon_id,
        c.coupon_code,
        c.discount_type,
        c.discount_value,
        c.min_purchase_amount,
        c.max_discount_amount,
        c.free_shipping,
        c.applies_to_type,
        c.applies_to_id,
        c.requires_verified_email,
        c.usage_limit_total,
        c.usage_count_total,
        c.usage_limit_per_user,
        c.description,
        c.bogo_buy_quantity,
        c.bogo_get_quantity,
        c.bogo_discount_percentage,
        c.valid_until,
        c.location_ids,
        -- Per-user usage count: 0 for guests or when the coupon has never been used
        COALESCE(uu.usage_count, 0) AS user_usage_count,
        CASE
          WHEN c.applies_to_type = 'all' THEN 'All Products'
          WHEN c.applies_to_type = 'category' THEN cat.category_name
          WHEN c.applies_to_type = 'product' THEN p.name
          WHEN c.applies_to_type = 'product_type' THEN pt.type_name
          WHEN c.applies_to_type = 'variant' THEN 'This variant'
          WHEN c.applies_to_type = 'custom_group' THEN 'Selected products'
          ELSE 'Unknown'
        END AS applies_to_name
      FROM coupons c
      CROSS JOIN variant_info vi
      LEFT JOIN user_usage uu ON uu.coupon_id = c.coupon_id
      LEFT JOIN categories cat ON c.applies_to_type = 'category' AND c.applies_to_id = cat.category_id
      LEFT JOIN products p ON c.applies_to_type = 'product' AND c.applies_to_id = p.product_id
      LEFT JOIN product_types pt ON c.applies_to_type = 'product_type' AND c.applies_to_id = pt.product_type_id
      WHERE c.is_active = TRUE
        AND c.valid_from <= NOW()
        AND (c.valid_until IS NULL OR c.valid_until >= NOW())
        AND (c.usage_limit_total IS NULL OR c.usage_count_total < c.usage_limit_total)
        AND vi.location_id = ANY(c.location_ids)
        AND (
          c.applies_to_type = 'all'
          OR (c.applies_to_type = 'category' AND c.applies_to_id = $2::int)
          OR (c.applies_to_type = 'product' AND c.applies_to_id = $3::int)
          OR (c.applies_to_type = 'product_type' AND c.applies_to_id = $4::int)
          OR (c.applies_to_type = 'variant' AND c.applies_to_id = $1::int)
          OR (c.applies_to_type = 'custom_group' AND EXISTS (
            SELECT 1 FROM coupon_variant_groups cvg
            WHERE cvg.coupon_id = c.coupon_id AND cvg.variant_id = $1::int
          ))
        )
      ORDER BY
        CASE c.discount_type
          WHEN 'percentage' THEN c.discount_value
          WHEN 'fixed' THEN c.discount_value
          ELSE 0
        END DESC
    `, [
      parseInt(variantId as string),                             // $1
      parseInt(categoryId as string),                            // $2
      parseInt(productId as string),                             // $3
      productTypeId ? parseInt(productTypeId as string) : null,  // $4
      userId ? parseInt(userId as string) : null,                // $5
    ]);
 
    const coupons = result.rows.map(row => ({
      ...row,
      discount_value: row.discount_value ? parseFloat(row.discount_value) : null,
      min_purchase_amount: row.min_purchase_amount ? parseFloat(row.min_purchase_amount) : null,
      max_discount_amount: row.max_discount_amount ? parseFloat(row.max_discount_amount) : null,
      bogo_discount_percentage: row.bogo_discount_percentage ? parseFloat(row.bogo_discount_percentage) : null,
      location_ids: row.location_ids || [],
      user_usage_count: parseInt(row.user_usage_count),
      usage_limit_per_user: row.usage_limit_per_user ? parseInt(row.usage_limit_per_user) : null,
    }));
 
    res.json(coupons);
 
  } catch (error) {
    console.error("Error fetching applicable coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PRODUCT COUPONS - CUSTOM GROUPS
// ============================================================================

/**
 * Check which custom group coupons apply to variants
 */
export const checkCustomGroupCoupons = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantIds } = req.query;
 
    // Validate required parameters
    if (!variantIds) {
      res.status(400).json({ message: "variantIds are required" });
      return;
    }
 
    // Parse comma-separated variant IDs
    const ids = variantIds.toString().split(',').map(id => parseInt(id));
 
    const result = await pool.query(`
      SELECT DISTINCT
        c.coupon_id,
        cvg.variant_id
      FROM coupons c
      JOIN coupon_variant_groups cvg ON c.coupon_id = cvg.coupon_id
      JOIN product_variants pv ON cvg.variant_id = pv.variant_id
      WHERE c.applies_to_type = 'custom_group'
        AND c.is_active = TRUE
        AND c.valid_from <= NOW()
        AND (c.valid_until IS NULL OR c.valid_until >= NOW())
        AND (c.usage_limit_total IS NULL OR c.usage_count_total < c.usage_limit_total)
        AND cvg.variant_id = ANY($1)
        AND pv.location_id = ANY(c.location_ids)
    `, [ids]);
 
    const variantCouponMap: Record<number, number[]> = {};
 
    result.rows.forEach(row => {
      if (!variantCouponMap[row.variant_id]) {
        variantCouponMap[row.variant_id] = [];
      }
      if (!variantCouponMap[row.variant_id].includes(row.coupon_id)) {
        variantCouponMap[row.variant_id].push(row.coupon_id);
      }
    });
 
    res.json(variantCouponMap);
 
  } catch (error) {
    console.error("Error checking custom group coupons:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// COUPON USAGE - PER USER
// ============================================================================

/**
 * GET per-user coupon usage counts
 * Returns a map of coupon_id -> number of times this user has used it
 */
export const getUserCouponUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
 
    const result = await pool.query(`
      SELECT 
        oc.coupon_id,
        COUNT(DISTINCT oc.order_id) AS user_usage_count
      FROM order_coupons oc
      JOIN orders o ON oc.order_id = o.order_id
      WHERE o.user_id = $1
      GROUP BY oc.coupon_id
    `, [user.userId]);
 
    const usageMap: Record<number, number> = {};
    result.rows.forEach(row => {
      usageMap[row.coupon_id] = parseInt(row.user_usage_count);
    });
 
    res.json(usageMap);
 
  } catch (error) {
    console.error("Error fetching user coupon usage:", error);
    res.status(500).json({ message: "Server error" });
  }
};