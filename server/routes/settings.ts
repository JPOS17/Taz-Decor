import express from "express";
import { requireManagerOrAdmin } from "../middleware/authMiddleware";
import {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationStatus,
  getAllShippingBoxes,
  getShippingBoxById,
  createShippingBox,
  updateShippingBox,
  deleteShippingBox,
  toggleShippingBoxStatus,
  reorderShippingBoxes,
} from "../controllers/settingsController";

export const settingsRouter = express.Router();

// ============================================================================
// MIDDLEWARE — Manager/admin only for all settings routes
// ============================================================================

settingsRouter.use(requireManagerOrAdmin);

// ============================================================================
// SELLER LOCATION ROUTES
// ============================================================================

// GET all locations with optional filters
settingsRouter.get("/locations", getAllLocations);

// GET single location by ID
settingsRouter.get("/locations/:locationId", getLocationById);

// POST create new location
settingsRouter.post("/locations", createLocation);

// PUT update location details
settingsRouter.put("/locations/:locationId", updateLocation);

// PUT toggle location active status
settingsRouter.put("/locations/:locationId/status", toggleLocationStatus);

// DELETE location
settingsRouter.delete("/locations/:locationId", deleteLocation);

// ============================================================================
// SHIPPING BOX ROUTES
// ============================================================================

// GET all shipping boxes with optional filters
settingsRouter.get("/shipping-boxes", getAllShippingBoxes);

// PUT reorder shipping boxes — MUST BE BEFORE /:boxId
settingsRouter.put("/shipping-boxes/reorder", reorderShippingBoxes);

// GET single shipping box by ID
settingsRouter.get("/shipping-boxes/:boxId", getShippingBoxById);

// POST create new shipping box
settingsRouter.post("/shipping-boxes", createShippingBox);

// PUT update shipping box details
settingsRouter.put("/shipping-boxes/:boxId", updateShippingBox);

// PUT toggle shipping box active status
settingsRouter.put("/shipping-boxes/:boxId/status", toggleShippingBoxStatus);

// DELETE shipping box
settingsRouter.delete("/shipping-boxes/:boxId", deleteShippingBox);