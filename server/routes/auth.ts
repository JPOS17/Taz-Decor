import express from "express";
import { body } from "express-validator";
import { 
  register, 
  login, 
  getCurrentUser,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword
} from "../controllers/authController";

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
// AUTHENTICATION ROUTES
// ============================================================================

// POST register new user
authRouter.post("/register", registerValidation, register);

// POST login
authRouter.post("/login", loginValidation, login);

// GET current authenticated user
authRouter.get("/me", getCurrentUser);

// ============================================================================
// EMAIL VERIFICATION ROUTES
// ============================================================================

// GET verify email with token
authRouter.get("/verify-email/:token", verifyEmail);

// POST resend verification email
authRouter.post("/resend-verification", resendVerification);

// ============================================================================
// PASSWORD RESET ROUTES
// ============================================================================

// POST request password reset
authRouter.post("/forgot-password", forgotPassword);

// POST reset password with token
authRouter.post("/reset-password", resetPasswordValidation, resetPassword);