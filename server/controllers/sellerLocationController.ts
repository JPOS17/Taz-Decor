import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// SELLER LOCATIONS - GET ACTIVE
// ============================================================================

/**
 * GET all active seller locations
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

// re-export getLocationById from settingsController.ts to avoid circular imports
export { getLocationById } from "./settingsController";