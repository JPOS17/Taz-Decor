import { Request, Response } from "express";
import { pool } from "../db";

// ============================================================================
// SELLER LOCATIONS
// ============================================================================

/**
 * GET all seller locations
 */
export const getAllLocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active } = req.query;
    
    let query = `
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
        is_active,
        created_at
      FROM seller_locations 
    `;
    
    const params: any[] = [];
    
    if (active === 'true') {
      query += ' WHERE is_active = true';
    } else if (active === 'false') {
      query += ' WHERE is_active = false';
    }
    
    query += ' ORDER BY location_id ASC';
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Failed to fetch locations' });
  }
};

/**
 * GET single location by ID
 */
export const getLocationById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;
    
    const result = await pool.query(
      `SELECT 
        location_id,
        location_name,
        state,
        city,
        address_line1,
        address_line2,
        zip,
        phone,
        contact_name,
        is_active,
        created_at
      FROM seller_locations
      WHERE location_id = $1`,
      [locationId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: 'Failed to fetch location' });
  }
};

/**
 * CREATE new seller location
 */
export const createLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      location_name,
      state,
      city,
      address_line1,
      address_line2,
      zip,
      phone,
      contact_name,
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!location_name || !state || !city || !address_line1 || !zip) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    const result = await pool.query(
      `INSERT INTO seller_locations 
        (location_name, state, city, address_line1, address_line2, zip, phone, contact_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [location_name, state, city, address_line1, address_line2 || null, zip, phone || null, contact_name || null, is_active]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ message: 'Failed to create location' });
  }
};

/**
 * UPDATE seller location
 */
export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;
    const {
      location_name,
      state,
      city,
      address_line1,
      address_line2,
      zip,
      phone,
      contact_name,
      is_active
    } = req.body;
    
    // Check if location exists
    const existing = await pool.query(
      'SELECT * FROM seller_locations WHERE location_id = $1',
      [locationId]
    );
    
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (location_name !== undefined) {
      updates.push(`location_name = $${paramCount}`);
      values.push(location_name);
      paramCount++;
    }
    if (state !== undefined) {
      updates.push(`state = $${paramCount}`);
      values.push(state);
      paramCount++;
    }
    if (city !== undefined) {
      updates.push(`city = $${paramCount}`);
      values.push(city);
      paramCount++;
    }
    if (address_line1 !== undefined) {
      updates.push(`address_line1 = $${paramCount}`);
      values.push(address_line1);
      paramCount++;
    }
    if (address_line2 !== undefined) {
      updates.push(`address_line2 = $${paramCount}`);
      values.push(address_line2 || null);
      paramCount++;
    }
    if (zip !== undefined) {
      updates.push(`zip = $${paramCount}`);
      values.push(zip);
      paramCount++;
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      values.push(phone || null);
      paramCount++;
    }
    if (contact_name !== undefined) {
      updates.push(`contact_name = $${paramCount}`);
      values.push(contact_name || null);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    values.push(locationId);
    
    const result = await pool.query(
      `UPDATE seller_locations 
       SET ${updates.join(', ')}
       WHERE location_id = $${paramCount}
       RETURNING *`,
      values
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Failed to update location' });
  }
};

/**
 * DELETE seller location
 */
export const deleteLocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;
    
    // Check if location has associated boxes
    const boxCheck = await pool.query(
      'SELECT COUNT(*) FROM shipping_boxes WHERE location_id = $1',
      [locationId]
    );
    
    if (parseInt(boxCheck.rows[0].count) > 0) {
      res.status(400).json({ 
        message: 'Cannot delete location with associated shipping boxes. Please reassign or delete the boxes first.' 
      });
      return;
    }
    
    const result = await pool.query(
      'DELETE FROM seller_locations WHERE location_id = $1 RETURNING *',
      [locationId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Failed to delete location' });
  }
};

/**
 * TOGGLE location active status
 */
export const toggleLocationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { locationId } = req.params;
    const { is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE seller_locations SET is_active = $1 WHERE location_id = $2 RETURNING *',
      [is_active, locationId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Location not found' });
      return;
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error toggling location status:', error);
    res.status(500).json({ message: 'Failed to toggle location status' });
  }
};

// ============================================================================
// SHIPPING BOXES
// ============================================================================

/**
 * GET all shipping boxes
 */
export const getAllShippingBoxes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { active, location_id, box_type } = req.query;

    let query = `
      SELECT
        sb.box_id,
        sb.box_name,
        sb.length_in,
        sb.width_in,
        sb.height_in,
        sb.box_type,
        sb.location_id,
        sb.box_size_order,
        sb.is_active,
        sb.created_at,
        sl.location_name
      FROM shipping_boxes sb
      LEFT JOIN seller_locations sl ON sl.location_id = sb.location_id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (active === 'true') {
      query += ` AND sb.is_active = true`;
    } else if (active === 'false') {
      query += ` AND sb.is_active = false`;
    }

    if (location_id) {
      query += ` AND sb.location_id = $${paramCount}`;
      params.push(location_id);
      paramCount++;
    }

    if (box_type) {
      query += ` AND sb.box_type = $${paramCount}`;
      params.push(box_type);
      paramCount++;
    }

    query += ' ORDER BY sb.box_size_order ASC, sb.box_name ASC';

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching shipping boxes:', error);
    res.status(500).json({ message: 'Failed to fetch shipping boxes' });
  }
};

/**
 * GET single shipping box by ID
 */
export const getShippingBoxById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxId } = req.params;

    const result = await pool.query(
      `SELECT
        sb.box_id,
        sb.box_name,
        sb.length_in,
        sb.width_in,
        sb.height_in,
        sb.box_type,
        sb.location_id,
        sb.box_size_order,
        sb.is_active,
        sb.created_at,
        sl.location_name
      FROM shipping_boxes sb
      LEFT JOIN seller_locations sl ON sl.location_id = sb.location_id
      WHERE sb.box_id = $1`,
      [boxId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Shipping box not found' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching shipping box:', error);
    res.status(500).json({ message: 'Failed to fetch shipping box' });
  }
};

/**
 * CREATE new shipping box
 */
export const createShippingBox = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      box_name,
      length_in,
      width_in,
      height_in,
      box_type,
      location_id,
      is_active = true
    } = req.body;
    
    // Validate required fields
    if (!box_name || !length_in || !width_in || !height_in || !box_type || !location_id) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    
    // Get the next box_size_order value for this location
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(box_size_order), 0) + 1 as next_order FROM shipping_boxes WHERE location_id = $1',
      [location_id]
    );
    
    const nextOrder = orderResult.rows[0].next_order;

    const result = await pool.query(
      `INSERT INTO shipping_boxes
        (box_name, length_in, width_in, height_in, box_type, location_id, box_size_order, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [box_name, length_in, width_in, height_in, box_type, location_id, nextOrder, is_active]
    );

    const boxId = result.rows[0].box_id;

    const boxWithLocation = await pool.query(
      `SELECT sb.*, sl.location_name
       FROM shipping_boxes sb
       LEFT JOIN seller_locations sl ON sl.location_id = sb.location_id
       WHERE sb.box_id = $1`,
      [boxId]
    );

    res.status(201).json(boxWithLocation.rows[0]);
  } catch (error) {
    console.error('Error creating shipping box:', error);
    res.status(500).json({ message: 'Failed to create shipping box' });
  }
};

/**
 * UPDATE shipping box
 */
export const updateShippingBox = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxId } = req.params;
    const {
      box_name,
      length_in,
      width_in,
      height_in,
      box_type,
      location_id,
      is_active
    } = req.body;
    
    // Check if box exists
    const existing = await pool.query(
      'SELECT * FROM shipping_boxes WHERE box_id = $1',
      [boxId]
    );
    
    if (existing.rows.length === 0) {
      res.status(404).json({ message: 'Shipping box not found' });
      return;
    }
    
    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (box_name !== undefined) {
      updates.push(`box_name = $${paramCount}`);
      values.push(box_name);
      paramCount++;
    }
    if (length_in !== undefined) {
      updates.push(`length_in = $${paramCount}`);
      values.push(length_in);
      paramCount++;
    }
    if (width_in !== undefined) {
      updates.push(`width_in = $${paramCount}`);
      values.push(width_in);
      paramCount++;
    }
    if (height_in !== undefined) {
      updates.push(`height_in = $${paramCount}`);
      values.push(height_in);
      paramCount++;
    }
    if (box_type !== undefined) {
      updates.push(`box_type = $${paramCount}`);
      values.push(box_type);
      paramCount++;
    }
    if (location_id !== undefined) {
      updates.push(`location_id = $${paramCount}`);
      values.push(location_id);
      paramCount++;
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount}`);
      values.push(is_active);
      paramCount++;
    }
    
    if (updates.length === 0) {
      res.status(400).json({ message: 'No fields to update' });
      return;
    }
    
    values.push(boxId);

    await pool.query(
      `UPDATE shipping_boxes
       SET ${updates.join(', ')}
       WHERE box_id = $${paramCount}`,
      values
    );

    const boxWithLocation = await pool.query(
      `SELECT sb.*, sl.location_name
       FROM shipping_boxes sb
       LEFT JOIN seller_locations sl ON sl.location_id = sb.location_id
       WHERE sb.box_id = $1`,
      [boxId]
    );

    res.json(boxWithLocation.rows[0]);
  } catch (error) {
    console.error('Error updating shipping box:', error);
    res.status(500).json({ message: 'Failed to update shipping box' });
  }
};

/**
 * DELETE shipping box
 */
export const deleteShippingBox = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxId } = req.params;
    
    // Check if box is used in any orders
    const orderCheck = await pool.query(
      'SELECT COUNT(*) FROM orders WHERE selected_box_id = $1',
      [boxId]
    );
    
    if (parseInt(orderCheck.rows[0].count) > 0) {
      res.status(400).json({ 
        message: 'Cannot delete box that has been used in orders. You can deactivate it instead.' 
      });
      return;
    }
    
    const result = await pool.query(
      'DELETE FROM shipping_boxes WHERE box_id = $1 RETURNING *',
      [boxId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ message: 'Shipping box not found' });
      return;
    }
    
    res.json({ message: 'Shipping box deleted successfully' });
  } catch (error) {
    console.error('Error deleting shipping box:', error);
    res.status(500).json({ message: 'Failed to delete shipping box' });
  }
};

/**
 * TOGGLE shipping box active status
 */
export const toggleShippingBoxStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxId } = req.params;
    const { is_active } = req.body;

    const check = await pool.query(
      'UPDATE shipping_boxes SET is_active = $1 WHERE box_id = $2 RETURNING box_id',
      [is_active, boxId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ message: 'Shipping box not found' });
      return;
    }

    const boxWithLocation = await pool.query(
      `SELECT sb.*, sl.location_name
       FROM shipping_boxes sb
       LEFT JOIN seller_locations sl ON sl.location_id = sb.location_id
       WHERE sb.box_id = $1`,
      [boxId]
    );

    res.json(boxWithLocation.rows[0]);
  } catch (error) {
    console.error('Error toggling shipping box status:', error);
    res.status(500).json({ message: 'Failed to toggle shipping box status' });
  }
};

/**
 * REORDER shipping boxes
 */
export const reorderShippingBoxes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { boxes } = req.body;
    
    // Validate input
    if (!Array.isArray(boxes) || boxes.length === 0) {
      res.status(400).json({ message: 'Invalid boxes array' });
      return;
    }
    
    // Validate each box has required fields
    for (const box of boxes) {
      if (!box.box_id || box.box_size_order === undefined) {
        res.status(400).json({ message: 'Each box must have box_id and box_size_order' });
        return;
      }
    }
    
    // Update all boxes in a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      for (const box of boxes) {
        await client.query(
          'UPDATE shipping_boxes SET box_size_order = $1 WHERE box_id = $2',
          [box.box_size_order, box.box_id]
        );
      }
      
      await client.query('COMMIT');

      res.json({ message: 'Boxes reordered successfully', count: boxes.length });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error reordering shipping boxes:', error);
    res.status(500).json({ message: 'Failed to reorder shipping boxes' });
  }
};