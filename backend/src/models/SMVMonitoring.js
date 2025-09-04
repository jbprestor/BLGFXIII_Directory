const mongoose = require('mongoose');

// Sub-schema for activities
const activitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['Preparatory', 'Data Collection', 'Data Analysis', 
           'Preparation of Proposed SMV', 'Valuation Testing', 'Finalization'],
    required: true
  },
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'Completed'],
    default: 'Not Started'
  },
  dateCompleted: Date,
  remarks: String
});

// Main SMV Process Schema
const smvProcessSchema = new mongoose.Schema({
  lguId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LGU',
    required: true
  },
  referenceYear: {
    type: Number,
    required: true
  },
  valuationDate: {
    type: Date,
    required: true
  },
  activities: [activitySchema],
  overallStatus: {
    type: String,
    enum: ['Preparatory', 'Data Collection', 'Data Analysis', 
           'Preparation', 'Testing', 'Finalization', 'Completed'],
    default: 'Preparatory'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { 
  timestamps: true 
});

// Index for efficient querying
smvProcessSchema.index({ lguId: 1, referenceYear: 1 });

module.exports = mongoose.model('SMVProcess', smvProcessSchema);