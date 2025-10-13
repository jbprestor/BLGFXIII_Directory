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
import { getQRRPAStats } from "../controllers/qrrpaMonitoringController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";

// Configure multer storage for QRRPA attachments
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "uploads", "qrrpa");
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const router = express.Router();

// Public routes
router.get("/", getAllQRRPAMonitorings);
router.get("/:id", getQRRPAMonitoringById);
router.get("/lgu/:lguId", getQRRPAMonitoringByLGU);
router.get("/period/:period", getQRRPAMonitoringByPeriod);
router.get("/stats", getQRRPAStats);

// Protected routes
// Accept optional file upload under field name 'attachment'
router.post("/", authenticate, upload.single('attachment'), createQRRPAMonitoring);
router.put("/:id", authenticate, updateQRRPAMonitoring);
router.delete("/:id", authenticate, deleteQRRPAMonitoring);

export { router as qrrpaMonitoringRoutes };