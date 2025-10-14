# SMV Modal Save Functionality Fix

## Problem
The SMV modal wasn't saving edits from all 4 tabs. Changes made to activities, proposed publication, and review publication were not being persisted to the database.

## Root Cause
1. **Frontend**: The modal was sending a complex object with `timeline`, `stageMap`, `proposedPublicationActivities`, and `reviewPublicationActivities`, but the parent component was only calling the `updateSMVTimeline` API which only handles timeline data.

2. **Backend**: The SMV Monitoring model didn't have schema fields for:
   - `stageMap` (detailed 19 activities organized by stage)
   - `proposedPublicationActivities` (Tab 3 data)
   - `reviewPublicationActivities` (Tab 4 data)

## Changes Made

### 1. Backend Model Update (`backend/src/models/SMVMonitoring.js`)

Added three new fields to the SMV Monitoring schema:

```javascript
// Stage-based activity mapping (for detailed 19 activities)
stageMap: {
  type: mongoose.Schema.Types.Mixed,
  default: {}
},

// Proposed Publication Activities (Tab 3)
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

// Review & Publication Activities (Tab 4)
reviewPublicationActivities: [{
  name: String,
  status: {
    type: String,
    enum: ["Not Started", "Not Completed", "Completed"],
    default: "Not Completed"
  },
  dateCompleted: String,
  remarks: String
}]
```

### 2. Frontend Parent Component Update (`frontend/src/pages/SMVMonitoringPage.jsx`)

**Changed**: `handleSaveTimeline` function to properly handle all 4 tabs of data

**Before**:
- Only called `updateSMVTimeline` which patches `/smv-processes/${id}/timeline`
- Only saved timeline data

**After**:
- Calls `api.put` on `/smv-processes/${id}` (full update endpoint)
- Sends all 4 tabs worth of data:
  - `timeline` (Tab 1: Timeline dates)
  - `stageMap` (Tab 2: Development activities)
  - `proposedPublicationActivities` (Tab 3: Publication activities)
  - `reviewPublicationActivities` (Tab 4: Review & Publication activities)
- Properly converts date strings to ISO format

**Key code**:
```javascript
const updateData = {};

// Handle timeline data (convert to ISO dates)
if (allData.timeline) {
  const timeline = {};
  Object.keys(allData.timeline).forEach(key => {
    if (allData.timeline[key]) {
      const value = allData.timeline[key];
      timeline[key] = value.includes('T') ? value : new Date(value).toISOString();
    }
  });
  updateData.timeline = timeline;
}

// Handle activities (stageMap)
if (allData.stageMap) {
  updateData.stageMap = allData.stageMap;
}

// Handle proposed publication activities
if (allData.proposedPublicationActivities) {
  updateData.proposedPublicationActivities = allData.proposedPublicationActivities;
}

// Handle review publication activities
if (allData.reviewPublicationActivities) {
  updateData.reviewPublicationActivities = allData.reviewPublicationActivities;
}

// Save all data using the general update endpoint
const res = await api.put(`/smv-processes/${monitoringId}`, updateData);
```

### 3. Modal Component Updates (`frontend/src/components/modals/smv/SetTimelineModal.jsx`)

**Already working correctly**:
- ✅ `handleSaveAll` properly sends all 4 tabs of data to parent
- ✅ All change handlers (`handleChange`, `handleActivityChange`, `handleProposedPublicationChange`, `handleReviewPublicationChange`) set `hasChanges` flag
- ✅ Auto-calculate and reset functions track changes
- ✅ Sticky footer appears only when changes are made
- ✅ Modal stays open after save for continued editing

## Data Flow

1. **User edits any field** → Change handler fires → `setHasChanges(true)` → Sticky footer appears
2. **User clicks "Save All Changes"** → `handleSaveAll()` called
3. **Modal calls parent's `onSave`** with object:
   ```javascript
   {
     timeline: formData,              // Tab 1 dates
     stageMap: activities,            // Tab 2 activities
     proposedPublicationActivities,   // Tab 3 activities
     reviewPublicationActivities      // Tab 4 activities
   }
   ```
4. **Parent's `handleSaveTimeline`** receives data
5. **API PUT request** to `/smv-processes/${id}` with all data
6. **Backend controller** (`updateSMVMonitoring`) uses `Object.assign` to update all fields
7. **Backend saves** to MongoDB with new schema fields
8. **Frontend updates** local state with returned data
9. **Success toast** shows, modal stays open, `hasChanges` reset to false

## Testing Checklist

- [ ] Tab 1 (Timeline): Date changes are saved and persist after page refresh
- [ ] Tab 2 (Development): 19 activity status/date/remarks changes are saved
- [ ] Tab 3 (Proposed Publication): 7 activity changes are saved
- [ ] Tab 4 (Review & Publication): 11 activity changes are saved
- [ ] Auto-calculate button in Tab 1 marks changes and enables save
- [ ] Reset All button clears changes flag
- [ ] Sticky footer appears when ANY field is changed
- [ ] Sticky footer disappears after successful save
- [ ] Modal stays open after save for continued editing
- [ ] Data persists after closing and reopening modal
- [ ] Data persists after page refresh

## Backend Controller

The existing `updateSMVMonitoring` controller already handles this correctly:

```javascript
export async function updateSMVMonitoring(req, res) {
  try {
    const monitoring = await SMVMonitoring.findById(req.params.id);
    if (!monitoring) return res.status(404).json({ message: "SMV monitoring record not found" });

    Object.assign(monitoring, req.body); // ✅ Accepts all new fields
    monitoring.recalculateProgress();

    const updated = await monitoring.save();
    await updated.populate("lguId", "name province region classification incomeClass");

    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Error updating SMV monitoring record", error: error.message });
  }
}
```

## Status

✅ **COMPLETE** - All changes implemented and ready for testing

The modal now properly saves all 4 tabs of data to the backend. The sticky footer provides visual feedback, and the modal stays open for efficient multi-tab editing workflows.
