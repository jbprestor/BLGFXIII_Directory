import express from "express";
import {
  getAllQRRPAMonitorings,
  getQRRPAMonitoringById,
  createQRRPAMonitoring,
  updateQRRPAMonitoring,
  deleteQRRPAMonitoring,
  getQRRPAMonitoringByLGU,
  getQRRPAMonitoringByPeriod
} from "../controllers/qrrpaMonitoringController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllQRRPAMonitorings);
router.get("/:id", getQRRPAMonitoringById);
router.get("/lgu/:lguId", getQRRPAMonitoringByLGU);
router.get("/period/:period", getQRRPAMonitoringByPeriod);

// Protected routes
router.post("/", authenticate, createQRRPAMonitoring);
router.put("/:id", authenticate, updateQRRPAMonitoring);
router.delete("/:id", authenticate, deleteQRRPAMonitoring);

export { router as qrrpaMonitoringRoutes };