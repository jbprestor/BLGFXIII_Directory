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

    // 🔹 RA 12001 / RPVARA Timeline Compliance
    timeline: {
      blgfNoticeDate: { type: Date }, // 🔹 DAY 0: When BLGF Notice was received (e.g., April 14, 2025)
      projectStartDate: { type: Date }, // When SMV creation officially began (work plan completion)
      targetCompletionDate: { type: Date }, // When SMV must be ready (usually Dec 31)
      
      // 🔹 UPDATED: 4 separate fields for publication and consultation
      firstPublicationDate: { type: Date }, // 1st Publication (Week 1)
      secondPublicationDate: { type: Date }, // 2nd Publication (Week 2, can be same day as 1st)
      firstPublicConsultationDate: { type: Date }, // 1st Consultation - 2 weeks after 1st publication
      secondPublicConsultationDate: { type: Date }, // 2nd Consultation - same day or after 1st, within 60 days
      
      // 🔹 DEPRECATED (kept for backward compatibility)
      publicationDeadline: { type: Date }, // Old single publication field
      publicConsultationDeadline: { type: Date }, // Old single consultation field
      
      regionalOfficeSubmissionDeadline: { type: Date }, // 60 days after public consultation (min)
      roReviewDeadline: { type: Date }, // Auto-calculated: RO Submission + 45 days (RPVARA IRR Section 29)
      blgfCentralOfficeReviewDeadline: { type: Date }, // Auto-calculated: RO Review + 30 days (RPVARA IRR)
      secretaryOfFinanceReviewDeadline: { type: Date }, // Auto-calculated: BLGF CO Review + 30 days (RPVARA IRR)
    },

    // 🔹 Compliance Status (auto-calculated)
    complianceStatus: {
      type: String,
      enum: ["On Track", "At Risk", "Delayed", "Overdue"],
      default: "On Track",
    },

    // 🔹 Days tracking
    daysElapsed: { type: Number, default: 0 }, // Days since project start
    daysRemaining: { type: Number }, // Days until target completion
    
    // 🔹 Alert flags
    alerts: [{
      type: { type: String, enum: ["warning", "danger", "info"] },
      message: String,
      createdAt: { type: Date, default: Date.now },
    }],

    // 🔹 Stage-based activity mapping (for detailed 19 activities)
    stageMap: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    
    // 🔹 Proposed Publication Activities (Tab 3)
    proposedPublicationActivities: [{
      name: String,
      status: {
        type: String,
        enum: ["Not Started", "Not Completed", "Completed"],
        default: "Not Completed"
      },
      dateCompleted: String,
      remarks: String,
      isHeader: Boolean,
      isNote: Boolean
    }],
    
    // 🔹 Review & Publication Activities (Tab 4)
    reviewPublicationActivities: [{
      name: String,
      status: {
        type: String,
        enum: ["Not Started", "Not Completed", "Completed"],
        default: "Not Completed"
      },
      dateCompleted: String,
      remarks: String
    }],

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

// --- RA 12001 Compliance Calculation ---
smvMonitoringSchema.methods.calculateCompliance = function () {
  const now = new Date();
  
  // Calculate days elapsed since project start
  if (this.timeline?.projectStartDate) {
    const elapsed = Math.floor((now - this.timeline.projectStartDate) / (1000 * 60 * 60 * 24));
    this.daysElapsed = Math.max(0, elapsed);
  }
  
  // Calculate days remaining until target completion
  if (this.timeline?.targetCompletionDate) {
    const remaining = Math.floor((this.timeline.targetCompletionDate - now) / (1000 * 60 * 60 * 24));
    this.daysRemaining = remaining;
  }
  
  // Determine compliance status
  this.alerts = []; // Clear old alerts
  
  if (this.timeline?.targetCompletionDate && this.daysRemaining !== undefined) {
    const progress = this.progressPercent || 0;
    const expectedProgress = this.calculateExpectedProgress();
    
    // Overdue - past target date and not complete
    if (this.daysRemaining < 0 && progress < 100) {
      this.complianceStatus = "Overdue";
      this.alerts.push({
        type: "danger",
        message: `${Math.abs(this.daysRemaining)} days overdue! Immediate action required.`,
      });
    }
    // At Risk - less than 30 days and behind schedule
    else if (this.daysRemaining > 0 && this.daysRemaining <= 30 && progress < expectedProgress) {
      this.complianceStatus = "At Risk";
      this.alerts.push({
        type: "warning",
        message: `Only ${this.daysRemaining} days remaining. Behind schedule by ${Math.round(expectedProgress - progress)}%.`,
      });
    }
    // Delayed - behind expected progress
    else if (progress < expectedProgress - 10) {
      this.complianceStatus = "Delayed";
      this.alerts.push({
        type: "warning",
        message: `Progress is ${Math.round(expectedProgress - progress)}% behind schedule.`,
      });
    }
    // On Track
    else {
      this.complianceStatus = "On Track";
    }
  }
  
  // Check specific milestone deadlines
  this.checkMilestoneDeadlines(now);
};

// --- Calculate expected progress based on timeline ---
smvMonitoringSchema.methods.calculateExpectedProgress = function () {
  if (!this.timeline?.projectStartDate || !this.timeline?.targetCompletionDate) {
    return 0;
  }
  
  const now = new Date();
  const start = this.timeline.projectStartDate;
  const end = this.timeline.targetCompletionDate;
  
  const totalDuration = end - start;
  const elapsed = now - start;
  
  if (elapsed <= 0) return 0;
  if (elapsed >= totalDuration) return 100;
  
  return Math.round((elapsed / totalDuration) * 100);
};

// --- Check milestone-specific deadlines ---
smvMonitoringSchema.methods.checkMilestoneDeadlines = function (now) {
  const milestones = [
    { key: 'sanggunianSubmissionDeadline', name: 'Sanggunian Submission', warningDays: 30 },
    { key: 'blgfApprovalDeadline', name: 'BLGF Approval', warningDays: 14 },
    { key: 'publicationDeadline', name: 'Publication', warningDays: 14 },
  ];
  
  milestones.forEach(milestone => {
    const deadline = this.timeline?.[milestone.key];
    if (deadline) {
      const daysUntil = Math.floor((deadline - now) / (1000 * 60 * 60 * 24));
      
      if (daysUntil < 0) {
        this.alerts.push({
          type: "danger",
          message: `${milestone.name} deadline passed ${Math.abs(daysUntil)} days ago!`,
        });
      } else if (daysUntil <= milestone.warningDays) {
        this.alerts.push({
          type: "warning",
          message: `${milestone.name} deadline in ${daysUntil} days.`,
        });
      }
    }
  });
};

// --- Auto-update before save ---
smvMonitoringSchema.pre("save", function (next) {
  this.recalculateProgress();
  this.calculateCompliance();
  next();
});

export const SMVMonitoring = mongoose.model("SMVMonitoring", smvMonitoringSchema);
