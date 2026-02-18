import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// SELLER LOCATIONS - GET ACTIVE
// ============================================================================

/**
 * GET all active seller locations
 * Route: GET /api/sellerlocation
 */
export const getActiveLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT 
        location_id,
        location_name,
        state,
        city,
        address_line1,
        address_line2,
        zip,
        phone,
        contact_name,
        is_active
      FROM seller_locations
      WHERE is_active = TRUE
      ORDER BY location_id 
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching locations:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// SELLER LOCATIONS - GET BY ID
// ============================================================================

/**
 * GET specific seller location by ID
 * Route: GET /api/sellerlocation/:locationId
 * Used for shipping label export
 */
export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;

    const result = await pool.query(`
      SELECT 
        location_id,
        location_name,
        state,
        city,
        address_line1,
        address_line2,
        zip,
        phone,
        contact_name,
        is_active
      FROM seller_locations
      WHERE location_id = $1
    `, [locationId]);

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Seller location not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching location by ID:", error);
    res.status(500).json({ message: "Server error" });
  }
};