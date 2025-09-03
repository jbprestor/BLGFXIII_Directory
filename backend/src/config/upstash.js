import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";


import dotenv from "dotenv"

dotenv.config()

export const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(50, "60 s"), // 50 requests per minute

});