import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes as directoryRoutes } from "./routes/directoryRoutes.js";
import { connectDB } from "./config/db.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

// Middleware
app.use(express.json()); // Parse JSON bodies

// CORS configuration
if (process.env.NODE_ENV !== "production") {
  console.log("CORS enabled for development");
  app.use(cors({
    origin: process.env.VITE_CLIENT_API_URL_LOCAL
  }));
}

// Rate limiting
app.use(rateLimiter);

// API routes - should come BEFORE static file serving
app.use("/api/directory", directoryRoutes); // Consider adding /api prefix for clarity

// Static file serving for production - should come AFTER API routes
if (process.env.NODE_ENV === "production") {
  console.log("Serving static files in production");

  // Serve static files from React build directory
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Handle SPA routing - serve index.html for all non-API routes
  // Express 5 compatible wildcard pattern
  app.get('/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
};

// Connect to database and start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT: ", PORT);
  });
});