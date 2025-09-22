import mongoose from "mongoose";

const assessorSchema = new mongoose.Schema(
  {
    // Personal Information
    lastName: { type: String, trim: true },
    firstName: { type: String, trim: true },
    middleName: { type: String, trim: true },
    sex: { type: String, enum: ["Male", "Female", "Other"] },
    civilStatus: { type: String, enum: ["Single", "Married", "Widowed", "Separated", "Other"] },
    birthday: { type: Date },

    // Reference to LGU
    lgu: { type: mongoose.Schema.Types.ObjectId, ref: "LGU" },

    // Professional Information
    plantillaPosition: { type: String, trim: true },
    officialDesignation: { type: String, trim: true },
    statusOfAppointment: { type: String, enum: ["Permanent","Temporary","Casual","Job Order","Contractual","Acting","OIC"] },
    dateOfAppointment: { type: Date },
    salaryGrade: { type: String, trim: true },
    stepIncrement: { type: Number, default: 1 },
    incomeClass: { type: String, trim: true },

    // Educational Background
    bachelorDegree: { type: String, trim: true },
    masteralDegree: { type: String, trim: true },
    doctoralDegree: { type: String, trim: true },

    // Certifications
    eligibility: { type: String, trim: true },
    prcLicenseNumber: { type: String, trim: true },
    prcLicenseExpiration: { type: Date },

    // Contact Information
    officeEmail: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email format"] },
    personalEmail: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, "Invalid email format"] },
    contactNumber: { type: String, trim: true, match: [/^[0-9]{10,15}$/, "Invalid contact number"] },
    mobileNumber: { type: String, trim: true, match: [/^[0-9]{10,15}$/, "Invalid mobile number"] },

    // Retirement Information
    dateOfMandatoryRetirement: { type: Date },
    dateOfCompulsoryRetirement: { type: Date },

    // System Information
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt and updatedAt
  }
);

export const Assessor = mongoose.model("Assessor", assessorSchema);
