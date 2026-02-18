import express from "express";
import { getProductReviews } from "../controllers/reviewsController";

export const reviewsRouter = express.Router();

// GET /api/reviews/product/:productId
reviewsRouter.get("/product/:productId", getProductReviews);