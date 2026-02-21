import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteAccount,
  setDefaultAddress,
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

export const userRouter = express.Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

// All user routes require authentication
userRouter.use(authenticateToken);

// ============================================================================
// USER PROFILE ROUTES
// ============================================================================

// GET user profile with default address
userRouter.get("/profile", getUserProfile);

// UPDATE user profile (first name, last name, phone)
userRouter.put("/profile", updateUserProfile);

// DELETE account (requires password confirmation)
userRouter.delete("/profile", deleteAccount);

// ============================================================================
// ADDRESS MANAGEMENT ROUTES
// ============================================================================

// GET all user addresses
userRouter.get("/addresses", getUserAddresses);

// CREATE new address
userRouter.post("/addresses", createAddress);

// UPDATE address
userRouter.put("/addresses/:addressId", updateAddress);

// DELETE address
userRouter.delete("/addresses/:addressId", deleteAddress);

// SET default address
userRouter.put("/addresses/:addressId/set-default", setDefaultAddress);