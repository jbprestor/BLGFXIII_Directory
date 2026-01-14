import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { rateLimiter, authRateLimiter } from "./middleware/rateLimiter.js";
import path from "path";
import fs from "fs";

// Import all route files
import { userRoutes } from "./routes/usersRoutes.js";
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

// CORS configuration - Must be before all other middleware
const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? process.env.VITE_CLIENT_API_URL_LOCAL
    : [
      process.env.VITE_CLIENT_API_URL_LOCAL,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000'
    ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Serve static files BEFORE rate limiting (images shouldn't be rate limited)
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Ensure qrrpa subfolder exists
const qrrpaDir = path.join(uploadsDir, 'qrrpa');
if (!fs.existsSync(qrrpaDir)) fs.mkdirSync(qrrpaDir, { recursive: true });

// Apply rate limiting to API routes only (not static files)
app.use('/api', rateLimiter);

// API routes - organized by resource
app.use("/api/users", userRoutes);
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
// Connect to database and start server ONLY if run directly
if (process.env.VITE_VERCEL_ENV !== 'true') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server started on PORT: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }).catch((error) => {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  });
}

export default app;