import { SMVMonitoring } from "../models/SMVMonitoring.js";
import { LGU } from "../models/LGU.js";

const RPVARStages = [
  "Preparatory",
  "Data Collection",
  "Data Analysis",
  "Preparation of Proposed SMV",
  "Valuation Testing",
  "Finalization",
  "Completed",
];

// --- GET ALL MONITORING ---
export async function getAllSMVMonitoring(req, res) {
  try {
    const { page = 1, limit = 10, lguId, year, status } = req.query;
    let query = {};

    if (lguId) query.lguId = lguId;
    if (year) query.referenceYear = year;
    if (status) query.overallStatus = status;

    const monitoringList = await SMVMonitoring.find(query)
      .populate("lguId", "name province region classification incomeClass")
      .sort({ referenceYear: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SMVMonitoring.countDocuments(query);

    res.status(200).json({
      monitoringList,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring records", error: error.message });
  }
}

// --- GET BY ID ---
export async function getSMVMonitoringById(req, res) {
  try {
    const monitoring = await SMVMonitoring.findById(req.params.id)
      .populate("lguId", "name province region classification incomeClass");

    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    res.status(200).json(monitoring);
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring record", error: error.message });
  }
}

// --- GET BY LGU ---
export async function getSMVMonitoringByLGU(req, res) {
  try {
    const monitoringList = await SMVMonitoring.find({ lguId: req.params.lguId })
      .populate("lguId", "name province region classification incomeClass")
      .sort({ referenceYear: -1 });

    res.status(200).json(monitoringList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring records by LGU", error: error.message });
  }
}

// --- GET PROGRESS ---
export async function getSMVMonitoringProgress(req, res) {
  try {
    const monitoring = await SMVMonitoring.findById(req.params.id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    monitoring.recalculateProgress();

    res.status(200).json({
      progress: monitoring.progressPercent,
      status: monitoring.overallStatus,
      completed: monitoring.activities.filter((a) => a.status === "Completed").length,
      total: monitoring.activities.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error calculating SMV monitoring progress",
      error: error.message,
    });
  }
}

// --- CREATE ---
export async function createSMVMonitoring(req, res) {
  try {
    const { lguId, referenceYear, valuationDate } = req.body;

    const lgu = await LGU.findById(lguId);
    if (!lgu) return res.status(404).json({ message: "LGU not found" });

    const existing = await SMVMonitoring.findOne({ lguId, referenceYear });
    if (existing) return res.status(409).json({ message: "SMV monitoring already exists for this LGU and year" });

    const valDate = new Date(valuationDate);
    if (valDate.getFullYear() !== Number(referenceYear)) {
      return res.status(400).json({ message: "Valuation date must be within the reference year" });
    }

    const defaultActivities = [
      "Preparatory",
      "Data Collection",
      "Data Analysis",
      "Preparation of Proposed SMV",
      "Valuation Testing",
      "Finalization",
    ].map((stage) => ({
      name: `${stage} Activity`,
      category: stage,
      status: "Not Started",
    }));

    const monitoring = new SMVMonitoring({
      lguId,
      referenceYear,
      valuationDate,
      activities: defaultActivities,
    });

    monitoring.recalculateProgress();
    const saved = await monitoring.save();
    await saved.populate("lguId", "name province region classification incomeClass");

    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: "Error creating SMV monitoring record", error: error.message });
  }
}

// --- UPDATE ---
export async function updateSMVMonitoring(req, res) {
  try {
    if (req.body.lguId) {
      const lgu = await LGU.findById(req.body.lguId);
      if (!lgu) return res.status(404).json({ message: "LGU not found" });
    }

    const monitoring = await SMVMonitoring.findById(req.params.id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    Object.assign(monitoring, req.body);
    monitoring.recalculateProgress();

    const updated = await monitoring.save();
    await updated.populate("lguId", "name province region classification incomeClass");

    res.status(200).json(updated);
  } catch (error) {
    console.error("❌ Error updating SMV monitoring:", error);
    console.error("Request body:", JSON.stringify(req.body, null, 2));
    
    // Send detailed error for debugging
    res.status(400).json({ 
      message: "Error updating SMV monitoring record", 
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : undefined
    });
  }
}

// --- UPDATE ACTIVITY ---
export async function updateSMVMonitoringActivity(req, res) {
  try {
    const { id, activityId } = req.params;
    const monitoring = await SMVMonitoring.findById(id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    const activity = monitoring.activities.id(activityId);
    if (!activity) return res.status(404).json({ message: "Activity not found" });

    Object.assign(activity, req.body);

    // use model helper
    monitoring.recalculateProgress();

    const updated = await monitoring.save();
    await updated.populate("lguId", "name province region classification incomeClass");

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating SMV monitoring activity", error: error.message });
  }
}

// --- UPDATE TIMELINE ---
export async function updateSMVMonitoringTimeline(req, res) {
  try {
    const { id } = req.params;
    const { timeline } = req.body;

    const monitoring = await SMVMonitoring.findById(id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    // Update timeline fields
    if (timeline) {
      monitoring.timeline = {
        ...monitoring.timeline,
        ...timeline
      };
    }

    // Recalculate compliance after timeline update
    monitoring.recalculateProgress();
    
    const updated = await monitoring.save();
    await updated.populate("lguId", "name province region classification incomeClass");

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating SMV monitoring timeline", error: error.message });
  }
}

// --- DELETE ---
export async function deleteSMVMonitoring(req, res) {
  try {
    const monitoring = await SMVMonitoring.findByIdAndDelete(req.params.id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });
    res.status(200).json({ message: "SMV monitoring record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting SMV monitoring record", error: error.message });
  }
}
