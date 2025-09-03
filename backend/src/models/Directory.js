// models/blgfModel.js
import mongoose from "mongoose";

const blgfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sex: { type: String, enum: ["Male", "Female", "Other"], required: true },
    civilStatus: {
      type: String,
      enum: ["Single", "Married", "Widowed", "Separated", "Other"],
      required: true,
    },
    lguType: {
      type: String,
      enum: ["City", "Municipality", "Province"],
      required: true,
    },
    lguName: { type: String, required: true, trim: true },
    incomeClass: { type: String, required: true, trim: true },
    plantillaPosition: { type: String, required: true, trim: true },
    statusOfAppointment: {
      type: String,
      enum: ["Permanent", "Temporary", "Casual", "Job Order", "Contractual"],
      required: true,
    },
    salaryGrade: { type: String, trim: true },
    stepIncrement: { type: Number, default: 0 },

    // Dates
    birthday: { type: Date, required: true },
    dateOfMandatoryRetirement: { type: Date },
    dateOfCompulsoryRetirement: { type: Date },

    // Educational Attainment
    bachelorDegree: { type: String, trim: true },
    masteralDegree: { type: String, trim: true },
    doctoralDegree: { type: String, trim: true },

    eligibility: { type: String, trim: true },

    // Email addresses - UPDATED
    officeEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid personal email format"]
    },
    
    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid personal email format"]
    },

    contactNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Invalid contact number"],
    },

    // Appointment & Licensing
    dateOfAppointment: { type: Date, required: true },
    prcLicenseNumber: { type: String, trim: true },
  },
  { timestamps: true } // createdAt, updatedAt
);

export const Directory = mongoose.model("BLGF", blgfSchema);