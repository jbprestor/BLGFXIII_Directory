import express from "express";
import { routes as directoryRoutes } from "./routes/directoryRoutes.js"
import { connectDB } from "./config/db.js";
import dotenv from "dotenv";
import { rateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express()
const PORT = process.env.PORT || 5001

//middleware
app.use(express.json()) // this middleware will parse the JSON bodies: req.body
app.use(rateLimiter)

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