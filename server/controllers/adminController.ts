import { Response } from "express";
import { pool } from "../db";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendAdminEmail } from "../utils/emailService";

// ============================================================================
// USERS - GET ALL
// ============================================================================

/**
 * GET all users
 * Route: GET /api/admin/users
 */
export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, phone, role, 
              is_email_verified, is_active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    const users = result.rows.map(user => ({
      userId: user.user_id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isEmailVerified: user.is_email_verified,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login
    }));

    res.json({ users });
  } catch (error) {
    console.error("Error getting all users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// USERS - UPDATE ROLE
// ============================================================================

/**
 * PATCH update user role
 * Route: PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const validRoles = ["customer", "manager", "admin"];
    if (!validRoles.includes(role)) {
      res.status(400).json({ 
        message: "Invalid role. Must be customer, manager, or admin" 
      });
      return;
    }

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT user_id FROM users WHERE user_id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Prevent admin from demoting themselves
    if (req.user && req.user.userId === parseInt(id) && role !== "admin") {
      res.status(400).json({ 
        message: "Cannot change your own admin role" 
      });
      return;
    }

    // Update role
    const result = await pool.query(
      `UPDATE users 
       SET role = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, email, first_name, last_name, phone, role, 
                 is_email_verified, is_active, created_at, last_login`,
      [role, id]
    );

    const user = result.rows[0];

    res.json({
      message: "User role updated successfully",
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// USERS - TOGGLE STATUS
// ============================================================================

/**
 * PATCH toggle user active status
 * Route: PATCH /api/admin/users/:id/status
 */
export const toggleUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if user exists
    const userCheck = await pool.query(
      "SELECT user_id, is_active FROM users WHERE user_id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Prevent admin from deactivating themselves
    if (req.user && req.user.userId === parseInt(id)) {
      res.status(400).json({ 
        message: "Cannot change your own account status" 
      });
      return;
    }

    const currentStatus = userCheck.rows[0].is_active;
    const newStatus = !currentStatus;

    // Toggle status
    const result = await pool.query(
      `UPDATE users 
       SET is_active = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, email, first_name, last_name, phone, role, 
                 is_email_verified, is_active, created_at, last_login`,
      [newStatus, id]
    );

    const user = result.rows[0];

    res.json({
      message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });
  } catch (error) {
    console.error("Error toggling user status:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// USERS - SEND EMAIL
// ============================================================================

/**
 * POST send email to specific user
 * Route: POST /api/admin/users/:id/email
 */
export const sendEmailToUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body;

    if (!subject || !message) {
      res.status(400).json({ message: "Subject and message are required" });
      return;
    }

    // Get user details
    const userResult = await pool.query(
      "SELECT email, first_name FROM users WHERE user_id = $1",
      [id]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const { email, first_name } = userResult.rows[0];

    // Send email
    await sendAdminEmail(email, first_name, subject, message);

    res.json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email to user:", error);
    res.status(500).json({ message: "Failed to send email" });
  }
};