import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { pool } from "../db";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/emailService";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * POST register new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      res.status(400).json({ 
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character" 
      });
      return;
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user with default 'customer' role
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, 'customer', false, true)
       RETURNING user_id, email, first_name, last_name, phone, role, is_email_verified, is_active, created_at`,
      [email, password_hash, first_name, last_name, phone]
    );

    const user = result.rows[0];

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, verificationToken, expiresAt]
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken, user.first_name);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isActive: user.is_active
      }
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST login
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      res.status(403).json({ message: "Account is deactivated" });
      return;
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Update last_login
    await pool.query(
      "UPDATE users SET last_login = NOW() WHERE user_id = $1",
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.is_email_verified,
        isActive: user.is_active
      }
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * GET current authenticated user
 */
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };

    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, phone, role, 
              is_email_verified, is_active, created_at, last_login
       FROM users WHERE user_id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = result.rows[0];

    res.json({
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
    });
  } catch (error) {
    console.error("Error getting current user:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

// ============================================================================
// EMAIL VERIFICATION
// ============================================================================

/**
 * GET verify email with token
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    console.log("=== EMAIL VERIFICATION ATTEMPT ===");
    console.log("Received token:", token);
    console.log("Token length:", token.length);

    const result = await pool.query(
      `SELECT * FROM email_verification_tokens WHERE token = $1`,
      [token]
    );

    console.log("Tokens in database:", result.rows.length);
    
    if (result.rows.length > 0) {
      console.log("Token found in database");
      console.log("Token expires at:", result.rows[0].expires_at);
      console.log("Current time:", new Date());
      console.log("Is expired?", new Date(result.rows[0].expires_at) < new Date());
    } else {
      console.log("Token NOT found in database");
    }

    const validResult = await pool.query(
      `SELECT * FROM email_verification_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    console.log("Valid (non-expired) tokens found:", validResult.rows.length);

    if (validResult.rows.length === 0) {
      console.log("Returning error: Invalid or expired token");
      res.status(400).json({ message: "Invalid or expired verification token" });
      return;
    }

    const { user_id } = validResult.rows[0];

    console.log("Updating user:", user_id);

    // Update user as verified
    await pool.query(
      `UPDATE users SET is_email_verified = true WHERE user_id = $1`,
      [user_id]
    );

    // Delete used token
    await pool.query(
      `DELETE FROM email_verification_tokens WHERE token = $1`,
      [token]
    );

    console.log("Email verification successful for user:", user_id);
    console.log("=== VERIFICATION COMPLETE ===");

    res.json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST resend verification email
 */
export const resendVerification = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    const jwtToken = authHeader.substring(7);
    const decoded = jwt.verify(jwtToken, JWT_SECRET) as { userId: number };

    const userResult = await pool.query(
      `SELECT * FROM users WHERE user_id = $1`,
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    if (user.is_email_verified) {
      res.status(400).json({ message: "Email already verified" });
      return;
    }

    // Delete old tokens
    await pool.query(
      `DELETE FROM email_verification_tokens WHERE user_id = $1`,
      [user.user_id]
    );

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, verificationToken, expiresAt]
    );

    await sendVerificationEmail(user.email, verificationToken, user.first_name);

    res.json({ message: "Verification email sent" });
  } catch (error) {
    console.error("Error resending verification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * POST request password reset
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    // Don't reveal if user exists or not
    if (userResult.rows.length === 0) {
      res.json({ message: "If an account exists, a password reset email has been sent" });
      return;
    }

    const user = userResult.rows[0];

    // Delete old tokens
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE user_id = $1`,
      [user.user_id]
    );

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.user_id, resetToken, expiresAt]
    );

    await sendPasswordResetEmail(user.email, resetToken, user.first_name);

    res.json({ message: "If an account exists, a password reset email has been sent" });
  } catch (error) {
    console.error("Error in forgot password:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * POST reset password with token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({ 
        message: "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character" 
      });
      return;
    }

    const result = await pool.query(
      `SELECT * FROM password_reset_tokens WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      res.status(400).json({ message: "Invalid or expired reset token" });
      return;
    }

    const { user_id } = result.rows[0];

    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE user_id = $2`,
      [password_hash, user_id]
    );

    // Delete used token
    await pool.query(
      `DELETE FROM password_reset_tokens WHERE token = $1`,
      [token]
    );

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
};