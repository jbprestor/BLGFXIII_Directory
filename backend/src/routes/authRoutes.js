import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser, 
  getUserProfile,
  updateUserProfile,
  refreshToken
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", authenticate, logoutUser);
router.get("/profile", authenticate, getUserProfile);
router.put("/profile", authenticate, updateUserProfile);
router.post("/refresh-token", refreshToken);

export { router as authRoutes };