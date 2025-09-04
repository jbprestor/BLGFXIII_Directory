// routes/smvMonitoringRoutes.js
import express from "express";
import {
    getAllSMVMonitoring,
    getSMVMonitoringById,
    createSMVMonitoring,
    updateSMVMonitoring,
    deleteSMVMonitoring,
    getSMVMonitoringByLGU,
    updateSMVMonitoringActivity,
    getSMVMonitoringProgress
} from "../controllers/smvMonitoringController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllSMVMonitoring);
router.get("/:id", getSMVMonitoringById);
router.get("/lgu/:lguId", getSMVMonitoringByLGU);
router.get("/:id/progress", getSMVMonitoringProgress);

// Protected routes
router.post("/", authenticate, createSMVMonitoring);
router.put("/:id", authenticate, updateSMVMonitoring);
router.patch("/:id/activity/:activityIndex", authenticate, updateSMVMonitoringActivity);
router.delete("/:id", authenticate, deleteSMVMonitoring);

export { router as smvMonitoringRoutes };
