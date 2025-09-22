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

/**
 * Public Routes
 */
router.get("/", getAllLGUs);                  // List LGUs with pagination + search
router.get("/search", searchLGUs);            // Quick search LGUs
router.get("/:id", getLGUById);               // Get LGU by ID
router.get("/:id/assessors", getLGUWithAssessors); // Get LGU + assessors
router.get("/:id/smv-process", getLGUWithSMVProcess); // Get LGU + SMV Monitoring

/**
 * Protected Routes
 */
router.post("/", authenticate, createLGU);    // Add new LGU
router.put("/:id", authenticate, updateLGU);  // Update LGU
router.delete("/:id", authenticate, deleteLGU); // Delete LGU

export { router as lguRoutes };
