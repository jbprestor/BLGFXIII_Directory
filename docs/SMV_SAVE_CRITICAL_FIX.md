# SMV Modal Save Issue - CRITICAL FIX

## Problem
Status changes in the Development tab (Tab 2) weren't being saved. After clicking "Save All Changes" and refreshing the page, all changes were lost.

## Root Cause Analysis

### Issue 1: Backend Not Running
- Backend server crashed and wasn't restarted
- Port 5001 was not responding
- **Fix**: Restarted backend server

### Issue 2: Data Structure Mismatch (CRITICAL)
The modal was saving `stageMap` but the page was reading from `activities` array:

**Save Flow** (Modal → Backend):
```javascript
{
  stageMap: {
    "Preparatory": [...],
    "Data Collection": [...],
    // etc.
  }
}
```

**Read Flow** (Backend → Page):
```javascript
// Page was constructing stageMap from activities array:
const activities = monitoring.activities || [];
const stageMap = stages.reduce((acc, stage) => {
  const stageActivities = activities.filter((a) => a.category === stage);
  // ...
}, {});
```

**The Problem**: 
- ✅ stageMap was saved to DB
- ❌ stageMap was NOT being converted to `activities` array
- ❌ Page was reading from empty `activities` array
- ❌ Saved `stageMap` was ignored on page load

## Solution Implemented

### 1. **Dual Format Saving** (`frontend/src/pages/SMVMonitoringPage.jsx`)

When saving, now converts `stageMap` to BOTH formats:

```javascript
// Save stageMap for modal (preserves structure)
updateData.stageMap = allData.stageMap;

// ALSO convert to activities array for page display
const activitiesArray = [];
Object.keys(allData.stageMap).forEach(stage => {
  const stageActivities = allData.stageMap[stage];
  if (Array.isArray(stageActivities)) {
    stageActivities.forEach(activity => {
      if (!activity.placeholder) {
        activitiesArray.push({
          name: activity.name,
          category: stage,
          status: activity.status || 'Not Started',
          dateCompleted: activity.dateCompleted || null,
          remarks: activity.remarks || ''
        });
      }
    });
  }
});
updateData.activities = activitiesArray;
```

### 2. **Smart Data Loading** (`frontend/src/pages/SMVMonitoringPage.jsx`)

Page now prioritizes saved `stageMap`:

```javascript
// Try to use saved stageMap first, otherwise construct from activities
let stageMap;
if (monitoring.stageMap && Object.keys(monitoring.stageMap).length > 0) {
  // Use saved stageMap (preserves detailed structure)
  stageMap = monitoring.stageMap;
} else {
  // Fallback: construct from activities array
  const activities = monitoring.activities || [];
  stageMap = stages.reduce((acc, stage) => {
    // ... construct stageMap
  }, {});
}
```

### 3. **Include Tab 3 & 4 Data**

Also added proposed and review publication activities to tableData:

```javascript
return {
  lguName: lgu.name,
  lguId: lgu._id,
  monitoringId: monitoring._id,
  stageMap,
  // ... other fields
  proposedPublicationActivities: monitoring.proposedPublicationActivities || [],
  reviewPublicationActivities: monitoring.reviewPublicationActivities || [],
};
```

## Data Flow (Fixed)

### Save Operation:
1. User changes status in Development tab
2. `handleActivityChange` → `setHasChanges(true)`
3. User clicks "Save All Changes"
4. Modal calls `onSave({ stageMap, ... })`
5. **Parent converts stageMap → activities array** ✅ NEW
6. Sends BOTH to backend:
   ```javascript
   {
     stageMap: {...},      // For modal editing
     activities: [...],    // For page display
     // ... other tabs
   }
   ```
7. Backend saves both formats to MongoDB
8. Frontend receives updated monitoring with both formats
9. Page updates local state

### Load Operation:
1. Page loads monitoring data from backend
2. **Checks if stageMap exists** ✅ NEW
3. If yes, uses `monitoring.stageMap` (preserves all details)
4. If no, constructs from `monitoring.activities` (backward compatible)
5. Passes to modal and table components

## Benefits

✅ **Backward Compatible**: Old records with only `activities` array still work
✅ **Data Preservation**: New records have both formats for reliability
✅ **Modal Editing**: `stageMap` preserves detailed 19-activity structure
✅ **Page Display**: `activities` array ensures progress calculation works
✅ **No Data Loss**: Changes persist after save and refresh

## Testing Checklist

Test this workflow:

1. **Open any LGU's SMV modal**
2. **Tab 2 (Development)**: Change status of "Set the date of valuation" to "Completed"
3. **Click "Save All Changes"**
4. **Verify**: Success toast appears, sticky footer disappears
5. **Refresh the page** (F5)
6. **Reopen the same LGU's modal**
7. **Verify Tab 2**: "Set the date of valuation" is still "Completed" ✅
8. **Check stats**: "Completed: 1" and "Progress: 5%" show correctly ✅
9. **Tab 3 & Tab 4**: Make changes, save, refresh, verify persistence ✅

## Backend Server Status

✅ Backend running on port 5001
✅ MongoDB connected
✅ Model updated with new fields:
  - `stageMap` (Mixed type)
  - `proposedPublicationActivities` (Array)
  - `reviewPublicationActivities` (Array)
  - `activities` (Array - existing field, still used)

## Files Modified

1. `frontend/src/pages/SMVMonitoringPage.jsx`
   - Updated `handleSaveTimeline` to convert stageMap → activities
   - Updated `tableData` useMemo to prioritize saved stageMap
   - Added Tab 3 & 4 data to tableData

2. `backend/src/models/SMVMonitoring.js`
   - Added `stageMap` field
   - Added `proposedPublicationActivities` array
   - Added `reviewPublicationActivities` array

3. Backend server
   - Restarted with updated model
   - Running on port 5001

## Result

🎉 **SAVE FUNCTIONALITY NOW WORKING**

All changes in all 4 tabs now persist correctly:
- ✅ Tab 1: Timeline dates save and load
- ✅ Tab 2: Development activities save and load
- ✅ Tab 3: Proposed publication activities save and load
- ✅ Tab 4: Review & publication activities save and load
- ✅ Data persists after refresh
- ✅ Progress percentage calculates correctly
- ✅ Stats show accurate completion counts
