import { User, validateUser } from "../models/User.js";
import fs from "fs";
import path from "path";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password for security
    res.status(200).json({
      success: true,
      data: users,
      message: "Users retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: err.message,
    });
  }
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User with given email already exists!" });
    }

    // No manual bcrypt.hash needed (handled by pre-save hook in User model)
    const user = new User(req.body);
    await user.save();

    res.status(201).json({
      message: "User registration submitted successfully. Your account is pending approval.",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region,
        status: user.status,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    // Check if user is approved
    // Auto-approve existing admin users or users created before approval system
    const needsAutoApproval = (
      user.role === "Admin" || // All admin users should be auto-approved
      user.status === "pending" && user.createdAt && new Date(user.createdAt) < new Date("2025-10-09") // Users created before today
    );
    
    if (needsAutoApproval && user.status !== "approved") {
      await User.findByIdAndUpdate(user._id, { status: "approved" });
      user.status = "approved"; // Update local object
      console.log(`Auto-approved existing user: ${user.email} (${user.role})`);
    }
    
    if (user.status !== "approved") {
      return res.status(401).json({ message: "Your account is pending approval. Please contact an administrator." });
    }

    const isPasswordValid = await user.correctPassword(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = user.generateAuthToken();

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region,
        isActive: user.isActive,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error logging in:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Get pending users (Admin only)
export const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({ status: "pending" }).select("-password");
    res.status(200).json({
      success: true,
      data: pendingUsers,
      message: "Pending users retrieved successfully",
    });
  } catch (err) {
    console.error("Error fetching pending users:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending users",
      error: err.message,
    });
  }
};

// Approve or reject user (Admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body; // "approved" or "rejected"

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${status} successfully`,
    });
  } catch (err) {
    console.error("Error updating user status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: err.message,
    });
  }
};

// Migration function: Approve all existing users without status
export const migrateExistingUsers = async (req, res) => {
  try {
    // Update all users without status field to "approved"
    const result = await User.updateMany(
      { status: { $exists: false } },
      { $set: { status: "approved" } }
    );
    
    res.status(200).json({
      success: true,
      message: `Migrated ${result.modifiedCount} existing users to approved status`,
      data: { modifiedCount: result.modifiedCount }
    });
  } catch (err) {
    console.error("Error migrating users:", err);
    res.status(500).json({
      success: false,
      message: "Failed to migrate existing users",
      error: err.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName, email, contactNumber, department } = req.body;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already in use by another account",
        });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (department) updateData.department = department;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: err.message,
    });
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Get current user to check for existing profile picture
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete old profile picture if it exists
    if (currentUser.profilePicture) {
      const oldFilePath = path.join(process.cwd(), currentUser.profilePicture);
      
      // Check if file exists and delete it
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old profile picture: ${oldFilePath}`);
        } catch (deleteError) {
          console.error("Error deleting old profile picture:", deleteError);
          // Continue with upload even if deletion fails
        }
      }
    }

    // Construct the file path relative to uploads directory
    const profilePicturePath = `/uploads/profile/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: profilePicturePath } },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profilePicture: user.profilePicture,
      },
    });
  } catch (err) {
    console.error("Error uploading profile picture:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload profile picture",
      error: err.message,
    });
  }
};

// Delete profile picture
export const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get current user to access profile picture path
    const currentUser = await User.findById(userId);
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the file from disk if it exists
    if (currentUser.profilePicture) {
      const filePath = path.join(process.cwd(), currentUser.profilePicture);
      
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted profile picture: ${filePath}`);
        } catch (deleteError) {
          console.error("Error deleting profile picture file:", deleteError);
          // Continue with database update even if file deletion fails
        }
      }
    }

    // Update database to remove profile picture reference
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { profilePicture: null } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile picture removed successfully",
      data: user,
    });
  } catch (err) {
    console.error("Error deleting profile picture:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete profile picture",
      error: err.message,
    });
  }
};
