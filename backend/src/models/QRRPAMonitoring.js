import mongoose from "mongoose";

const qrrpaMonitoringSchema = new mongoose.Schema(
  {
    lguId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LGU",
      required: true,
    },
    period: {
      type: String,
      required: true,
      match: [/^\d{4}-Q[1-4]$/, "Period must be in format YYYY-QQ (e.g., 2025-Q1)"],
    },
    status: {
      type: String,
      enum: ["Submitted", "Not Submitted", "Late Submission"],
      required: true,
    },
    dateSubmitted: Date,
    description: String,
    attachmentUrl: String,
  },
  {
    timestamps: true,
  }
);

// Ensure only one report per LGU per period
qrrpaMonitoringSchema.index({ lguId: 1, period: 1 }, { unique: true });

export const QRRPAMonitoring = mongoose.model(
  "QRRPAMonitoring",
  qrrpaMonitoringSchema
);
