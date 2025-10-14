import express from "express";
import {
  getAllUsers,
  registerUser,
  loginUser,
  getPendingUsers,
  updateUserStatus,
  migrateExistingUsers,
  updateProfile,
  uploadProfilePicture,
  deleteProfilePicture,
} from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer storage for profile pictures
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(process.cwd(), "uploads", "profile");
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "profile-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes (require authentication)
router.get("/", authenticate, getAllUsers);
router.get("/pending", authenticate, getPendingUsers);
router.patch("/:userId/status", authenticate, updateUserStatus);
router.post("/migrate", authenticate, migrateExistingUsers);

// Profile management routes
router.put("/profile", authenticate, updateProfile);
router.post("/profile/picture", authenticate, upload.single("profilePicture"), uploadProfilePicture);
router.delete("/profile/picture", authenticate, deleteProfilePicture);

export { router as userRoutes };
