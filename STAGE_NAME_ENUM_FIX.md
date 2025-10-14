# Stage Name Enum Validation Error - FIXED

## Error Message
```
SMVMonitoring validation failed: activities.18.category: 
`Finalization of Proposed SMV` is not a valid enum value for path `category`.
```

## Problem
Frontend modal uses **"Finalization of Proposed SMV"** as a stage name, but the backend MongoDB schema only accepts **"Finalization"** in its enum.

## Backend Schema (What's Accepted)
From `backend/src/models/SMVMonitoring.js`:
```javascript
category: {
  type: String,
  enum: [
    "Preparatory",
    "Data Collection",
    "Data Analysis",
    "Preparation of Proposed SMV",
    "Public Consultation",
    "Review by RO",
    "Submission to BLGF CO",
    "DOF Review",
    "Valuation Testing",
    "Finalization",  // ← Only accepts "Finalization"
  ],
  required: true,
}
```

## Frontend Stage Names (What Was Being Sent)
From `frontend/src/components/modals/smv/SetTimelineModal.jsx`:
```javascript
const initialActivities = {
  "Preparatory": [...],
  "Data Collection": [...],
  "Data Analysis": [...],
  "Preparation of Proposed SMV": [...],
  "Valuation Testing": [...],
  "Finalization of Proposed SMV": [  // ❌ Not in backend enum!
    { name: "Finalization of Proposed SMV", ... }
  ]
};
```

## The Mismatch
- **Frontend uses**: `"Finalization of Proposed SMV"`
- **Backend accepts**: `"Finalization"`

When converting `stageMap` to `activities` array, we were using the frontend stage name as the `category` field, causing validation to fail.

## Solution
**Map frontend stage names to backend enum values** before sending to API.

### Code Changes in `frontend/src/pages/SMVMonitoringPage.jsx`

#### Location 1: Main Save Handler (~line 325)
```javascript
// BEFORE
const activityData = {
  name: activity.name,
  category: stage,  // ❌ Uses "Finalization of Proposed SMV"
  status: activity.status || 'Not Started',
  remarks: activity.remarks || ''
};

// AFTER
// Map frontend stage names to backend enum values
const stageNameMap = {
  "Finalization of Proposed SMV": "Finalization",
  // Add other mappings if needed
};

const backendCategory = stageNameMap[stage] || stage;

const activityData = {
  name: activity.name,
  category: backendCategory,  // ✅ Uses "Finalization"
  status: activity.status || 'Not Started',
  remarks: activity.remarks || ''
};
```

#### Location 2: Error Recovery Handler (~line 454)
Applied the same mapping in the 409 conflict recovery path.

## How It Works

1. **Frontend stage names can be different** (more descriptive, longer)
2. **Mapping object translates them** to backend enum values
3. **If no mapping exists**, uses the original name (most stages match)
4. **Only "Finalization of Proposed SMV" needs mapping** to "Finalization"

### Example Conversion:

**Input (stageMap keys)**:
```javascript
{
  "Preparatory": [...],                      // ✅ Matches backend enum
  "Data Collection": [...],                  // ✅ Matches backend enum
  "Finalization of Proposed SMV": [...]      // ❌ Doesn't match backend enum
}
```

**Output (activities array categories)**:
```javascript
[
  { name: "...", category: "Preparatory", ... },          // ✅ No change
  { name: "...", category: "Data Collection", ... },      // ✅ No change
  { name: "...", category: "Finalization", ... }          // ✅ Mapped!
]
```

## Why This Error Occurred

1. **Modal was designed with descriptive stage names** for better UX
2. **Backend schema has stricter, standardized names** for consistency
3. **No validation** between frontend stage names and backend enum
4. **Error only appeared when converting stageMap → activities array**

## Prevention

To prevent this in the future:

1. **Keep stage names in sync** between frontend and backend
2. **Use a shared constants file** for stage names
3. **Add validation** to check stage names match backend enum
4. **Or use a mapping layer** (current solution) for flexibility

## Result

✅ **Stage name mapping applied**
✅ **"Finalization of Proposed SMV" → "Finalization"**
✅ **All activities validate correctly**
✅ **Save operation succeeds**
✅ **Data persists after refresh**

## Testing

**Test Case**: Save an LGU with "Finalization of Proposed SMV" activities

**Before Fix**:
```
❌ 400 Bad Request
❌ Validation error: category enum mismatch
❌ Data not saved
```

**After Fix**:
```
✅ 200 OK
✅ Activities array uses "Finalization"
✅ Data saved successfully
✅ Changes persist after refresh
```
