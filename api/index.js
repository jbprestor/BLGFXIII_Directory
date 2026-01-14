import app from '../backend/src/blgfServer.js';
import { connectDB } from '../backend/src/config/db.js';

// Vercel Serverless Function Entry Point
export default async function handler(req, res) {
    try {
        // Ensure database connection is established
        await connectDB();

        // Forward request to Express app
        return app(req, res);
    } catch (error) {
        console.error("Serverless Handler Error:", error);
        return res.status(500).json({
            error: "Internal Server Error",
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
