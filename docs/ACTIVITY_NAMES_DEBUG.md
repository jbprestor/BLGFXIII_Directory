# Activity Names Not Showing - Debug Guide

## 🐛 Current Issue

Looking at the screenshot:
- Activity column is **completely empty** (no names showing)
- Shows "Total Activities: 6" instead of expected 19
- Status/Date/Remarks fields are present but no activity names

## 🔍 Debug Logs Added

### **Console Logs to Check:**

When you click "Set Timeline" button, check console for:

1. **In SMVMonitoringPage:**
```javascript
handleSetTimeline received rowData: {...}
rowData.stageMap: {...}
```

2. **In SetTimelineModal:**
```javascript
SetTimelineModal received lguData: {...}
Current activities state: {...}
Activities structure check: {...}
```

3. **Decision Message:**
```javascript
// Either:
Using default activities - no valid stageMap found or missing activity names
Received stageMap: {...}

// Or:
Using LGU stageMap data
```

---

## 📊 Expected Data Flow

### **Step 1: Table Row Data**
```javascript
rowData = {
  lguId: "...",
  lguName: "City Name",
  region: "Region",
  monitoringId: "...",
  stageMap: {
    "Preparatory": [
      { name: "Set the date of valuation", status: "Not Started", ... },
      // ... more
    ]
  }
}
```

### **Step 2: Modal Receives Data**
```javascript
lguData = rowData  // Passed as prop
```

### **Step 3: Modal Processes Data**
```javascript
// Check if stageMap has valid activities with names
if (lguData.stageMap && activities have .name property) {
  setActivities(lguData.stageMap);
} else {
  setActivities(defaultActivities);  // 19 activities with proper names
}
```

---

## 🎯 Possible Scenarios

### **Scenario A: stageMap is undefined**
```javascript
rowData = {
  lguName: "City",
  stageMap: undefined  // ← No data
}
```
**Expected Result:** ✅ Uses defaultActivities (19 with names)  
**Your Result:** ❌ Showing 6 activities without names

---

### **Scenario B: stageMap exists but activities missing .name**
```javascript
rowData = {
  stageMap: {
    "Preparatory": [
      { status: "Not Started" }  // ← Missing .name property!
    ]
  }
}
```
**Expected Result:** ✅ Uses defaultActivities (validation should catch this)  
**Your Result:** ❌ Showing 6 activities without names

---

### **Scenario C: stageMap has wrong structure (6 stages, 1 activity each)**
```javascript
rowData = {
  stageMap: {
    "Preparatory": [{ }],  // 1 activity, no name
    "Data Collection": [{ }],  // 1 activity, no name
    "Data Analysis": [{ }],  // 1 activity, no name
    "Preparation of Proposed SMV": [{ }],  // 1 activity, no name
    "Valuation Testing": [{ }],  // 1 activity, no name
    "Finalization": [{ }]  // 1 activity, no name
  }
}
```
**This explains:** "Total Activities: 6"  
**Problem:** Activities don't have `.name` property

---

## 🔧 What Was Fixed

### **1. Enhanced Validation**
```javascript
// Now checks if activities have .name property
const hasActivities = Object.values(lguData.stageMap).some(arr => 
  Array.isArray(arr) && arr.length > 0 && arr[0].name  // ← Checks for .name!
);
```

### **2. Better Logging**
```javascript
// Shows what was received and why decision was made
console.log('Using default activities - no valid stageMap found or missing activity names');
console.log('Received stageMap:', lguData.stageMap);
```

### **3. Always Validate Before Use**
```javascript
if (!hasValidStageMap || !processedStageMap) {
  // Use defaults if data is invalid
  setActivities(defaultActivities);
} else {
  // Use provided data only if valid
  setActivities(processedStageMap);
}
```

---

## 📝 Testing Instructions

### **Step 1: Open Browser Console**
Press `F12` to open developer tools

### **Step 2: Click "Set Timeline"**
Click the calendar icon (📅) on any LGU row

### **Step 3: Check Console Output**

Look for these logs in order:

```javascript
1. handleSetTimeline received rowData: {...}
   ↓ Check: Does rowData have stageMap?
   ↓ Check: What does stageMap look like?

2. SetTimelineModal received lguData: {...}
   ↓ Same data as rowData

3. Current activities state: {...}
   ↓ Check: How many stages?
   ↓ Check: How many activities per stage?
   ↓ Check: Do activities have .name property?

4. Activities structure check: {
     isObject: true,
     keys: ["Preparatory", "Data Collection", ...],
     firstStage: "Preparatory",
     firstStageActivities: [...]  ← Check this array!
   }

5. Either:
   "Using default activities - no valid stageMap found..."
   OR
   "Using LGU stageMap data"
```

### **Step 4: Check Modal Display**

Click "Activity Details" tab:
- Should show "Total Activities: 19" (not 6)
- Preparatory section should show 4 activities with names
- Activity names should be visible

---

## 🎯 What to Look For in Console

### **Check 1: rowData Structure**
```javascript
handleSetTimeline received rowData: {
  lguName: "...",
  stageMap: ???  // ← What is this?
}
```

**Questions:**
- Is `stageMap` present?
- Is it an object or Map?
- What keys does it have?

### **Check 2: Activities Array**
```javascript
Activities structure check: {
  firstStageActivities: [
    { name: "???", status: "...", ... },  // ← Does it have .name?
    ...
  ]
}
```

**Questions:**
- How many items in array? (Should be 4 for Preparatory)
- Does each item have `.name` property?
- What are the values of `.name`?

### **Check 3: Decision Made**
```javascript
// Should see ONE of these:
"Using default activities - no valid stageMap found..."
// OR
"Using LGU stageMap data"
```

**If "Using default activities":**
- ✅ GOOD: Modal should now show 19 activities with proper names
- ❌ BAD: If still showing 6 without names → useState initialization issue

**If "Using LGU stageMap data":**
- Check what that data looks like in console
- Likely has wrong structure or missing .name properties

---

## 🚨 Most Likely Cause

Based on "Total Activities: 6":

**The `rowData.stageMap` has 6 stages with 1 activity each, but those activities don't have `.name` property!**

Structure is probably:
```javascript
{
  "Preparatory": [{ status: "Not Started", dateCompleted: "", remarks: "" }],  // Missing .name!
  "Data Collection": [{ status: "Not Started", ... }],  // Missing .name!
  // ... 4 more stages
}
```

**Solution:** 
- Backend should not send stageMap with incomplete data
- Frontend (now fixed) will detect missing .name and use defaults

---

## ✅ Next Steps

1. **Refresh browser** (Ctrl+F5)
2. **Open console** (F12)
3. **Click "Set Timeline"** button
4. **Copy and paste ALL console output here**

This will show us:
- What data structure is being passed
- Why the validation is or isn't working
- Whether defaults are being used

---

## 🔍 Quick Diagnosis

**If console shows:**
```
firstStageActivities: [undefined]
```
→ Activities array is malformed

**If console shows:**
```
firstStageActivities: [{ status: "Not Started" }]
```
→ Missing .name property (fixed - should use defaults now)

**If console shows:**
```
firstStageActivities: [{ name: "Set the date of valuation", ... }]
```
→ Data is correct! Issue must be elsewhere

---

**Please refresh the page, open the modal, and share the console output!** 🔍
