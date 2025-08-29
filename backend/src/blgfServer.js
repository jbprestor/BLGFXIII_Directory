import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes as directoryRoutes } from "./routes/directoryRoutes.js"
import { connectDB } from "./config/db.js";
import { rateLimiter } from "./middleware/rateLimiter.js";


dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001

//middleware
app.use(express.json()) // this middleware will parse the JSON bodies: req.body
app.use(rateLimiter)
app.use(
    cors(
        {
            origin: "https://automatic-tribble-grqpw6gp9pq39jqx-5173.app.github.dev",
        }
    ))

//our simple custom middleware
// app.use ((req,res,next) => {
//     console.log("We just got a new req")
//     next();
// })

app.use("/api/directory", directoryRoutes);

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Server started on PORT: ", PORT);
    });
});