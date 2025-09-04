const mongoose = require('mongoose');

const assessorSchema = new mongoose.Schema({
  // Personal Information
  lastName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  firstName: { 
    type: String, 
    required: true, 
    trim: true 
  },
  middleName: { 
    type: String, 
    trim: true 
  },
  sex: { 
    type: String, 
    enum: ["Male", "Female", "Other"], 
    required: true 
  },
  civilStatus: {
    type: String,
    enum: ["Single", "Married", "Widowed", "Separated", "Other"],
    required: true,
  },
  birthday: { 
    type: Date, 
    required: true 
  },

  // Professional Information
  lgu: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LGU',
    required: true
  },
  plantillaPosition: { 
    type: String, 
    required: true, 
    trim: true 
  },
  officialDesignation: { 
    type: String, 
    trim: true,
    required: true 
  },
  statusOfAppointment: {
    type: String,
    enum: ["Permanent", "Temporary", "Casual", "Job Order", "Contractual", "Acting", "OIC"],
    required: true,
  },
  dateOfAppointment: { 
    type: Date, 
    required: true 
  },
  salaryGrade: { 
    type: String, 
    trim: true 
  },
  stepIncrement: { 
    type: Number, 
    default: 1 
  },

  // Educational Background
  bachelorDegree: { 
    type: String, 
    trim: true 
  },
  masteralDegree: { 
    type: String, 
    trim: true 
  },
  doctoralDegree: { 
    type: String, 
    trim: true 
  },

  // Certifications
  eligibility: { 
    type: String, 
    trim: true 
  },
  prcLicenseNumber: { 
    type: String, 
    trim: true 
  },
  prcLicenseExpiration: { 
    type: Date 
  },

  // Contact Information
  officeEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  personalEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email format"]
  },
  contactNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, "Invalid contact number"],
  },
  mobileNumber: {
    type: String,
    trim: true,
    match: [/^[0-9]{10,15}$/, "Invalid mobile number"],
  },

  // Retirement Information
  dateOfMandatoryRetirement: { 
    type: Date 
  },
  dateOfCompulsoryRetirement: { 
    type: Date 
  },

  isActive: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Assessor', assessorSchema);