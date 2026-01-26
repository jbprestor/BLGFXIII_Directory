import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public or protected? Let's make it protected as per other sensitive data, 
// though the dashboard is the landing page. We'll stick to 'protected' for safety.
// Public route to match other read-only endpoints
router.get("/stats", getDashboardStats);

export default router;
