import express from "express";
import {
  getAllLAOEMonitorings,
  getLAOEMonitoringById,
  createLAOEMonitoring,
  updateLAOEMonitoring,
  deleteLAOEMonitoring,
  getLAOEMonitoringByLGU,
  getLAOEMonitoringByQuarter
} from "../controllers/laoeMonitoringController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllLAOEMonitorings);
router.get("/:id", getLAOEMonitoringById);
router.get("/lgu/:lguId", getLAOEMonitoringByLGU);
router.get("/quarter/:quarter", getLAOEMonitoringByQuarter);

// Protected routes
router.post("/", authenticate, createLAOEMonitoring);
router.put("/:id", authenticate, updateLAOEMonitoring);
router.delete("/:id", authenticate, deleteLAOEMonitoring);

export { router as laoeMonitoringRoutes };