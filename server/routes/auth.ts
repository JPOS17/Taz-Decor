import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/authMiddleware";

export const authRouter = express.Router();

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const registerValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),
  body("first_name").trim().notEmpty().withMessage("First name is required"),
  body("last_name").trim().notEmpty().withMessage("Last name is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
];

const resetPasswordValidation = [
  body("token").notEmpty().withMessage("Token is required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage("Password must contain uppercase, lowercase, number, and special character"),
];

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

// POST register new user
authRouter.post("/register", registerValidation, register);

// POST login
authRouter.post("/login", loginValidation, login);

// GET verify email with token
authRouter.get("/verify-email/:token", verifyEmail);

// POST request password reset email
authRouter.post("/forgot-password", forgotPassword);

// POST reset password with token
authRouter.post("/reset-password", resetPasswordValidation, resetPassword);

// ============================================================================
// AUTHENTICATED ROUTES
// ============================================================================

// GET current authenticated user
authRouter.get("/me", authenticateToken, getCurrentUser);

// POST resend verification email
authRouter.post("/resend-verification", resendVerification);