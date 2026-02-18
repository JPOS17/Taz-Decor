import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ============================================================================
// CONSTANTS
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: string;
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper to get user from JWT token
 * Returns the full decoded token with userId, email, and role
 */
export const getUserFromToken = (authHeader: string | undefined): {
  userId: number;
  email: string;
  role: string;
} | null => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: number;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
};

// ============================================================================
// TOKEN AUTHENTICATION
// ============================================================================

/**
 * Verify JWT token and attach user to request
 */
export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
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

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// ============================================================================
// ROLE-BASED ACCESS CONTROL
// ============================================================================

/**
 * Check if user has required role
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ 
        message: "Access denied. Insufficient permissions." 
      });
      return;
    }

    next();
  };
};

// ============================================================================
// SHORTHAND MIDDLEWARE
// ============================================================================

/**
 * Shorthand middleware for admin-only routes
 */
export const requireAdmin = [
  authenticateToken,
  requireRole("admin")
];

/**
 * Shorthand middleware for manager and admin routes
 */
export const requireManagerOrAdmin = [
  authenticateToken,
  requireRole("manager", "admin")
];