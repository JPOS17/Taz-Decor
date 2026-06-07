import express from "express";
import { getActiveLocations, getLocationById } from "../controllers/sellerLocationController";

export const sellerLocationRouter = express.Router();

// ============================================================================
// SELLER LOCATION ROUTES — Public
// ============================================================================

// GET all active seller locations
sellerLocationRouter.get("/", getActiveLocations);

// GET single seller location by ID
sellerLocationRouter.get("/:locationId", getLocationById);