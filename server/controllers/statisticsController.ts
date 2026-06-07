import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// PRODUCT STATS
// ============================================================================

/**
 * GET product stats (wishlist, cart, reviews)
 */
export const getProductStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;

    const result = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM wishlist_items WHERE variant_id = $1) AS wishlist_count,
        (SELECT COUNT(*) FROM shopping_cart_items WHERE variant_id = $1) AS cart_count,
        pv.product_id,
        (SELECT COUNT(*) FROM reviews WHERE product_id = pv.product_id) AS review_count,
        (SELECT AVG(rating) FROM reviews WHERE product_id = pv.product_id) AS average_rating
       FROM product_variants pv
       WHERE pv.variant_id = $1`,
      [variantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const row = result.rows[0];

    res.json({
      wishlistCount: parseInt(row.wishlist_count),
      cartCount: parseInt(row.cart_count),
      reviewCount: parseInt(row.review_count),
      averageRating: row.average_rating ? parseFloat(row.average_rating) : null,
    });

  } catch (error) {
    console.error("Error fetching product stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};