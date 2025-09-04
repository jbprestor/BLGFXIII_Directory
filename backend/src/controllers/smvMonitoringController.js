// controllers/smvMonitoringController.js
import { SMVMonitoring } from "../models/SMVMonitoring.js";
import { LGU } from "../models/LGU.js";

export async function getAllSMVMonitoring(req, res) {
  try {
    const { page = 1, limit = 10, lguId, year } = req.query;
    let query = {};
    
    if (lguId) query.lguId = lguId;
    if (year) query.referenceYear = year;
    
    const monitoringList = await SMVMonitoring.find(query)
      .populate("lguId", "name province region")
      .sort({ referenceYear: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await SMVMonitoring.countDocuments(query);
    
    res.status(200).json({
      monitoringList,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring records", error: error.message });
  }
}

export async function getSMVMonitoringById(req, res) {
  try {
    const monitoring = await SMVMonitoring.findById(req.params.id).populate("lguId");
    
    if (!monitoring) {
      return res.status(404).json({ message: "SMV monitoring record not found" });
    }
    
    res.status(200).json(monitoring);
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring record", error: error.message });
  }
}

export async function getSMVMonitoringByLGU(req, res) {
  try {
    const monitoringList = await SMVMonitoring.find({ lguId: req.params.lguId })
      .populate("lguId", "name province region")
      .sort({ referenceYear: -1 });
    
    res.status(200).json(monitoringList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching SMV monitoring records by LGU", error: error.message });
  }
}

export async function getSMVMonitoringProgress(req, res) {
  try {
    const monitoring = await SMVMonitoring.findById(req.params.id);
    
    if (!monitoring) {
      return res.status(404).json({ message: "SMV monitoring record not found" });
    }
    
    const totalActivities = monitoring.activities.length;
    const completedActivities = monitoring.activities.filter(a => a.status === "Completed").length;
    const progress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
    
    res.status(200).json({
      progress: Math.round(progress),
      completed: completedActivities,
      total: totalActivities,
      status: monitoring.overallStatus
    });
  } catch (error) {
    res.status(500).json({ message: "Error calculating SMV monitoring progress", error: error.message });
  }
}

export async function createSMVMonitoring(req, res) {
  try {
    const lgu = await LGU.findById(req.body.lguId);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    const existingMonitoring = await SMVMonitoring.findOne({ 
      lguId: req.body.lguId, 
      referenceYear: req.body.referenceYear 
    });
    
    if (existingMonitoring) {
      return res.status(409).json({ 
        message: "SMV monitoring record already exists for this LGU and year" 
      });
    }
    
    const monitoring = new SMVMonitoring(req.body);
    const savedMonitoring = await monitoring.save();
    
    await savedMonitoring.populate("lguId", "name province region");
    
    res.status(201).json(savedMonitoring);
  } catch (error) {
    res.status(400).json({ message: "Error creating SMV monitoring record", error: error.message });
  }
}

export async function updateSMVMonitoring(req, res) {
  try {
    if (req.body.lguId) {
      const lgu = await LGU.findById(req.body.lguId);
      if (!lgu) {
        return res.status(404).json({ message: "LGU not found" });
      }
    }
    
    const monitoring = await SMVMonitoring.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate("lguId", "name province region");
    
    if (!monitoring) {
      return res.status(404).json({ message: "SMV monitoring record not found" });
    }
    
    res.status(200).json(monitoring);
  } catch (error) {
    res.status(400).json({ message: "Error updating SMV monitoring record", error: error.message });
  }
}

export async function updateSMVMonitoringActivity(req, res) {
  try {
    const { id, activityIndex } = req.params;
    
    const monitoring = await SMVMonitoring.findById(id);
    if (!monitoring) {
      return res.status(404).json({ message: "SMV monitoring record not found" });
    }
    
    if (activityIndex < 0 || activityIndex >= monitoring.activities.length) {
      return res.status(400).json({ message: "Invalid activity index" });
    }
    
    monitoring.activities[activityIndex] = {
      ...monitoring.activities[activityIndex].toObject(),
      ...req.body
    };
    
    const allCompleted = monitoring.activities.every(a => a.status === "Completed");
    if (allCompleted && monitoring.overallStatus !== "Completed") {
      monitoring.overallStatus = "Completed";
    }
    
    const updatedMonitoring = await monitoring.save();
    await updatedMonitoring.populate("lguId", "name province region");
    
    res.status(200).json(updatedMonitoring);
  } catch (error) {
    res.status(400).json({ message: "Error updating SMV monitoring activity", error: error.message });
  }
}

export async function deleteSMVMonitoring(req, res) {
  try {
    const monitoring = await SMVMonitoring.findByIdAndDelete(req.params.id);
    
    if (!monitoring) {
      return res.status(404).json({ message: "SMV monitoring record not found" });
    }
    
    res.status(200).json({ message: "SMV monitoring record deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting SMV monitoring record", error: error.message });
  }
}
