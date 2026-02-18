import express from "express";
import { getProductStats } from "../controllers/statisticsController";

export const statisticsRouter = express.Router();

// GET /api/products/:variantId/stats
statisticsRouter.get("/:variantId/stats", getProductStats);

// Coupon route removed - now handled by productsCouponController