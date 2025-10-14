# SetTimelineModal - Activity Display Debugging

## 🐛 Issue: Activities Not Showing Correct Names

### **Problem Identified:**
Looking at the screenshot, activities show generic names like:
- "Preparatory Activity" instead of "Set the date of valuation", etc.
- "Data Collection Activity" instead of specific activity names

### **Root Cause:**
The `lguData.stageMap` passed to the modal has incorrect structure or generic placeholder names.

---

## 🔍 Debugging Steps

### **Step 1: Check Console Logs**

Open browser console (F12) and look for:
```javascript
SetTimelineModal received lguData: {...}
```

**Expected Structure:**
```javascript
{
  lguName: "City Name",
  region: "Region",
  timeline: { /* dates */ },
  stageMap: {
    "Preparatory": [
      { name: "Set the date of valuation", status: "Not Started", ... },
      { name: "Prepare work plan", status: "Not Started", ... },
      // ... 2 more
    ],
    "Data Collection": [ /* 6 activities */ ],
    // ... more stages
  }
}
```

**If you see:**
```javascript
stageMap: {
  "Preparatory": [
    { name: "Preparatory Activity", status: "Completed", ... }  // ❌ WRONG - Generic name
  ]
}
```

**Then the problem is in `SMVMonitoringPage` or the backend data.**

---

### **Step 2: Check if stageMap is Empty/Undefined**

Console should also show:
```javascript
Using default activities - no valid stageMap found
```

**This means:**
- ✅ Modal will use the correct default activities (19 detailed names)
- ✅ Activities should display properly

---

### **Step 3: Verify Activities State**

Add this to browser console after opening modal:
```javascript
// In React DevTools or console
console.log('Current activities:', activities);
```

**Should show:**
```javascript
{
  "Preparatory": [
    { name: "Set the date of valuation", status: "Not Started", ... },
    { name: "Prepare work plan", status: "Not Started", ... },
    { name: "Prepare budget proposal", status: "Not Started", ... },
    { name: "Create and organize SMV teams / TWG", status: "Not Started", ... }
  ],
  // ... all 6 stages with 19 total activities
}
```

---

## 🔧 Fixes Applied

### **1. Enhanced Data Validation**
```javascript
// Now checks if stageMap is:
// - A Map object (converts to plain object)
// - A plain object with arrays
// - Has actual activity data (not empty)

if (lguData.stageMap instanceof Map) {
  const mapObject = Object.fromEntries(lguData.stageMap);
  setActivities(mapObject);
}
else if (typeof lguData.stageMap === 'object') {
  // Verify it has arrays with activities
  const hasActivities = Object.values(lguData.stageMap).some(
    arr => Array.isArray(arr) && arr.length > 0
  );
  if (hasActivities) {
    setActivities(lguData.stageMap);
  }
}
```

### **2. Always Fallback to Defaults**
```javascript
// If no valid data found, use defaults with correct names
if (!hasValidStageMap) {
  console.log('Using default activities - no valid stageMap found');
  setActivities(defaultActivities);  // 19 activities with proper names
}
```

### **3. Added Debug Logging**
```javascript
console.log('SetTimelineModal received lguData:', lguData);
```

---

## 🧪 Testing Procedure

### **Test 1: Open Modal and Check Console**

1. Open browser console (F12)
2. Navigate to SMV Monitoring → Table View
3. Click "Set Timeline" button
4. **Look for log:** `SetTimelineModal received lguData:`
5. **Check stageMap:** Does it have data? What does it look like?

**If stageMap is empty/undefined:**
- ✅ You should see: `Using default activities - no valid stageMap found`
- ✅ Modal should show all 19 activities with correct names

**If stageMap has generic names:**
- ❌ Backend/data source issue - needs fixing in SMVMonitoring model

---

### **Test 2: Verify Activity Names**

Click "Activity Details" tab and check:

**Preparatory section should show:**
- [ ] a. Set the date of valuation
- [ ] b. Prepare work plan
- [ ] c. Prepare budget proposal
- [ ] d. Create and organize SMV teams / TWG

**NOT:**
- [ ] ❌ a. Preparatory Activity

**If still showing generic names:**
→ The `lguData.stageMap` from backend has wrong data
→ Need to check backend `SMVMonitoring` model

---

## 🔍 Backend Data Structure Check

### **Expected Backend Schema:**
```javascript
const smvMonitoringSchema = new mongoose.Schema({
  lgu: { type: mongoose.Schema.Types.ObjectId, ref: 'LGU' },
  
  stageMap: {
    type: Map,
    of: [{
      name: String,  // ← Must have detailed names!
      status: { type: String, enum: ['Not Started', 'In Progress', 'Completed'] },
      dateCompleted: Date,
      remarks: String
    }]
  }
});
```

### **Sample Query to Check:**
```javascript
// In backend
const monitoring = await SMVMonitoring.findOne({ lgu: lguId });
console.log('stageMap:', monitoring.stageMap);

// Should show:
{
  "Preparatory": [
    { name: "Set the date of valuation", ... },
    { name: "Prepare work plan", ... },
    // etc.
  ]
}
```

---

## 📊 Possible Scenarios

### **Scenario 1: lguData.stageMap is undefined**
```javascript
lguData = {
  lguName: "City",
  region: "Region",
  timeline: {...},
  stageMap: undefined  // ← No data
}
```
**Result:** ✅ Modal uses defaultActivities (correct names)

---

### **Scenario 2: lguData.stageMap has wrong structure**
```javascript
lguData = {
  lguName: "City",
  stageMap: {
    "Preparatory": [
      { name: "Preparatory Activity" }  // ❌ Generic name
    ]
  }
}
```
**Result:** ❌ Shows generic names (backend data issue)

**Fix:** Update backend to store proper activity names

---

### **Scenario 3: lguData.stageMap is a Map object**
```javascript
lguData = {
  stageMap: new Map([
    ["Preparatory", [{ name: "Set the date..." }]]
  ])
}
```
**Result:** ✅ Modal converts Map to object (now handled)

---

## 🛠️ Quick Fixes

### **Option 1: Force Use Defaults (Quick Test)**
Temporarily force defaults to verify UI works:

```javascript
// In SetTimelineModal.jsx
useEffect(() => {
  // Force use defaults for testing
  setActivities(defaultActivities);
  setPublicationActivities(defaultPublicationActivities);
}, []);
```

This will show if the UI rendering is working correctly.

---

### **Option 2: Backend Seed Script**
Create seed data with proper activity names:

```javascript
// In backend seed script
const seedActivities = {
  "Preparatory": [
    { name: "Set the date of valuation", status: "Not Started" },
    { name: "Prepare work plan", status: "Not Started" },
    { name: "Prepare budget proposal", status: "Not Started" },
    { name: "Create and organize SMV teams / TWG", status: "Not Started" }
  ],
  // ... other stages
};

await SMVMonitoring.updateOne(
  { lgu: lguId },
  { $set: { stageMap: seedActivities } }
);
```

---

## 📝 Console Output Examples

### **Good Output (Working):**
```
SetTimelineModal received lguData: {
  lguName: "Butuan City",
  stageMap: undefined
}
Using default activities - no valid stageMap found
```
→ ✅ Will show 19 activities with correct names

---

### **Bad Output (Data Issue):**
```
SetTimelineModal received lguData: {
  lguName: "Butuan City",
  stageMap: {
    Preparatory: [{name: "Preparatory Activity"}]
  }
}
```
→ ❌ Will show generic "Preparatory Activity" name  
→ Backend data needs updating

---

## ✅ Expected Result After Fix

**When you open the modal now:**

1. Console shows received lguData
2. If stageMap is invalid/empty → Uses defaults
3. Activity Details tab shows:
   ```
   ⭕ Preparatory                                    4/4
   ┌──┬─────────────────────────────────┬──────┬──────┬────────┐
   │#│Activity                          │Status│Date  │Remarks │
   ├──┼─────────────────────────────────┼──────┼──────┼────────┤
   │a│Set the date of valuation        │[▼]   │[📅]  │[___]   │
   │b│Prepare work plan                │[▼]   │[📅]  │[___]   │
   │c│Prepare budget proposal          │[▼]   │[📅]  │[___]   │
   │d│Create and organize SMV teams... │[▼]   │[📅]  │[___]   │
   └──┴─────────────────────────────────┴──────┴──────┴────────┘
   ```

**NOT generic names like "Preparatory Activity"!**

---

## 🎯 Next Actions

1. **Check console logs** - What does lguData look like?
2. **Check which scenario** you're hitting (1, 2, or 3)
3. **If Scenario 1** (undefined) → ✅ Should work now
4. **If Scenario 2** (wrong names) → Backend needs updating
5. **If Scenario 3** (Map object) → ✅ Should work now

**Report back what you see in console!** 🔍
