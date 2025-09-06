import express from "express";
import {
  getAllUsers,
  registerUser,
  loginUser,
} from "../controllers/userController.js";

const router = express.Router();

// Public routes
router.get("/", getAllUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);

export { router as userRoutes };
