import express from "express";
import {
  getUserProfile,
  updateUserProfile,
  deleteAccount,
  setDefaultAddress,
  getUserAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "../controllers/userController";
import { authenticateToken } from "../middleware/authMiddleware";

export const userRouter = express.Router();

// ============================================================================
// MIDDLEWARE — Authentication required for all user routes
// ============================================================================

userRouter.use(authenticateToken);

// ============================================================================
// PROFILE ROUTES
// ============================================================================

// GET user profile with default address
userRouter.get("/profile", getUserProfile);

// PUT update profile (first name, last name, phone)
userRouter.put("/profile", updateUserProfile);

// DELETE account (requires password confirmation)
userRouter.delete("/profile", deleteAccount);

// ============================================================================
// ADDRESS ROUTES
// ============================================================================

// GET all saved addresses
userRouter.get("/addresses", getUserAddresses);

// POST create new address
userRouter.post("/addresses", createAddress);

// PUT update address — MUST BE BEFORE /addresses/:addressId/set-default
userRouter.put("/addresses/:addressId", updateAddress);

// PUT set address as default
userRouter.put("/addresses/:addressId/set-default", setDefaultAddress);

// DELETE address
userRouter.delete("/addresses/:addressId", deleteAddress);