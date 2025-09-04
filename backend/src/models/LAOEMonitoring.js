const mongoose = require('mongoose');

const laoeMonitoringSchema = new mongoose.Schema({
  smvProcessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SMVProcess',
    required: true
  },
  lguId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LGU',
    required: true
  },
  quarter: {
    type: String,
    required: true,
    match: [/^\d{4}-Q[1-4]$/, 'Quarter must be in format YYYY-QQ (e.g., 2025-Q1)']
  },
  dateReleased: {
    type: Date,
    required: true
  },
  evaluators: [String],
  description: String,
  attachments: [String]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('LAOEMonitoring', laoeMonitoringSchema);