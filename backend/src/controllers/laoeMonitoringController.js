import { LAOEMonitoring } from "../models/LAOEMonitoring.js";
import { LGU } from "../models/LGU.js";
import { SMVMonitoring } from "../models/SMVMonitoring.js";

export async function getAllLAOEMonitorings(req, res) {
  try {
    const { lguId, quarter, page = 1, limit = 10 } = req.query;
    let filter = {};
    
    if (lguId) filter.lguId = lguId;
    if (quarter) filter.quarter = quarter;
    
    const monitorings = await LAOEMonitoring.find(filter)
      .populate('lguId', 'name province region')
      .populate('smvMonitoringId', 'referenceYear valuationDate')
      .sort({ dateReleased: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await LAOEMonitoring.countDocuments(filter);
    
    res.status(200).json({
      monitorings,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching LAOE monitorings", 
      error: error.message 
    });
  }
}

export async function getLAOEMonitoringById(req, res) {
  try {
    const monitoring = await LAOEMonitoring.findById(req.params.id)
      .populate('lguId')
      .populate('smvMonitoringId');
      
    if (!monitoring) {
      return res.status(404).json({ message: "LAOE monitoring not found" });
    }
    
    res.status(200).json(monitoring);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching LAOE monitoring", 
      error: error.message 
    });
  }
}

export async function getLAOEMonitoringByLGU(req, res) {
  try {
    const monitorings = await LAOEMonitoring.find({ lguId: req.params.lguId })
      .populate('lguId', 'name province region')
      .populate('smvMonitoringId', 'referenceYear valuationDate')
      .sort({ dateReleased: -1 });
    
    res.status(200).json(monitorings);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching LAOE monitorings by LGU", 
      error: error.message 
    });
  }
}

export async function getLAOEMonitoringByQuarter(req, res) {
  try {
    const monitorings = await LAOEMonitoring.find({ quarter: req.params.quarter })
      .populate('lguId', 'name province region')
      .populate('smvMonitoringId', 'referenceYear valuationDate')
      .sort({ dateReleased: -1 });
    
    res.status(200).json(monitorings);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching LAOE monitorings by quarter", 
      error: error.message 
    });
  }
}

export async function createLAOEMonitoring(req, res) {
  try {
    // Verify LGU exists
    const lgu = await LGU.findById(req.body.lguId);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    // Verify SMV Process exists
    const SMVMonitoring = await SMVMonitoring.findById(req.body.smvMonitoringId);
    if (!smvMonitoring) {
      return res.status(404).json({ message: "SMV Process not found" });
    }
    
    // Check if monitoring already exists for this LGU and quarter
    const existingMonitoring = await LAOEMonitoring.findOne({
      lguId: req.body.lguId,
      quarter: req.body.quarter
    });
    
    if (existingMonitoring) {
      return res.status(409).json({ 
        message: "LAOE monitoring already exists for this LGU and quarter" 
      });
    }
    
    const monitoring = new LAOEMonitoring(req.body);
    const savedMonitoring = await monitoring.save();
    
    // Populate the saved document before returning
    await savedMonitoring.populate('lguId', 'name province region');
    await savedMonitoring.populate('smvMonitoringId', 'referenceYear valuationDate');
    
    res.status(201).json(savedMonitoring);
  } catch (error) {
    res.status(400).json({ 
      message: "Error creating LAOE monitoring", 
      error: error.message 
    });
  }
}

export async function updateLAOEMonitoring(req, res) {
  try {
    const monitoring = await LAOEMonitoring.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('lguId', 'name province region')
    .populate('smvMonitoringId', 'referenceYear valuationDate');
    
    if (!monitoring) {
      return res.status(404).json({ message: "LAOE monitoring not found" });
    }
    
    res.status(200).json(monitoring);
  } catch (error) {
    res.status(400).json({ 
      message: "Error updating LAOE monitoring", 
      error: error.message 
    });
  }
}

export async function deleteLAOEMonitoring(req, res) {
  try {
    const monitoring = await LAOEMonitoring.findByIdAndDelete(req.params.id);
    
    if (!monitoring) {
      return res.status(404).json({ message: "LAOE monitoring not found" });
    }
    
    res.status(200).json({ message: "LAOE monitoring deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      message: "Error deleting LAOE monitoring", 
      error: error.message 
    });
  }
}