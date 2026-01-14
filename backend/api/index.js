import app from '../src/blgfServer.js';
import { connectDB } from '../src/config/db.js';

// Vercel Serverless Function Entry Point
export default async function handler(req, res) {
    // Ensure database connection is established
    // Serverless functions are stateless, so we check/connect on every request
    // Mongoose handles connection pooling nicely, so re-calling connectDB is fine
    await connectDB();

    // Forward request to Express app
    return app(req, res);
}
