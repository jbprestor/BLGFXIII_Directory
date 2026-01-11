import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";

// Generate JWT Token
const generateToken = (userId, role) => {
  return jwt.sign({ _id: userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// User Registration
export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, region } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists with this email" });
    }

    // const salt = await bcrypt.genSalt(12);
    // const hashedPassword = await bcrypt.hash(password, salt);


    const user = new User({
      firstName,
      lastName,
      email,
      password, // Passed as plain text, hashed by pre-save hook
      role: role || "Municipal",
      region,
    });

    const savedUser = await user.save();
    const token = generateToken(savedUser._id, savedUser.role);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        region: savedUser.region,
        isActive: savedUser.isActive,
        profilePicture: savedUser.profilePicture,
      },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Error during registration" });
  }
};

// User Login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    if (!user.isActive) {
      return res
        .status(401)
        .json({ message: "Account is deactivated. Contact administrator." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        region: user.region,
        isActive: user.isActive,
        profilePicture: user.profilePicture,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Error during login" });
  }
};

// Get Current User Profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Update User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, region } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { firstName, lastName, region },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
};

// Logout (Client handles token removal)
export const logoutUser = (req, res) => {
  res.status(200).json({ message: "Logout successful" });
};

// Refresh Token
export const refreshToken = async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "No token provided" });

    // Verify token, ignoring expiration to allow refresh
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    const user = await User.findById(decoded._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const newToken = generateToken(user._id, user.role);
    res.status(200).json({ token: newToken });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Error refreshing token" });
  }
};
