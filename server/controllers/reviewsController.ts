import { Request, Response } from "express";
import { pool } from "../db";

// GET /api/products/:productId/reviews
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      `SELECT 
        r.review_id,
        r.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        r.rating,
        r.review_title,
        r.review_text,
        r.is_verified_purchase,
        r.helpful_count,
        r.created_at,
        COALESCE(
          pv.color || CASE WHEN pv.size IS NOT NULL THEN ', ' || pv.size ELSE '' END,
          ''
        ) as variant_details
       FROM reviews r
       JOIN users u ON u.user_id = r.user_id
       LEFT JOIN product_variants pv ON pv.variant_id = r.variant_id
       WHERE r.product_id = $1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Server error" });
  }
};