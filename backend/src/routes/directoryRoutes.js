import express from "express"
import { createDirectory, deleteDirectory, getAllDirectory, updateDirectory, getDirectoryByID } from "../controllers/directoryController.js";

// routes/directoryRoutes.js
export const routes = express.Router();

// routes/directoryRoutes.js
routes.get("/", getAllDirectory);
routes.get("/:id", getDirectoryByID);
routes.post("/", createDirectory);
routes.put("/:id", updateDirectory);
routes.delete("/:id", deleteDirectory);
