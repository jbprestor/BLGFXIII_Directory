# Toast Duplicate Fix

## Problem
Multiple success toasts were showing up when saving timeline data, causing confusion and UI clutter.

### Root Causes:
1. **Multiple toast calls in save flow** - Toasts were being triggered at different stages:
   - When creating monitoring record
   - When updating timeline
   - Both in parent component AND modal component
   
2. **No proper toast management** - No centralized loading toast with dismiss

3. **Duplicate success messages** - Both parent and modal showing success toasts

## Solution

### 1. Centralized Toast Management in Parent
**File:** `frontend/src/pages/SMVMonitoringPage.jsx`

**Before:**
```javascript
// Multiple toast calls scattered throughout
if (!monitoringId) {
  toast.loading(`Creating monitoring record...`);
  // ... create logic
  toast.dismiss();
  toast.success(`Monitoring record created!`); // Toast 1
}
// ... save timeline
toast.success(`Timeline updated!`); // Toast 2
```

**After:**
```javascript
const handleSaveTimeline = async (timelineData) => {
  // Single loading toast with ID
  const loadingToastId = toast.loading(`Saving timeline for ${selectedLguForTimeline.lguName}...`);
  
  try {
    let monitoringId = selectedLguForTimeline?.monitoringId;

    // Create monitoring if needed (no separate toast)
    if (!monitoringId) {
      const createRes = await api.post("/smv-processes", {
        lguId: selectedLguForTimeline.lguId,
        referenceYear: selectedYear,
        valuationDate: new Date(selectedYear, 0, 1),
        createdBy: user._id,
      });
      monitoringId = createRes.data._id;
      setMonitorings((prev) => [...prev, createRes.data]);
    }

    // Save timeline
    const res = await updateSMVTimeline(monitoringId, timelineData);
    setMonitorings((prev) =>
      prev.map((m) => (m._id === monitoringId ? res.data : m))
    );

    // Single success toast - dismiss loading first
    toast.dismiss(loadingToastId);
    toast.success(`Timeline saved successfully for ${selectedLguForTimeline.lguName}!`);
    setTimelineModalOpen(false);
  } catch (error) {
    // Dismiss loading toast
    toast.dismiss(loadingToastId);
    
    // Handle 409 conflict (existing monitoring)
    if (error.response?.status === 409) {
      try {
        const existing = await api.get(`/smv-processes`, {
          params: { lguId: selectedLguForTimeline.lguId, year: selectedYear },
        });
        const monitoring = existing.data?.monitoringList?.[0];
        if (monitoring) {
          setMonitorings((prev) => [...prev, monitoring]);
          const res = await updateSMVTimeline(monitoring._id, timelineData);
          setMonitorings((prev) =>
            prev.map((m) => (m._id === monitoring._id ? res.data : m))
          );
          toast.success(`Timeline updated successfully for ${selectedLguForTimeline.lguName}!`);
          setTimelineModalOpen(false);
          return;
        }
      } catch (fetchError) {
        console.error("Error fetching existing monitoring:", fetchError);
        toast.error("Failed to update existing monitoring record. Please try again.");
        return;
      }
    }
    
    // Single error toast with clear message
    const errorMessage = error.response?.data?.message || error.message || "Failed to save timeline";
    toast.error(`Error: ${errorMessage}`);
    console.error("Save timeline error:", error);
  }
};
```

### 2. Remove Duplicate Toasts from Modal
**File:** `frontend/src/components/modals/smv/SetTimelineModal.jsx`

**Before:**
```javascript
const handleSaveAll = async () => {
  setLoading(true);
  try {
    await onSave({...});
    // onClose(); // Closing here
  } catch (error) {
    // Modal showing error toast
    if (error.response?.status !== 409) {
      toast.error(error.response?.data?.message || "Failed to save changes");
    }
    console.error("Save error:", error);
  } finally {
    setLoading(false);
  }
};
```

**After:**
```javascript
const handleSaveAll = async () => {
  setLoading(true);
  try {
    await onSave({...});
    // All toasts and modal closing are handled by parent component
  } catch (error) {
    // Parent handles all error toasts
    console.error("Save error:", error);
  } finally {
    setLoading(false);
  }
};
```

## Benefits

### ✅ Single Loading Toast
- Shows: "Saving timeline for [LGU Name]..."
- Managed with ID for proper dismissal
- No overlapping loading states

### ✅ Single Success Toast
- Shows: "Timeline saved successfully for [LGU Name]!"
- Only appears once per save operation
- Clear and concise message

### ✅ Proper Error Handling
- 409 conflicts handled gracefully with automatic retry
- Clear error messages for users
- Console logging for debugging

### ✅ Clean UI
- No toast spam
- Professional user experience
- Predictable behavior

## User Experience

### Before Fix:
```
[Loading] Creating monitoring record for 2025...
[Success] Monitoring record created for 2025!
[Success] Timeline updated for Tandag City
[Success] All changes saved successfully!  // From modal
```
**Result:** 3-4 toasts showing simultaneously ❌

### After Fix:
```
[Loading] Saving timeline for Tandag City...
[Success] Timeline saved successfully for Tandag City!
```
**Result:** 1 loading toast → 1 success toast ✅

## Error Scenarios Handled

### 1. Network Error
```javascript
toast.error("Error: Network request failed");
```

### 2. Backend Validation Error
```javascript
toast.error("Error: Invalid timeline data");
```

### 3. Duplicate Monitoring (409)
```javascript
// Automatically fetches existing record and updates it
toast.success("Timeline updated successfully for [LGU Name]!");
// No error shown to user
```

### 4. Fetch Existing Record Failed
```javascript
toast.error("Failed to update existing monitoring record. Please try again.");
```

## Testing Checklist

- [x] Save timeline for new LGU (no monitoring record)
  - ✅ Shows loading → success (single toast)
  
- [x] Save timeline for existing LGU (has monitoring)
  - ✅ Shows loading → success (single toast)
  
- [x] Save timeline when duplicate exists (409 error)
  - ✅ Auto-retries and shows success (single toast)
  
- [x] Save timeline with network error
  - ✅ Shows loading → error with clear message
  
- [x] Save timeline with validation error
  - ✅ Shows loading → error with backend message

## Related Files

- `frontend/src/pages/SMVMonitoringPage.jsx` - Main save handler
- `frontend/src/components/modals/smv/SetTimelineModal.jsx` - Modal component
- Uses `react-hot-toast` for toast notifications

## Date
October 12, 2025
