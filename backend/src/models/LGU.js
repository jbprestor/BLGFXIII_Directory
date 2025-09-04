import mongoose from "mongoose";

const lguSchema = new mongoose.Schema(
  {
    // Basic Identification
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    province: {
      type: String,
      required: true,
    },
    region: {
      type: String,
      required: true,
    },
    classification: {
      type: String,
      enum: ["HUC", "CC", "Municipality", "Province", "ICC"],
      required: true,
    },
    incomeClass: {
      type: String,
      trim: true,
      required: true,
    },

    // LCE Profile Information
    lce: {
      lastName: { type: String, trim: true, required: true },
      firstName: { type: String, trim: true, required: true },
      middleName: { type: String, trim: true },
      officeAddress: { type: String, trim: true, required: true },
      officialEmail: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      },
    },

    // Existing SMV Profile
    existingSMV: {
      ordinanceNo: { type: String, trim: true },
      baseYear: { type: Number },
      approvalYear: { type: Number },
      implementationYear: { type: Number },
      conductingRevision2025: { type: Boolean, default: false },
    },

    // Status Tracking
    currentSMVStatus: {
      type: String,
      enum: [
        "No Revision",
        "Preparatory",
        "Data Collection",
        "Data Analysis",
        "Preparation",
        "Testing",
        "Finalization",
        "Completed",
        "Implemented",
      ],
      default: "No Revision",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LGU = mongoose.model("LGU", lguSchema);
