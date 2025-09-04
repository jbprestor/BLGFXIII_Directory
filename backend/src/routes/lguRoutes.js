import express from "express";
import {
  getAllLGUs,
  getLGUById,
  createLGU,
  updateLGU,
  deleteLGU,
  getLGUWithAssessors,
  getLGUWithSMVProcess,
  searchLGUs
} from "../controllers/lguController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", getAllLGUs);
router.get("/search", searchLGUs);
router.get("/:id", getLGUById);

// Protected routes
router.post("/",  createLGU);
router.put("/:id", authenticate, updateLGU);
router.delete("/:id", authenticate, deleteLGU);
router.get("/:id/assessors", getLGUWithAssessors);
router.get("/:id/smv-process", getLGUWithSMVProcess);

export { router as lguRoutes };