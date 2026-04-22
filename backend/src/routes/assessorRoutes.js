import express from "express";
import {
  getAllAssessors,
  getAssessorById,
  createAssessor,
  updateAssessor,
  deleteAssessor,
  getAssessorsByLGU,
  searchAssessors,
  getAssessorNotifications
} from "../controllers/assessorController.js";
import { authenticate, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllAssessors);
router.get("/search", searchAssessors);
router.get("/notifications", getAssessorNotifications); // Add this before /:id
router.get("/lgu/:lguId", getAssessorsByLGU);
router.get("/:id", getAssessorById); // keep this last


// Protected routes - Admin and Regional only
router.post("/", authenticate, authorize("Admin", "Regional"), createAssessor);
router.put("/:id", authenticate, authorize("Admin", "Regional"), updateAssessor);
router.delete("/:id", authenticate, authorize("Admin", "Regional"), deleteAssessor);

export { router as assessorRoutes };