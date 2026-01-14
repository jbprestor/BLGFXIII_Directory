import { Assessor } from "../models/Assessors.js";
import { LGU } from "../models/LGU.js";

export async function getAllAssessors(req, res) {
  try {
    const { page = 1, limit = 20000, search, lgu } = req.query;
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
      .populate('lgu', 'name province region classification')
      .sort({ lastName: 1, firstName: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.status(200).json(assessors); // ✅ return plain array only
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
    const {
      firstName,
      lastName,
      sex,
      civilStatus,
      birthday,
      lgu,
      plantillaPosition,
      officialDesignation,
      statusOfAppointment,
      dateOfAppointment,
    } = req.body;

    // Sanitize input: Convert empty strings to undefined to bypass Mongoose enum/date validation
    const sanitizedBody = { ...req.body };
    const optionalFields = [
      "sex",
      "civilStatus",
      "statusOfAppointment",
      "birthday",
      "dateOfAppointment",
      "prcLicenseExpiration",
      "dateOfMandatoryRetirement",
      "dateOfCompulsoryRetirement",
      "lgu" // ensure lgu is not passed as "" if invalid
    ];

    optionalFields.forEach((field) => {
      if (sanitizedBody[field] === "" || sanitizedBody[field] === null) {
        delete sanitizedBody[field];
      }
    });

    // Check required fields - Relaxed: First Name, Last Name, and LGU required
    if (!firstName || !lastName || !lgu) {
      return res.status(400).json({
        message: "First Name, Last Name, and LGU are required."
      });
    }

    // Check LGU exists
    const lguExists = await LGU.findById(lgu);
    if (!lguExists) {
      return res.status(404).json({ message: "LGU not found" });
    }

    // Create assessor
    // Create assessor
    const assessor = new Assessor(sanitizedBody);
    const savedAssessor = await assessor.save();

    await savedAssessor.populate("lgu", "name province region");

    return res.status(201).json(savedAssessor);
  } catch (error) {
    console.error("Error creating assessor:", error);
    return res.status(400).json({
      message: "Error creating assessor",
      error: error.message
    });
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

    // Sanitize input: Convert empty strings to undefined to bypass Mongoose enum/date validation
    const sanitizedBody = { ...req.body };
    const optionalFields = [
      "sex",
      "civilStatus",
      "statusOfAppointment",
      "birthday",
      "dateOfAppointment",
      "prcLicenseExpiration",
      "dateOfMandatoryRetirement",
      "dateOfCompulsoryRetirement",
      "lgu"
    ];

    optionalFields.forEach((field) => {
      if (sanitizedBody[field] === "" || sanitizedBody[field] === null) {
        // For updates, we might want to unset the field if it's empty?
        // But Mongoose findByIdAndUpdate with {new: true} and a body...
        // If we want to CLEAR a field, we should probably set it to null if schema allows, or undefined to ignore it.
        // If schema is optional strings, null is usually fine or $unset.
        // For simplicity, let's just remove them from the payload so we don't *break* validation.
        // If the user INTENDS to clear it, they might need to send explicit null, but we are deleting it here.
        // Be careful: if we delete it from body, the old value REMAINS.
        // If we want to CLEAR it, we should set to null.
        // Let's set to null if it's ""
        if (sanitizedBody[field] === "") {
          sanitizedBody[field] = null;
        }
      }
    });

    const assessor = await Assessor.findByIdAndUpdate(
      req.params.id,
      sanitizedBody,
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

export async function getAssessorNotifications(req, res) {
  try {
    const today = new Date();

    // Find assessors with expired licenses
    const expiredLicenses = await Assessor.find({
      prcLicenseExpiration: { $lt: today, $ne: null }
    }).select("firstName lastName prcLicenseExpiration lgu").populate("lgu", "name");

    // Find assessors with missing license expiration (where it should probably be present)
    // Assuming statusOfAppointment "Permanent" usually requires a license, but kept simple for now
    const missingLicenses = await Assessor.find({
      $or: [
        { prcLicenseExpiration: null },
        { prcLicenseExpiration: { $exists: false } }
      ],
      // Optional: Filter by appointment status if needed, e.g., only REA or Permanent
      statusOfAppointment: { $nin: ["Job Order", "Casual", "Retired"] }
    }).select("firstName lastName statusOfAppointment lgu").populate("lgu", "name");

    const notifications = [
      ...expiredLicenses.map(a => ({
        id: a._id,
        type: "expired",
        message: `License expired for ${a.firstName} ${a.lastName}`,
        date: a.prcLicenseExpiration,
        lgu: a.lgu?.name
      })),
      ...missingLicenses.map(a => ({
        id: a._id,
        type: "missing",
        message: `License expiration missing for ${a.firstName} ${a.lastName}`,
        lgu: a.lgu?.name
      }))
    ];

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Error fetching notifications", error: error.message });
  }
}