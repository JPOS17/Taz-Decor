import { Request, Response } from "express";
import { getUserFromToken } from "../middleware/authMiddleware";
import { pool } from "../db";

// ============================================================================
// WISHLIST - ADD ITEM
// ============================================================================

/**
 * POST add item to wishlist
 */
export const addToWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variant_id, selected_coupon_id } = req.body;

    // Get product info for activity log
    const productResult = await pool.query(
      `SELECT p.product_id, p.name, pv.location_id, pv.color, pv.size
       FROM product_variants pv
       JOIN products p ON p.product_id = pv.product_id
       WHERE pv.variant_id = $1`,
      [variant_id]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const product = productResult.rows[0];

    // Insert into wishlist (or update if already exists)
    await pool.query(
      `INSERT INTO wishlist_items (user_id, variant_id, selected_coupon_id, added_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (user_id, variant_id) 
      DO UPDATE SET selected_coupon_id = $3, added_at = NOW()`,
      [user.userId, variant_id, selected_coupon_id]
    );

    // Log activity for manager
    const variantDetails = [product.color, product.size].filter(Boolean).join(', ');
    await pool.query(
      `INSERT INTO manager_activity_log 
       (location_id, activity_type, related_user_id, related_product_id, related_variant_id, activity_description, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        product.location_id,
        'wishlist_added',
        user.userId,
        product.product_id,
        variant_id,
        `Customer added "${product.name}" ${variantDetails ? `(${variantDetails})` : ''} to wishlist`
      ]
    );

    res.json({ message: "Item added to wishlist" });

  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// WISHLIST - REMOVE ITEM
// ============================================================================

/**
 * DELETE remove item from wishlist
 */
export const removeFromWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variantId } = req.params;

    await pool.query(
      'DELETE FROM wishlist_items WHERE user_id = $1 AND variant_id = $2',
      [user.userId, variantId]
    );

    res.json({ message: "Item removed from wishlist" });

  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// WISHLIST - GET WISHLIST
// ============================================================================

/**
 * GET user's wishlist from database
 * Validates selected_coupon_id on each item — returns null if the coupon is:
 *   - inactive
 *   - expired (valid_until has passed)
 *   - over the global usage limit (usage_count_total >= usage_limit_total)
 *   - over the per-user usage limit (user has used it too many times in past orders)
 */
export const getWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Pre-fetch per-user coupon usage counts for all coupons referenced in this
    // user's wishlist in a single query, then join inline — avoids a correlated
    // subquery that executes once per wishlist row
    const result = await pool.query(
      `WITH wishlist_coupon_ids AS (
         SELECT DISTINCT selected_coupon_id
         FROM wishlist_items
         WHERE user_id = $1 AND selected_coupon_id IS NOT NULL
       ),
       user_usage AS (
         SELECT oc.coupon_id, COUNT(DISTINCT oc.order_id) AS usage_count
         FROM order_coupons oc
         JOIN orders o ON o.order_id = oc.order_id
         WHERE o.user_id = $1
           AND oc.coupon_id IN (SELECT selected_coupon_id FROM wishlist_coupon_ids)
         GROUP BY oc.coupon_id
       )
      SELECT 
        wi.variant_id,
        CASE 
          WHEN wi.selected_coupon_id IS NULL THEN NULL
          WHEN c_val.coupon_id IS NOT NULL THEN wi.selected_coupon_id
          ELSE NULL
        END as selected_coupon_id,
        p.product_id,
        p.name,
        pv.price,
        pv.color,
        pv.size,
        c.category_id,
        c.category_name as category,
        p.product_type_id,
        pi.img_url as image
      FROM wishlist_items wi
      JOIN product_variants pv ON pv.variant_id = wi.variant_id
      JOIN products p ON p.product_id = pv.product_id
      JOIN product_categories pc ON pc.product_id = p.product_id AND pc.is_primary = TRUE
      JOIN categories c ON c.category_id = pc.category_id
      LEFT JOIN product_images pi ON pi.variant_id = wi.variant_id AND pi.is_primary = TRUE
      LEFT JOIN coupons c_val ON c_val.coupon_id = wi.selected_coupon_id
        AND c_val.is_active = true
        AND (c_val.valid_until IS NULL OR c_val.valid_until > NOW())
        AND (c_val.usage_limit_total IS NULL OR c_val.usage_count_total < c_val.usage_limit_total)
        AND (
          c_val.usage_limit_per_user IS NULL OR
          COALESCE((SELECT usage_count FROM user_usage WHERE coupon_id = c_val.coupon_id), 0) < c_val.usage_limit_per_user
        )
      WHERE wi.user_id = $1
      ORDER BY wi.added_at DESC`,
      [user.userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// WISHLIST - SYNC
// ============================================================================

/**
 * POST sync localStorage wishlist to database
 */
export const syncWishlist = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { wishlistItems } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of wishlistItems) {
        await client.query(
          `INSERT INTO wishlist_items (user_id, variant_id, selected_coupon_id, added_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT (user_id, variant_id) 
           DO UPDATE SET selected_coupon_id = $3, added_at = NOW()`,
          [user.userId, item.variant_id, item.selected_coupon_id || null]
        );
      }

      await client.query('COMMIT');
      res.json({ message: "Wishlist synced successfully" });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error syncing wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};