import express from "express";
import {
  getAllAssessors,
  getAssessorById,
  createAssessor,
  updateAssessor,
  deleteAssessor,
  getAssessorsByLGU,
  searchAssessors
} from "../controllers/assessorController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllAssessors);
router.get("/search", searchAssessors);
router.get("/lgu/:lguId", getAssessorsByLGU);
router.get("/:id", getAssessorById); // keep this last


// Protected routes
router.post("/",  createAssessor);
router.put("/:id", authenticate, updateAssessor);
router.delete("/:id", authenticate, deleteAssessor);

export { router as assessorRoutes };