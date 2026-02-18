import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// PRODUCT STATS
// ============================================================================

/**
 * GET product stats (wishlist, cart, reviews)
 * Route: GET /api/products/:variantId/stats
 */
export const getProductStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { variantId } = req.params;

    // Get wishlist count
    const wishlistResult = await pool.query(
      'SELECT COUNT(*) FROM wishlist_items WHERE variant_id = $1',
      [variantId]
    );

    // Get cart count
    const cartResult = await pool.query(
      'SELECT COUNT(*) FROM shopping_cart_items WHERE variant_id = $1',
      [variantId]
    );

    // Get review count and average rating (need product_id first)
    const productResult = await pool.query(
      'SELECT product_id FROM product_variants WHERE variant_id = $1',
      [variantId]
    );

    if (productResult.rows.length === 0) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const productId = productResult.rows[0].product_id;

    const reviewResult = await pool.query(
      `SELECT COUNT(*) as review_count, AVG(rating) as average_rating 
       FROM reviews WHERE product_id = $1`,
      [productId]
    );

    res.json({
      wishlistCount: parseInt(wishlistResult.rows[0].count),
      cartCount: parseInt(cartResult.rows[0].count),
      reviewCount: parseInt(reviewResult.rows[0].review_count),
      averageRating: reviewResult.rows[0].average_rating 
        ? parseFloat(reviewResult.rows[0].average_rating) 
        : null
    });

  } catch (error) {
    console.error("Error fetching product stats:", error);
    res.status(500).json({ message: "Server error" });
  }
};
