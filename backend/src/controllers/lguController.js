import { LGU } from "../models/LGU.js";
import { Assessor } from "../models/Assessors.js";
import { SMVMonitoring } from "../models/SMVMonitoring.js";

export async function getAllLGUs(req, res) {
  try {
    const { page = 1, limit = 10, search, all } = req.query;

    const query = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { province: { $regex: search, $options: "i" } },
            { region: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // 👇 if all=true, return all LGUs without pagination
    if (all === "true") {
      const lgus = await LGU.find(query).sort({ name: 1 });
      return res.status(200).json({ lgus, total: lgus.length });
    }

    // Otherwise, paginate
    const lgus = await LGU.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await LGU.countDocuments(query);

    res.status(200).json({
      lgus,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching LGUs", error: error.message });
  }
}

export async function getLGUById(req, res) {
  try {
    const lgu = await LGU.findById(req.params.id);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    res.status(200).json(lgu);
  } catch (error) {
    res.status(500).json({ message: "Error fetching LGU", error: error.message });
  }
}

export async function getLGUWithAssessors(req, res) {
  try {
    const lgu = await LGU.findById(req.params.id);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    const assessors = await Assessor.find({ lgu: req.params.id });
    res.status(200).json({ lgu, assessors });
  } catch (error) {
    res.status(500).json({ message: "Error fetching LGU with assessors", error: error.message });
  }
}

export async function getLGUWithSMVProcess(req, res) {
  try {
    const lgu = await LGU.findById(req.params.id);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    const smvProcess = await SMVProcess.findOne({ lguId: req.params.id })
      .sort({ referenceYear: -1 }); // Get the most recent SMV process
    
    res.status(200).json({ lgu, smvProcess });
  } catch (error) {
    res.status(500).json({ message: "Error fetching LGU with SMV process", error: error.message });
  }
}

export async function searchLGUs(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const lgus = await LGU.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { province: { $regex: q, $options: 'i' } },
        { region: { $regex: q, $options: 'i' } },
        { classification: { $regex: q, $options: 'i' } },
        { incomeClass: { $regex: q, $options: 'i' } }
      ]
    }).limit(10);
    
    res.status(200).json(lgus);
  } catch (error) {
    res.status(500).json({ message: "Error searching LGUs", error: error.message });
  }
}

export async function createLGU(req, res) {
  try {
    // Check if LGU with same name already exists
    const existingLGU = await LGU.findOne({ name: req.body.name });
    if (existingLGU) {
      return res.status(409).json({ message: "LGU with this name already exists" });
    }
    
    const lgu = new LGU(req.body);
    const savedLGU = await lgu.save();
    res.status(201).json(savedLGU);
  } catch (error) {
    res.status(400).json({ message: "Error creating LGU", error: error.message });
  }
}

export async function updateLGU(req, res) {
  try {
    const lgu = await LGU.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    res.status(200).json(lgu);
  } catch (error) {
    res.status(400).json({ message: "Error updating LGU", error: error.message });
  }
}

export async function deleteLGU(req, res) {
  try {
    const lgu = await LGU.findByIdAndDelete(req.params.id);
    
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    // Also delete associated assessors and SMV processes
    await Assessor.deleteMany({ lgu: req.params.id });
    await SMVProcess.deleteMany({ lguId: req.params.id });
    
    res.status(200).json({ message: "LGU deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting LGU", error: error.message });
  }
}

// Get distinct regions
export async function getRegions(req, res) {
  try {
    const regions = await LGU.distinct("region");
    res.status(200).json(regions.sort());
  } catch (error) {
    res.status(500).json({ message: "Error fetching regions", error: error.message });
  }
}

// Get provinces (optionally by region)
export async function getProvinces(req, res) {
  try {
    const { region } = req.query;
    const filter = region ? { region } : {};
    const provinces = await LGU.distinct("province", filter);
    res.status(200).json(provinces.sort());
  } catch (error) {
    res.status(500).json({ message: "Error fetching provinces", error: error.message });
  }
}

// Get LGUs (name + incomeClass + classification) by province
export async function getLGUsByProvince(req, res) {
  try {
    const { province } = req.query;
    if (!province) {
      return res.status(400).json({ message: "province query param required" });
    }
    const lgus = await LGU.find({ province })
      .select("name incomeClass classification")
      .sort({ name: 1 });
    res.status(200).json(lgus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching LGUs by province", error: error.message });
  }
}
