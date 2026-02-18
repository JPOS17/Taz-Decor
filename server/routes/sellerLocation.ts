import express from "express";
import { getActiveLocations, getLocationById } from "../controllers/sellerLocationController";

export const sellerLocationRouter = express.Router();

// ============================================================================
// SELLER LOCATION ROUTES (PUBLIC)
// ============================================================================

// GET all active locations - Public route (no auth needed)
sellerLocationRouter.get("/", getActiveLocations);

// GET specific location by ID - Public route (no auth needed)
sellerLocationRouter.get("/:locationId", getLocationById);