import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { rateLimiter, authRateLimiter } from "./middleware/rateLimiter.js";
import path from "path";

// Import all route files
import { authRoutes } from "./routes/authRoutes.js";
import { lguRoutes } from "./routes/lguRoutes.js";
import { assessorRoutes } from "./routes/assessorRoutes.js";
import { smvMonitoringRoutes } from "./routes/smvMonitoringRoutes.js";
import { laoeMonitoringRoutes } from "./routes/laoeMonitoringRoutes.js";
import { qrrpaMonitoringRoutes } from "./routes/qrrpaMonitoringRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Trust proxy to get real IP when behind reverse proxy (NGINX, etc.)
app.set('trust proxy', 1);

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS configuration
if (process.env.NODE_ENV !== "production") {
  console.log("CORS enabled for development");
  app.use(cors({
    origin: process.env.VITE_CLIENT_API_URL_LOCAL,
    credentials: true
  }));
}

// Apply rate limiting to all routes
app.use(rateLimiter);

// API routes - organized by resource
app.use("/api/auth", authRateLimiter, authRoutes); // Stricter rate limiting for auth
app.use("/api/lgus", lguRoutes);
app.use("/api/assessors", assessorRoutes);
app.use("/api/smv-processes", smvMonitoringRoutes);
app.use("/api/laoe-monitoring", laoeMonitoringRoutes);
app.use("/api/qrrpa-monitoring", qrrpaMonitoringRoutes);

// Health check endpoint (no rate limiting)
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// Static file serving for production
if (process.env.NODE_ENV === "production") {
  console.log("Serving static files in production");
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  
  // Handle SPA routing
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: "Something went wrong!", 
    error: process.env.NODE_ENV === "production" ? {} : err.message 
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({ message: "API endpoint not found" });
});

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server started on PORT: ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error("Failed to connect to database:", error);
  process.exit(1);
});