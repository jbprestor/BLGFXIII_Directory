import { ratelimit } from "../config/upstash.js";

export const rateLimiter = async (req, res, next) => {
    try {
        // Use IP address as the key for rate limiting
        const identifier = req.ip || req.connection.remoteAddress;
        const { success } = await ratelimit.limit(identifier);

        if (!success) {
            return res.status(429).json({
                message: "Too many requests, please try again later",
            });
        }

        next();
    } catch (error) {
        console.error("Rate limit error:", error);
        // Allow the request to proceed if Redis/Upstash is down
        next();
    }
};

// Stricter rate limiter for authentication endpoints
export const authRateLimiter = async (req, res, next) => {
    try {
        const identifier = `auth-${req.ip || req.connection.remoteAddress}`;
        const { success } = await ratelimit.limit(identifier);

        if (!success) {
            return res.status(429).json({
                message: "Too many authentication attempts, please try again later",
            });
        }

        next();
    } catch (error) {
        console.error("Auth rate limit error:", error);
        next();
    }
};