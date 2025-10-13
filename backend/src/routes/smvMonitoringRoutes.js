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
  getSMVMonitoringProgress,
  updateSMVMonitoringTimeline,
} from "../controllers/smvMonitoringController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllSMVMonitoring);
router.get("/lgu/:lguId", getSMVMonitoringByLGU);         // ✅ put this before "/:id"
router.get("/:id/progress", getSMVMonitoringProgress);    // ✅ put this before "/:id"
router.get("/:id", getSMVMonitoringById);

// Protected routes
router.post("/", authenticate, createSMVMonitoring);
router.put("/:id", authenticate, updateSMVMonitoring);
router.patch("/:id/activities/:activityId", authenticate, updateSMVMonitoringActivity);
router.patch("/:id/timeline", authenticate, updateSMVMonitoringTimeline); // 🔹 Set timeline dates
router.delete("/:id", authenticate, deleteSMVMonitoring);

export { router as smvMonitoringRoutes };
