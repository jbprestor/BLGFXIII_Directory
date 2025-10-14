# SMV Monitoring Modal - Redesign Documentation

## 🎯 Overview

The **SetTimelineModal** has been redesigned as a **comprehensive monitoring dashboard** with tabbed interface showing both RA 12001 timeline management and detailed activity tracking.

---

## 🎨 New Design Structure

### **Modal Header**
- Title: "SMV Monitoring Details"
- Shows: LGU Name + Region
- Close button (X)

### **Tab Navigation** (2 Tabs)
1. **RA 12001 Timeline** - Set BLGF Notice & deadlines
2. **Activity Details** - View all activities by stage

---

## Tab 1: RA 12001 Timeline

### **Purpose:**
Set Day 0 (BLGF Notice Date) and manage all deadline dates per LGU.

### **Features:**
✅ **BLGF Notice Date (Day 0)** input - Required field  
✅ **Auto-Calculate Button** - Generates all deadlines automatically  
✅ **Manual Date Entry** - 6 additional deadline fields:
   - RO Submission (12 months from notice)
   - Publication (2 weeks before consultation)
   - Public Consultation (60 days before RO)
   - Sanggunian Submission (legislative approval)
   - BLGF Approval (final certification)
   - Effectivity Date (usually Jan 1)

### **Layout:**
```
┌─────────────────────────────────────────────┐
│ RA 12001 Timeline Tab                       │
├─────────────────────────────────────────────┤
│ [Info] Quick Tip: Set Day 0, click Auto... │
│                                             │
│ 🔔 BLGF Notice Date (Day 0) *              │
│ [mm/dd/yyyy] _______________               │
│                                             │
│ [⚡ Auto-Calculate All Deadlines]          │
│                                             │
│ --- OR SET MANUALLY ---                    │
│                                             │
│ 📤 RO Submission    📰 Publication         │
│ [date]              [date]                  │
│                                             │
│ 👥 Public Consult   🏛️ Sanggunian         │
│ [date]              [date]                  │
│                                             │
│ ✅ BLGF Approval    🎯 Effectivity         │
│ [date]              [date]                  │
│                                             │
│ [Cancel]                    [Save Timeline] │
└─────────────────────────────────────────────┘
```

---

## Tab 2: Activity Details ⭐ (NEW!)

### **Purpose:**
Display comprehensive view of all SMV activities organized by stage, showing Status, Date Completed, and Remarks.

### **Summary Stats** (Top Section)
```
┌──────────────┬──────────────┬──────────────┐
│ Total        │ Completed    │ Progress     │
│ Activities   │              │              │
│   19         │     19       │   100%       │
└──────────────┴──────────────┴──────────────┘
```

### **Stage-by-Stage Breakdown**
Each stage displays as an expandable card:

```
┌─────────────────────────────────────────────────────┐
│ ✅ Preparatory                          4 / 4        │
├────┬─────────────────────┬────────┬─────────┬───────┤
│ #  │ Activity            │ Status │ Date    │ Rmks  │
├────┼─────────────────────┼────────┼─────────┼───────┤
│ a. │ Set date of val...  │   ✅   │ Jun 2026│ ...   │
│ b. │ Prepare work plan   │   ✅   │ Jun 23  │ ...   │
│ c. │ Prepare budget...   │   ✅   │ Jun 23  │ ...   │
│ d. │ Create SMV teams    │   ✅   │ Aug 4   │Upload │
└────┴─────────────────────┴────────┴─────────┴───────┘
```

### **Columns:**
1. **#** - Activity letter (a, b, c, d...)
2. **Activity** - Activity name
3. **Status** - Badge with color coding:
   - ✅ **Completed** (green)
   - ⏳ **In Progress** (yellow)
   - ⚪ **Not Started** (gray)
4. **Date Completed** - Formatted date (e.g., "Jun 23, 2025")
5. **Remarks** - Any notes or ongoing activity description

### **All 6 Stages Shown:**
1. **Preparatory** (4 activities)
2. **Data Collection** (6 activities)
3. **Data Analysis** (3 activities)
4. **Preparation of Proposed SMV** (4 activities)
5. **Valuation Testing** (1 activity)
6. **Finalization** (1 activity)

---

## 🎯 How It Works

### **Opening the Modal:**
```javascript
// User clicks "Set Timeline" button (📅) in table
→ Modal opens with LGU data pre-populated
→ Default tab: "RA 12001 Timeline"
```

### **Tab Switching:**
```javascript
// User clicks "Activity Details" tab
→ Shows comprehensive activity breakdown
→ All stages with activities, status, dates
```

### **Data Flow:**
```
SMVMonitoringPage
    ↓ (passes lguData)
SetTimelineModal
    ↓ (displays)
Tab 1: Timeline dates
Tab 2: Activity details from lguData.stageMap
```

---

## 📊 Data Structure Expected

### **lguData Object:**
```javascript
{
  lguName: "Butuan City",
  region: "Caraga",
  monitoringId: "abc123",
  totalPercent: 100,
  stageMap: {
    "Preparatory": [
      {
        _id: "act1",
        name: "Set the date of valuation",
        status: "Completed",
        dateCompleted: "2026-06-01",
        remarks: "June 2026 (Valuation Date)"
      },
      // ... more activities
    ],
    "Data Collection": [ /* 6 activities */ ],
    "Data Analysis": [ /* 3 activities */ ],
    "Preparation of Proposed SMV": [ /* 4 activities */ ],
    "Valuation Testing": [ /* 1 activity */ ],
    "Finalization": [ /* 1 activity */ ]
  },
  timeline: {
    blgfNoticeDate: "2025-04-14",
    regionalOfficeSubmissionDeadline: "2026-04-14",
    // ... other deadlines
  }
}
```

---

## 🎨 UI Features

### **Responsive Design:**
- ✅ Modal: Max width 2xl (768px)
- ✅ Max height: 90vh with scroll
- ✅ Sticky header with tabs
- ✅ Scrollable content area

### **Visual Indicators:**
- **Status Badges**: Color-coded (success, warning, ghost)
- **Progress Stats**: Cards with gradient backgrounds
- **Stage Headers**: Primary color background with activity count
- **Table**: Compact table-xs with hover effects

### **Accessibility:**
- ✅ Escape key closes modal
- ✅ Body scroll lock when open
- ✅ Clear close button
- ✅ Semantic HTML (proper table structure)

---

## 💡 User Benefits

### **For Managers:**
1. **Quick Overview** - See all activities at a glance
2. **Status Tracking** - Know what's done, in progress, or pending
3. **Date Monitoring** - Track when activities were completed
4. **Remarks Review** - See notes/issues per activity

### **For Field Teams:**
1. **Progress Verification** - Confirm their work is recorded
2. **Date References** - Check when things were completed
3. **Completeness Check** - Ensure no activities missed

### **For Administrators:**
1. **Data Validation** - Review activity completeness
2. **Timeline Management** - Set and adjust deadlines
3. **Comprehensive View** - Both timeline and activities in one place

---

## 🔄 Comparison: Before vs After

### **Before (Old Modal):**
```
┌─────────────────────────────────┐
│ Set RA 12001 Timeline           │
├─────────────────────────────────┤
│ Just timeline date inputs       │
│ No activity visibility          │
│ Limited information             │
└─────────────────────────────────┘
```

### **After (New Modal):**
```
┌─────────────────────────────────────────┐
│ SMV Monitoring Details                  │
│ [RA 12001 Timeline] [Activity Details]  │
├─────────────────────────────────────────┤
│ Tab 1: Timeline management              │
│ Tab 2: Complete activity breakdown      │
│        - All 6 stages                   │
│        - Status, dates, remarks         │
│        - Summary statistics             │
└─────────────────────────────────────────┘
```

---

## 📋 Example Use Cases

### **Use Case 1: Setting Timeline (Manager)**
```
1. Open modal for "Butuan City"
2. Stay on "RA 12001 Timeline" tab
3. Enter BLGF Notice: April 14, 2025
4. Click "Auto-Calculate"
5. Review generated dates
6. Save Timeline
```

### **Use Case 2: Reviewing Progress (Manager)**
```
1. Open modal for "Surigao City"
2. Click "Activity Details" tab
3. See summary: 15/19 completed (79%)
4. Scroll to "Data Collection" stage
5. Notice: 2 activities "Not Started"
6. Make note to follow up
```

### **Use Case 3: Verifying Data (Admin)**
```
1. Open modal for any LGU
2. Switch to "Activity Details"
3. Check each stage:
   - Status makes sense?
   - Dates are chronological?
   - Remarks are present?
4. Validate data quality
```

### **Use Case 4: Reporting (All Users)**
```
1. Open modal
2. Switch to "Activity Details"
3. Screenshot the modal
4. Include in reports to BLGF
5. Shows comprehensive activity status
```

---

## 🚀 Future Enhancements (Optional)

### **Potential Additions:**
1. **Edit Activities** - Allow status/date/remarks editing in modal
2. **Export Button** - Export activity details to Excel
3. **Print View** - Optimized print layout
4. **Activity History** - Show change log per activity
5. **Attachments** - Link documents to activities
6. **Progress Chart** - Visual timeline of completion dates

---

## 📝 Technical Details

### **Files Modified:**
- ✅ `frontend/src/components/modals/smv/SetTimelineModal.jsx`

### **Key Changes:**
1. Added `activeTab` state ("timeline" | "activities")
2. Added tab navigation UI
3. Split content into two conditional renders
4. Added Activity Details table structure
5. Added summary statistics cards
6. Maintained all existing timeline functionality

### **Dependencies:**
- React hooks: useState, useEffect
- Custom hooks: useEscapeKey, useBodyScrollLock
- External: react-hot-toast
- Data: Expects lguData with stageMap

---

**Last Updated**: October 11, 2025  
**Feature**: Tabbed Modal with Timeline + Activity Details  
**Status**: ✅ Production Ready
