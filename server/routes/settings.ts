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
  reorderShippingBoxes
} from "../controllers/settingsController";

export const settingsRouter = express.Router();

// Protect all settings routes - only managers and admins
settingsRouter.use(requireManagerOrAdmin);

// ============================================================================
// SELLER LOCATIONS ROUTES
// ============================================================================

// GET all locations with optional filters
settingsRouter.get("/locations", getAllLocations);

// GET single location by ID
settingsRouter.get("/locations/:locationId", getLocationById);

// CREATE new location
settingsRouter.post("/locations", createLocation);

// UPDATE location
settingsRouter.put("/locations/:locationId", updateLocation);

// DELETE location
settingsRouter.delete("/locations/:locationId", deleteLocation);

// TOGGLE location status
settingsRouter.put("/locations/:locationId/status", toggleLocationStatus);

// ============================================================================
// SHIPPING BOXES ROUTES
// ============================================================================

// GET all shipping boxes with optional filters
settingsRouter.get("/shipping-boxes", getAllShippingBoxes);

// REORDER shipping boxes (drag and drop) - MUST BE BEFORE :boxId routes
settingsRouter.put("/shipping-boxes/reorder", reorderShippingBoxes);

// GET single shipping box by ID
settingsRouter.get("/shipping-boxes/:boxId", getShippingBoxById);

// CREATE new shipping box
settingsRouter.post("/shipping-boxes", createShippingBox);

// UPDATE shipping box
settingsRouter.put("/shipping-boxes/:boxId", updateShippingBox);

// DELETE shipping box
settingsRouter.delete("/shipping-boxes/:boxId", deleteShippingBox);

// TOGGLE shipping box status
settingsRouter.put("/shipping-boxes/:boxId/status", toggleShippingBoxStatus);