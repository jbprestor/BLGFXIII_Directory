import mongoose from "mongoose";

// --- Sub-schema for activities ---
const activitySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: String,
    enum: [
      "Preparatory",
      "Data Collection",
      "Data Analysis",
      "Preparation of Proposed SMV",
      "Public Consultation",
      "Review by RO",
      "Submission to BLGF CO",
      "DOF Review",
      "Valuation Testing",
      "Finalization",
    ],
    required: true,
  },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Completed"],
    default: "Not Started",
  },
  dateCompleted: Date,
  remarks: String,
  dueDate: Date, // 🔹 RPVARA timeline tracking
});

// --- Main SMV Monitoring Schema ---
const smvMonitoringSchema = new mongoose.Schema(
  {
    lguId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LGU",
      required: true,
    },
    referenceYear: { type: Number, required: true },
    valuationDate: { type: Date, required: true },
    activities: [activitySchema],

    // 🔹 Stage-based status
    overallStatus: {
      type: String,
      enum: [
        "Preparatory",
        "Data Collection",
        "Data Analysis",
        "Preparation of Proposed SMV",
        "Public Consultation",
        "Review by RO",
        "Submission to BLGF CO",
        "DOF Review",
        "Valuation Testing",
        "Finalization",
        "Completed",
      ],
      default: "Preparatory",
    },

    // 🔹 Numeric % progress
    progressPercent: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// --- Index ---
smvMonitoringSchema.index({ lguId: 1, referenceYear: 1 });

// --- Helper to recalc % and stage ---
smvMonitoringSchema.methods.recalculateProgress = function () {
  if (!this.activities || this.activities.length === 0) {
    this.progressPercent = 0;
    this.overallStatus = "Preparatory";
    return;
  }

  const total = this.activities.length;
  const done = this.activities.filter((a) => a.status === "Completed").length;

  this.progressPercent = Math.round((done / total) * 100);

  const orderedStages = [
    "Preparatory",
    "Data Collection",
    "Data Analysis",
    "Preparation of Proposed SMV",
    "Public Consultation",
    "Review by RO",
    "Submission to BLGF CO",
    "DOF Review",
    "Valuation Testing",
    "Finalization",
  ];

  let highestStage = "Preparatory";
  for (const stage of orderedStages) {
    if (this.activities.some((a) => a.category === stage && a.status === "Completed")) {
      highestStage = stage;
    } else {
      break; // stop at first stage not fully completed
    }
  }

  this.overallStatus = done === total ? "Completed" : highestStage;
};

// --- Auto-update before save ---
smvMonitoringSchema.pre("save", function (next) {
  this.recalculateProgress();
  next();
});

export const SMVMonitoring = mongoose.model("SMVMonitoring", smvMonitoringSchema);
