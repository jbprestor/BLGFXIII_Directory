import { Directory } from "../models/Directory.js"
import mongoose from "mongoose"; // Import mongoose

export async function getAllDirectory(req, res) {
    try {
        const directory = await Directory.find().sort({ createdAt: -1 });
        res.status(200).json(directory)
    } catch (error) {
        res.status(500).json({ message: "Internal server error get all directory" })
    }
}

export async function getDirectoryByID(req, res) {
    try {
        const { id } = req.params; // Get ID from URL, e.g., /api/directory/:id

        const directory = await Directory.findById(id);

        if (!directory) {
            return res.status(404).json({
                success: false,
                message: "Directory entry not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Directory entry retrieved successfully!",
            data: directory
        });
    } catch (error) {
        console.error("Error fetching directory by ID:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve directory entry.",
            error: error.message
        });
    }
}

export async function createDirectory(req, res) {
    try {
        // Destructure fields from request body
        const {
            name,
            sex,
            civilStatus,
            lguType,
            lguName,
            incomeClass,
            plantillaPosition,
            statusOfAppointment,
            salaryGrade,
            stepIncrement,
            birthday,
            dateOfMandatoryRetirement,
            dateOfCompulsoryRetirement,
            bachelorDegree,
            masteralDegree,
            doctoralDegree,
            eligibility,
            emailAddress,
            contactNumber,
            dateOfAppointment,
            prcLicenseNumber,
        } = req.body;

        // Create new directory entry
        const directory = new Directory({
            name,
            sex,
            civilStatus,
            lguType,
            lguName,
            incomeClass,
            plantillaPosition,
            statusOfAppointment,
            salaryGrade,
            stepIncrement,
            birthday,
            dateOfMandatoryRetirement,
            dateOfCompulsoryRetirement,
            bachelorDegree,
            masteralDegree,
            doctoralDegree,
            eligibility,
            emailAddress,
            contactNumber,
            dateOfAppointment,
            prcLicenseNumber,
        });

        // Save to database
        const savedDirectory = await directory.save();

        res.status(201).json({
            success: true,
            message: "Directory entry created successfully.",
            data: savedDirectory,
        });
    } catch (error) {
        console.error("Error creating directory:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to create directory entry.",
            error: error.message,
        });
    }
}

export async function updateDirectory(req, res) {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid directory ID."
            });
        }

        // Prevent updating _id
        const updates = { ...req.body };
        delete updates._id;

        const updatedDirectory = await Directory.findByIdAndUpdate(
            id,
            updates, // Directly use updates (Mongoose ignores invalid fields)
            { new: true, runValidators: true }
        );

        if (!updatedDirectory) {
            return res.status(404).json({
                success: false,
                message: "Directory entry not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Updated successfully!",
            data: updatedDirectory
        });
    } catch (error) {
        console.error("Error updating directory:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update directory entry.",
            error: error.message
        });
    }
}

export async function deleteDirectory(req, res) {
    try {
        const { id } = req.params; // Get the ID from URL (e.g., /api/directory/:id)

        const deletedDirectory = await Directory.findByIdAndDelete(id);

        if (!deletedDirectory) {
            return res.status(404).json({
                success: false,
                message: "Directory entry not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Deleted successfully!",
            data: deletedDirectory,
        });
    } catch (error) {
        console.error("Error deleting directory:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to delete directory entry.",
            error: error.message,
        });
    }
}
