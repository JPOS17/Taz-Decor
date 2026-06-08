import { Request, Response } from "express";
import { getUserFromToken } from "../middleware/authMiddleware";
import { pool } from "../db";
import bcrypt from "bcrypt";

// ============================================================================
// USER PROFILE MANAGEMENT
// ============================================================================

/**
 * GET user profile with default address
 */
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // fetch user profile and default address together 
    const result = await pool.query(
      `SELECT
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.role,
        u.is_active,
        u.is_email_verified,
        u.created_at,
        a.address_id,
        a.address_name,
        a.address_line1,
        a.address_line2,
        a.city,
        a.state,
        a.zip,
        a.country,
        a.is_default
      FROM users u
      LEFT JOIN user_addresses a
        ON a.user_id = u.user_id AND a.is_default = true
      WHERE u.user_id = $1
      LIMIT 1`,
      [user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const row = result.rows[0];

    const userData = {
      user_id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      is_active: row.is_active,
      is_email_verified: row.is_email_verified,
      created_at: row.created_at,
    };

    const defaultAddress = row.address_id
      ? {
        address_id: row.address_id,
        address_name: row.address_name,
        address_line1: row.address_line1,
        address_line2: row.address_line2,
        city: row.city,
        state: row.state,
        zip: row.zip,
        country: row.country,
        is_default: row.is_default,
      }
      : null;

    res.json({
      user: userData,
      default_address: defaultAddress
    });

  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE user profile (first name, last name, phone)
 */
export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { first_name, last_name, phone } = req.body;

    // Validate inputs
    if (!first_name || !last_name) {
      res.status(400).json({
        message: "First name and last name are required"
      });
      return;
    }

    if (phone) {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        res.status(400).json({ message: "Please enter a valid 10-digit phone number" });
        return;
      }
    }

    // Update user profile
    const result = await pool.query(
      `UPDATE users 
      SET first_name = $1, last_name = $2, phone = $3, updated_at = NOW()
      WHERE user_id = $4
      RETURNING user_id, first_name, last_name, email, phone, role, is_active, is_email_verified`,
      [first_name, last_name, phone || null, user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({
      message: "Profile updated successfully",
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE account — verifies password before permanently deleting the user
 */
export const deleteAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { password } = req.body;

    if (!password) {
      res.status(400).json({ message: "Password is required to delete your account" });
      return;
    }

    // Fetch the stored password hash
    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE user_id = $1",
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);
    if (!isMatch) {
      res.status(401).json({ message: "Incorrect password. Please try again." });
      return;
    }

    // Delete the user — cascades to addresses and other related data
    await pool.query("DELETE FROM users WHERE user_id = $1", [user.userId]);

    res.json({ message: "Account deleted successfully" });

  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// ADDRESS MANAGEMENT
// ============================================================================

/**
 * SET default address
 */
export const setDefaultAddress = async (req: Request, res: Response) => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { addressId } = req.params;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify address belongs to user
      const addressCheck = await client.query(
        'SELECT * FROM user_addresses WHERE address_id = $1 AND user_id = $2',
        [addressId, user.userId]
      );

      if (addressCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ message: "Address not found" });
        return;
      }

      // Unset all default addresses for this user
      await client.query(
        'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
        [user.userId]
      );

      // Set new default
      const result = await client.query(
        'UPDATE user_addresses SET is_default = TRUE WHERE address_id = $1 AND user_id = $2 RETURNING *',
        [addressId, user.userId]
      );

      await client.query('COMMIT');

      res.json({
        message: "Default address updated successfully",
        address: result.rows[0]
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error setting default address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET all user addresses
 */
export const getUserAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const result = await pool.query(
      `SELECT 
        address_id,
        address_name,
        address_line1,
        address_line2,
        city,
        state,
        zip,
        country,
        is_default
      FROM user_addresses
      WHERE user_id = $1
      ORDER BY is_default DESC, created_at DESC`,
      [user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching addresses:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * CREATE new address
 */
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const {
      address_name,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country,
      is_default
    } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // If this is set as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
          [user.userId]
        );
      }

      // Insert new address
      const result = await client.query(
        `INSERT INTO user_addresses 
        (user_id, address_name, address_line1, address_line2, city, state, zip, country, is_default)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [user.userId, address_name, address_line1, address_line2, city, state, zip, country || 'USA', is_default]
      );

      await client.query('COMMIT');
      res.status(201).json(result.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * UPDATE address
 */
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { addressId } = req.params;
    const {
      address_name,
      address_line1,
      address_line2,
      city,
      state,
      zip,
      country,
      is_default
    } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verify address belongs to user
      const checkResult = await client.query(
        'SELECT * FROM user_addresses WHERE address_id = $1 AND user_id = $2',
        [addressId, user.userId]
      );

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(404).json({ message: "Address not found" });
        return;
      }

      // If setting as default, unset other defaults
      if (is_default) {
        await client.query(
          'UPDATE user_addresses SET is_default = FALSE WHERE user_id = $1',
          [user.userId]
        );
      }

      // Update address
      const result = await client.query(
        `UPDATE user_addresses 
        SET address_name = $1, address_line1 = $2, address_line2 = $3,
            city = $4, state = $5, zip = $6, country = $7, 
            is_default = $8, updated_at = NOW()
        WHERE address_id = $9 AND user_id = $10
        RETURNING *`,
        [address_name, address_line1, address_line2, city, state, zip, country, is_default, addressId, user.userId]
      );

      await client.query('COMMIT');
      res.json(result.rows[0]);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * DELETE address
 */
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUserFromToken(req.headers.authorization);
    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const { addressId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_addresses WHERE address_id = $1 AND user_id = $2 RETURNING *',
      [addressId, user.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "Address not found" });
      return;
    }

    res.json({ message: "Address deleted successfully" });

  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({ message: "Server error" });
  }
};
