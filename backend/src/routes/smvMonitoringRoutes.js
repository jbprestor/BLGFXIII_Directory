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
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllSMVMonitoring);
router.get("/lgu/:lguId", getSMVMonitoringByLGU);         // ✅ put this before "/:id"
router.get("/:id/progress", getSMVMonitoringProgress);    // ✅ put this before "/:id"
router.get("/:id", getSMVMonitoringById);

// Protected routes - Admin and Regional only
router.post("/", authenticate, authorize("Admin", "Regional"), createSMVMonitoring);
router.put("/:id", authenticate, authorize("Admin", "Regional"), updateSMVMonitoring);
router.patch("/:id/activities/:activityId", authenticate, authorize("Admin", "Regional"), updateSMVMonitoringActivity);
router.patch("/:id/timeline", authenticate, authorize("Admin", "Regional"), updateSMVMonitoringTimeline); // 🔹 Set timeline dates
router.delete("/:id", authenticate, authorize("Admin", "Regional"), deleteSMVMonitoring);

export { router as smvMonitoringRoutes };
