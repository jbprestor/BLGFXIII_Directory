import express from "express";
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  refreshToken
} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);
router.put("/profile", authenticate, updateProfile);
router.post("/refresh-token", refreshToken);

export { router as authRoutes };