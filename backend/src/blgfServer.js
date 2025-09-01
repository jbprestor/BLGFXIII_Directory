import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { routes as directoryRoutes } from "./routes/directoryRoutes.js";
import { connectDB } from "./config/db.js";
import { rateLimiter } from "./middleware/rateLimiter.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const CLIENT_API_URL =
  process.env.CLIENT_API_URL || process.env.VITE_CLIENT_API_URL_LOCAL;

//middleware
app.use(express.json()); // this middleware will parse the JSON bodies: req.body
app.use(rateLimiter);
app.use(
  cors({
    origin: function (origin, callback) {
      try {
        // Allow requests from your frontend or Postman (no origin)
        if (!origin || origin === CLIENT_API_URL) {
          callback(null, true); // allow
        } else {
          callback(new Error("Not allowed by CORS")); // reject
        }
      } catch (err) {
        console.error("CORS error:", err);
        callback(err); // pass error to Express
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

//our simple custom middleware
// app.use ((req,res,next) => {
//     console.log("We just got a new req")
//     next();
// })

app.use("/", directoryRoutes);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("Server started on PORT: ", PORT);
  });
});
