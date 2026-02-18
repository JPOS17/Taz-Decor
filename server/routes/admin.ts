import express from "express";
import { body } from "express-validator";
import { 
  getAllUsers, 
  updateUserRole,
  toggleUserStatus,
  sendEmailToUser
} from "../controllers/adminController";
import { requireAdmin } from "../middleware/authMiddleware";

export const adminRouter = express.Router();

// Protect all admin routes - only admins
adminRouter.use(requireAdmin);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

// GET all users
adminRouter.get("/users", getAllUsers);

// POST send email to specific user
adminRouter.post(
  "/users/:id/email",
  [
    body("subject").notEmpty().withMessage("Subject is required"),
    body("message").notEmpty().withMessage("Message is required")
  ],
  sendEmailToUser
);

// PATCH update user role
adminRouter.patch(
  "/users/:id/role",
  [
    body("role")
      .isIn(["customer", "manager", "admin"])
      .withMessage("Role must be customer, manager, or admin")
  ],
  updateUserRole
);

// PATCH toggle user active status
adminRouter.patch("/users/:id/status", toggleUserStatus);