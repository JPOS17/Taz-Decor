import { Request, Response } from "express";
import { getUserFromToken } from "../middleware/authMiddleware";
import { pool } from "../db";

// ============================================================================
// CART - FUNCTIONS
// ============================================================================

/**
 * POST add item to cart
 */
export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variant_id, quantity, selected_coupon_id } = req.body;

    // Check if item already exists
    const existingResult = await pool.query(
      'SELECT * FROM shopping_cart_items WHERE user_id = $1 AND variant_id = $2',
      [user.userId, variant_id]
    );

    if (existingResult.rows.length > 0) {
      // Update quantity and coupon
      await pool.query(
        'UPDATE shopping_cart_items SET quantity = $1, selected_coupon_id = $2, updated_at = NOW() WHERE user_id = $3 AND variant_id = $4',
        [quantity, selected_coupon_id || null, user.userId, variant_id]
      );
    } else {
      // Insert new item
      await pool.query(
        'INSERT INTO shopping_cart_items (user_id, variant_id, quantity, selected_coupon_id, added_at) VALUES ($1, $2, $3, $4, NOW())',
        [user.userId, variant_id, quantity, selected_coupon_id || null]
      );
    }

    res.json({ message: "Item added to cart" });

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE remove item from cart
 */
export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variantId } = req.params;

    await pool.query(
      'DELETE FROM shopping_cart_items WHERE user_id = $1 AND variant_id = $2',
      [user.userId, variantId]
    );

    res.json({ message: "Item removed from cart" });

  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE clear entire cart
 */
export const clearCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    await pool.query(
      'DELETE FROM shopping_cart_items WHERE user_id = $1',
      [user.userId]
    );

    res.json({ message: "Cart cleared successfully" });

  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * PUT update cart item quantity
 */
export const updateCartQuantity = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variantId } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await pool.query(
        'DELETE FROM shopping_cart_items WHERE user_id = $1 AND variant_id = $2',
        [user.userId, variantId]
      );
    } else {
      await pool.query(
        'UPDATE shopping_cart_items SET quantity = $1, updated_at = NOW() WHERE user_id = $2 AND variant_id = $3',
        [quantity, user.userId, variantId]
      );
    }

    res.json({ message: "Cart updated" });

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// CART - COUPON HANDLING
// ============================================================================

/**
 * PUT update cart item's selected coupon
 */
export const updateCartCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { variantId } = req.params;
    const { selected_coupon_id } = req.body;

    await pool.query(
      'UPDATE shopping_cart_items SET selected_coupon_id = $1, updated_at = NOW() WHERE user_id = $2 AND variant_id = $3',
      [selected_coupon_id || null, user.userId, variantId]
    );

    res.json({ message: "Cart coupon updated" });

  } catch (error) {
    console.error("Error updating cart coupon:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// CART - GET CART
// ============================================================================

/**
 * GET user's cart from database
 * Validates selected_coupon_id on each item — returns null if the coupon is:
 *   - inactive
 *   - expired (valid_until has passed)
 *   - over the global usage limit (usage_count_total >= usage_limit_total)
 *   - over the per-user usage limit (user has used it too many times in past orders)
 */
export const getCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        sci.variant_id,
        sci.quantity,
        CASE 
          WHEN sci.selected_coupon_id IS NULL THEN NULL
          WHEN c_val.coupon_id IS NOT NULL THEN sci.selected_coupon_id
          ELSE NULL
        END as selected_coupon_id,
        p.product_id,
        p.name,
        pv.price,
        pv.color,
        pv.size,
        cat.category_id,
        cat.category_name as category,
        p.product_type_id,
        pi.img_url as image
      FROM shopping_cart_items sci
      JOIN product_variants pv ON pv.variant_id = sci.variant_id
      JOIN products p ON p.product_id = pv.product_id
      JOIN product_categories pc ON pc.product_id = p.product_id AND pc.is_primary = TRUE
      JOIN categories cat ON cat.category_id = pc.category_id
      LEFT JOIN product_images pi ON pi.variant_id = sci.variant_id AND pi.is_primary = TRUE
      LEFT JOIN coupons c_val ON c_val.coupon_id = sci.selected_coupon_id
        AND c_val.is_active = true
        AND (c_val.valid_until IS NULL OR c_val.valid_until > NOW())
        AND (c_val.usage_limit_total IS NULL OR c_val.usage_count_total < c_val.usage_limit_total)
        AND (
          c_val.usage_limit_per_user IS NULL OR (
            SELECT COUNT(*)
            FROM order_coupons oc
            JOIN orders o ON o.order_id = oc.order_id
            WHERE oc.coupon_id = sci.selected_coupon_id
              AND o.user_id = sci.user_id
          ) < c_val.usage_limit_per_user
        )
      WHERE sci.user_id = $1
      ORDER BY sci.added_at DESC`,
      [user.userId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// CART - SYNC
// ============================================================================

/**
 * POST sync localStorage cart to database
 */
export const syncCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { cartItems } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get existing cart items
      const existingResult = await client.query(
        'SELECT variant_id, quantity, selected_coupon_id FROM shopping_cart_items WHERE user_id = $1',
        [user.userId]
      );

      const existingMap = new Map(
        existingResult.rows.map(row => [row.variant_id, { quantity: row.quantity, coupon: row.selected_coupon_id }])
      );

      // Merge localStorage items with database items
      for (const item of cartItems) {
        if (existingMap.has(item.variant_id)) {
          const existing = existingMap.get(item.variant_id);
          if (existing) {
            const newQty = Math.max(existing.quantity, item.quantity);
            const newCoupon = item.selected_coupon_id !== undefined ? item.selected_coupon_id : existing.coupon;
            
            await client.query(
              `UPDATE shopping_cart_items 
               SET quantity = $1, selected_coupon_id = $2, updated_at = NOW() 
               WHERE user_id = $3 AND variant_id = $4`,
              [newQty, newCoupon, user.userId, item.variant_id]
            );
          }
        } else {
          await client.query(
            `INSERT INTO shopping_cart_items (user_id, variant_id, quantity, selected_coupon_id, added_at)
             VALUES ($1, $2, $3, $4, NOW())`,
            [user.userId, item.variant_id, item.quantity, item.selected_coupon_id || null]
          );
        }
      }

      await client.query('COMMIT');
      res.json({ message: "Cart synced successfully" });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error syncing cart:", error);
    res.status(500).json({ message: "Server error" });
  }
};