import { Assessor } from "../models/Assessors.js";
import { LGU } from "../models/LGU.js";

export async function getAllAssessors(req, res) {
  try {
    const { page = 1, limit = 10, search, lgu } = req.query;
    let query = {};
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { plantillaPosition: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (lgu) {
      query.lgu = lgu;
    }
    
    const assessors = await Assessor.find(query)
      .populate('lgu', 'name province region')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Assessor.countDocuments(query);
    
    res.status(200).json({
      assessors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching assessors", error: error.message });
  }
}

export async function getAssessorById(req, res) {
  try {
    const assessor = await Assessor.findById(req.params.id).populate('lgu');
    
    if (!assessor) {
      return res.status(404).json({ message: "Assessor not found" });
    }
    
    res.status(200).json(assessor);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assessor", error: error.message });
  }
}

export async function getAssessorsByLGU(req, res) {
  try {
    const assessors = await Assessor.find({ lgu: req.params.lguId })
      .populate('lgu', 'name province region')
      .sort({ lastName: 1, firstName: 1 });
    
    res.status(200).json(assessors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assessors by LGU", error: error.message });
  }
}

export async function searchAssessors(req, res) {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const assessors = await Assessor.find({
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { plantillaPosition: { $regex: q, $options: 'i' } },
        { officialDesignation: { $regex: q, $options: 'i' } }
      ]
    })
    .populate('lgu', 'name province region')
    .limit(10);
    
    res.status(200).json(assessors);
  } catch (error) {
    res.status(500).json({ message: "Error searching assessors", error: error.message });
  }
}

export async function createAssessor(req, res) {
  try {
    // Verify LGU exists
    const lgu = await LGU.findById(req.body.lgu);
    if (!lgu) {
      return res.status(404).json({ message: "LGU not found" });
    }
    
    const assessor = new Assessor(req.body);
    const savedAssessor = await assessor.save();
    
    // Populate the LGU field before returning
    await savedAssessor.populate('lgu', 'name province region');
    
    res.status(201).json(savedAssessor);
  } catch (error) {
    res.status(400).json({ message: "Error creating assessor", error: error.message });
  }
}

export async function updateAssessor(req, res) {
  try {
    // If updating the LGU, verify it exists
    if (req.body.lgu) {
      const lgu = await LGU.findById(req.body.lgu);
      if (!lgu) {
        return res.status(404).json({ message: "LGU not found" });
      }
    }
    
    const assessor = await Assessor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('lgu', 'name province region');
    
    if (!assessor) {
      return res.status(404).json({ message: "Assessor not found" });
    }
    
    res.status(200).json(assessor);
  } catch (error) {
    res.status(400).json({ message: "Error updating assessor", error: error.message });
  }
}

export async function deleteAssessor(req, res) {
  try {
    const assessor = await Assessor.findByIdAndDelete(req.params.id);
    
    if (!assessor) {
      return res.status(404).json({ message: "Assessor not found" });
    }
    
    res.status(200).json({ message: "Assessor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting assessor", error: error.message });
  }
}