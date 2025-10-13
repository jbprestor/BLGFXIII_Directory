import { QRRPAMonitoring } from "../models/QRRPAMonitoring.js";
import { LGU } from "../models/LGU.js";

export async function getAllQRRPAMonitorings(req, res) {
  try {
    const { lguId, period, page = 1, limit = 10, status, region } = req.query;
    let filter = {};

    if (lguId) filter.lguId = lguId;
    if (period) filter.period = period;
    if (status) filter.status = status;

    // If region is specified, we need to find LGUs in that region
    if (region) {
      const lgusInRegion = await LGU.find({ region }).select('_id');
      if (lgusInRegion.length > 0) {
        filter.lguId = { $in: lgusInRegion.map(lgu => lgu._id) };
      } else {
        // No LGUs found in the specified region, return empty result
        return res.status(200).json({
          success: true,
          data: {
            monitorings: [],
            pagination: {
              totalPages: 0,
              currentPage: parseInt(page),
              total: 0,
              limit: parseInt(limit)
            }
          }
        });
      }
    }
    
    const monitorings = await QRRPAMonitoring.find(filter)
      .populate('lguId', 'name province region classification incomeClass')
      .sort({ period: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await QRRPAMonitoring.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: {
        monitorings,
        pagination: {
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error("Error fetching QRRPA monitorings:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching QRRPA monitorings", 
      error: error.message 
    });
  }
}

export async function getQRRPAMonitoringById(req, res) {
  try {
    const monitoring = await QRRPAMonitoring.findById(req.params.id)
      .populate('lguId');
      
    if (!monitoring) {
      return res.status(404).json({ 
        success: false,
        message: "QRRPA monitoring record not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: monitoring
    });
  } catch (error) {
    console.error("Error fetching QRRPA monitoring:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching QRRPA monitoring", 
      error: error.message 
    });
  }
}

export async function getQRRPAMonitoringByLGU(req, res) {
  try {
    const monitorings = await QRRPAMonitoring.find({ lguId: req.params.lguId })
      .populate('lguId', 'name province region')
      .sort({ period: -1 });
    
    res.status(200).json({
      success: true,
      data: monitorings
    });
  } catch (error) {
    console.error("Error fetching QRRPA monitorings by LGU:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching QRRPA monitorings by LGU", 
      error: error.message 
    });
  }
}

export async function getQRRPAMonitoringByPeriod(req, res) {
  try {
    const monitorings = await QRRPAMonitoring.find({ period: req.params.period })
      .populate('lguId', 'name province region')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: monitorings
    });
  } catch (error) {
    console.error("Error fetching QRRPA monitorings by period:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching QRRPA monitorings by period", 
      error: error.message 
    });
  }
}

export async function createQRRPAMonitoring(req, res) {
  try {
    // Verify LGU exists
    const lgu = await LGU.findById(req.body.lguId);
    if (!lgu) {
      return res.status(404).json({ 
        success: false,
        message: "LGU not found" 
      });
    }
    
    // Check if QRRPA record already exists for this LGU and period
    const existingMonitoring = await QRRPAMonitoring.findOne({
      lguId: req.body.lguId,
      period: req.body.period
    });
    
    if (existingMonitoring) {
      return res.status(409).json({ 
        success: false,
        message: "QRRPA monitoring record already exists for this LGU and period" 
      });
    }
    
    // If status is 'Submitted', set dateSubmitted to current date
    if (req.body.status === 'Submitted' && !req.body.dateSubmitted) {
      req.body.dateSubmitted = new Date();
    }
    
    // If status is 'Not Submitted', ensure dateSubmitted is null
    if (req.body.status === 'Not Submitted') {
      req.body.dateSubmitted = null;
    }
    
    // If file was uploaded via multer, set attachmentUrl to the served path
    if (req.file) {
      // Basic validation: allow common spreadsheet mimetypes
      const allowed = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls, .csv sometimes
        'text/csv'
      ];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ success: false, message: 'Uploaded file must be an Excel or CSV file.' });
      }

      // Build accessible URL path (served from /uploads/qrrpa)
      const filename = req.file.filename;
      req.body.attachmentUrl = `/uploads/qrrpa/${filename}`;
    }

    const monitoring = new QRRPAMonitoring(req.body);
    const savedMonitoring = await monitoring.save();
    
    // Populate the LGU data before returning
    await savedMonitoring.populate('lguId', 'name province region classification incomeClass');
    
    res.status(201).json({
      success: true,
      message: "QRRPA monitoring record created successfully",
      data: savedMonitoring
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        message: "A QRRPA record already exists for this LGU and period" 
      });
    }
    
    console.error("Error creating QRRPA monitoring:", error);
    res.status(400).json({ 
      success: false,
      message: "Error creating QRRPA monitoring", 
      error: error.message 
    });
  }
}

export async function updateQRRPAMonitoring(req, res) {
  try {
    const updates = { ...req.body };
    
    // Handle dateSubmitted based on status
    if (updates.status === 'Submitted' && !updates.dateSubmitted) {
      updates.dateSubmitted = new Date();
    } else if (updates.status === 'Not Submitted') {
      updates.dateSubmitted = null;
    }
    
    const monitoring = await QRRPAMonitoring.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('lguId', 'name province region classification incomeClass');
    
    if (!monitoring) {
      return res.status(404).json({ 
        success: false,
        message: "QRRPA monitoring record not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QRRPA monitoring record updated successfully",
      data: monitoring
    });
  } catch (error) {
    console.error("Error updating QRRPA monitoring:", error);
    res.status(400).json({ 
      success: false,
      message: "Error updating QRRPA monitoring", 
      error: error.message 
    });
  }
}

export async function deleteQRRPAMonitoring(req, res) {
  try {
    const monitoring = await QRRPAMonitoring.findByIdAndDelete(req.params.id);
    
    if (!monitoring) {
      return res.status(404).json({ 
        success: false,
        message: "QRRPA monitoring record not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "QRRPA monitoring record deleted successfully",
      data: monitoring
    });
  } catch (error) {
    console.error("Error deleting QRRPA monitoring:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting QRRPA monitoring", 
      error: error.message 
    });
  }
}

export async function getQRRPAStats(req, res) {
  try {
    const { period, region } = req.query;
    let matchStage = {};
    
    if (period) matchStage.period = period;
    
    // If region is specified, we need to populate LGU first to filter by region
    if (region) {
      const lgusInRegion = await LGU.find({ region }).select('_id');
      matchStage.lguId = { $in: lgusInRegion.map(lgu => lgu._id) };
    }
    
    const stats = await QRRPAMonitoring.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Convert array to object for easier consumption
    const statsObj = {
      Submitted: 0,
      'Not Submitted': 0,
      'Late Submission': 0
    };
    
    stats.forEach(stat => {
      statsObj[stat._id] = stat.count;
    });
    
    res.status(200).json({
      success: true,
      data: statsObj
    });
  } catch (error) {
    console.error("Error fetching QRRPA statistics:", error);
    res.status(500).json({ 
      success: false,
      message: "Error fetching QRRPA statistics", 
      error: error.message 
    });
  }
}
