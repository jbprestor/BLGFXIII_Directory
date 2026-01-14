import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";


import dotenv from "dotenv"

dotenv.config()

let ratelimitInstance;

try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error("Missing Upstash Redis Env Vars");
    }
    ratelimitInstance = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(50, "60 s"), // 50 requests per minute
    });
} catch (error) {
    console.warn("Rate Limiter initialization failed (Rate limiting disabled):", error.message);
    // Fallback dummy limiter that always succeeds
    ratelimitInstance = {
        limit: async () => ({ success: true, limit: 100, remaining: 99, reset: 0 })
    };
}

export const ratelimit = ratelimitInstance;