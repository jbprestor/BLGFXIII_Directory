import { Directory } from "../models/Directory.js";
import mongoose from "mongoose"; // Import mongoose

export async function getAllDirectory(req, res) {
  try {
    const directory = await Directory.find().sort({ createdAt: -1 });
    res.status(200).json(directory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error get all directory" });
  }
}

export async function getDirectoryByID(req, res) {
  try {
    const { id } = req.params; // Get ID from URL, e.g., /api/directory/:id

    const directory = await Directory.findById(id);

    if (!directory) {
      return res.status(404).json({
        success: false,
        message: "Directory entry not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Directory entry retrieved successfully!",
      data: directory,
    });
  } catch (error) {
    console.error("Error fetching directory by ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve directory entry.",
      error: error.message,
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

    // Validate that id parameter exists and is not "undefined"
    if (!id || id === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Directory ID is required.",
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid directory ID format.",
      });
    }

    // Copy updates from request body
    const updates = { ...req.body };
    delete updates._id; // Prevent updating _id
    delete updates.__v; // Prevent version key updates

    // Convert date strings to Date objects
    const dateFields = [
      "birthday",
      "dateOfAppointment",
      "dateOfMandatoryRetirement",
      "dateOfCompulsoryRetirement",
    ];

    dateFields.forEach((field) => {
      if (updates[field]) {
        // Handle both ISO format and other date formats
        const parsedDate = new Date(updates[field]);
        if (!isNaN(parsedDate.getTime())) {
          updates[field] = parsedDate;
        } else {
          // If date parsing fails, keep the original value
          // but you might want to handle this differently
          console.warn(`Invalid date format for field ${field}: ${updates[field]}`);
        }
      }
    });

    // Ensure numeric fields are proper numbers
    if (updates.stepIncrement !== undefined) {
      updates.stepIncrement = Number(updates.stepIncrement);
      if (isNaN(updates.stepIncrement)) {
        updates.stepIncrement = 0;
      }
    }

    // Update the document in DB
    const updatedDirectory = await Directory.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDirectory) {
      return res.status(404).json({
        success: false,
        message: "Directory entry not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Updated successfully!",
      data: updatedDirectory,
    });
  } catch (error) {
    console.error("Error updating directory:", error);

    // Provide more specific error messages
    let errorMessage = "Failed to update directory entry.";
    if (error.name === "ValidationError") {
      errorMessage = "Validation error: " + Object.values(error.errors).map(e => e.message).join(", ");
    } else if (error.name === "CastError") {
      errorMessage = "Invalid data format provided.";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
