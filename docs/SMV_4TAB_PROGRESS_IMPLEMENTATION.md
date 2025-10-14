# SMV 4-Tab Progress Tracking Implementation Plan

## ✅ COMPLETED

### 1. SMVProgressBar Component Created
**File**: `frontend/src/components/smv/SMVProgressBar.jsx`

**Features**:
- Segmented progress bar showing all 4 tabs visually
- Main progress bar with weighted average
- 4 mini colored segments below (proportional width to tab weight)
- Hover tooltip showing per-tab percentages
- Color coding: green (100%), yellow (50-99%), blue (1-49%), gray (0%)

**Weights**:
- Tab 1 (Timeline): 10% weight - Small segment
- Tab 2 (Development): 60% weight - Large segment
- Tab 3 (Proposed Pub): 20% weight - Medium segment
- Tab 4 (Review & Pub): 10% weight - Small segment

### 2. Modal Tab Locking Implemented
**File**: `frontend/src/components/modals/smv/SetTimelineModal.jsx`

**Changes**:
- Tab 1 (Timeline): Always accessible
- Tabs 2, 3, 4: Locked until `formData.blgfNoticeDate` is set
- Disabled styling: grayed out with opacity
- Lock icon shown on locked tabs
- Tooltip on hover: "Please set BLGF Notice Date in Timeline tab first"

---

## 🚀 NEXT STEPS

### 3. Calculate Progress for All 4 Tabs
**File**: `frontend/src/pages/SMVMonitoringPage.jsx`

**Update** `tableData` useMemo to calculate:

```javascript
// Tab 1 Progress: Timeline (1/1 if BLGF Notice filled)
const tab1Progress = monitoring.timeline?.blgfNoticeDate ? 100 : 0;

// Tab 2 Progress: Development activities (existing logic)
const devActivities = Object.values(stageMap).flat();
const devCompleted = devActivities.filter(a => a.status === "Completed").length;
const tab2Progress = devActivities.length > 0 
  ? Math.round((devCompleted / devActivities.length) * 100)
  : 0;

// Tab 3 Progress: Proposed Publication activities
const proposedAct = monitoring.proposedPublicationActivities || [];
const proposedCompleted = proposedAct.filter(a => a.status === "Completed").length;
const tab3Progress = proposedAct.length > 0
  ? Math.round((proposedCompleted / proposedAct.length) * 100)
  : 0;

// Tab 4 Progress: Review & Publication activities
const reviewAct = monitoring.reviewPublicationActivities || [];
const reviewCompleted = reviewAct.filter(a => a.status === "Completed").length;
const tab4Progress = reviewAct.length > 0
  ? Math.round((reviewCompleted / reviewAct.length) * 100)
  : 0;

// Add to rowData:
return {
  ...rowData,
  tab1Progress,
  tab2Progress,
  tab3Progress,
  tab4Progress,
  overallProgress: Math.round(
    (tab1Progress * 0.1) +
    (tab2Progress * 0.6) +
    (tab3Progress * 0.2) +
    (tab4Progress * 0.1)
  )
};
```

### 4. Update Table to Use SMVProgressBar
**Files**: 
- `frontend/src/components/smv/SMVCompactTable.jsx`
- `frontend/src/components/smv/SMVSummaryTable.jsx`

**Replace**:
```javascript
// OLD:
<progress className="progress progress-primary" value={row.totalPercent} max="100" />
<span>{row.totalPercent}%</span>

// NEW:
import SMVProgressBar from './SMVProgressBar';

<SMVProgressBar
  tab1Progress={row.tab1Progress}
  tab2Progress={row.tab2Progress}
  tab3Progress={row.tab3Progress}
  tab4Progress={row.tab4Progress}
/>
```

### 5. Update Stage Column Display
**Current**: Shows `monitoring.overallStatus` (e.g., "Preparatory")

**New Logic**:
```javascript
const determineCurrentStage = (row) => {
  // If Timeline not complete, show that first
  if (!row.tab1Progress) {
    return "Timeline Setup";
  }
  
  // If Dev tab in progress, show current dev stage
  if (row.tab2Progress > 0 && row.tab2Progress < 100) {
    // Find first incomplete stage in stageMap
    for (const [stage, activities] of Object.entries(row.stageMap)) {
      const completed = activities.filter(a => a.status === "Completed").length;
      if (completed < activities.length) {
        return `Dev - ${stage}`;
      }
    }
  }
  
  // If Dev complete, check Proposed Pub
  if (row.tab2Progress === 100 && row.tab3Progress < 100) {
    return "Proposed Publication";
  }
  
  // If Proposed complete, check Review
  if (row.tab3Progress === 100 && row.tab4Progress < 100) {
    return "Review & Publication";
  }
  
  // All complete
  if (row.tab4Progress === 100) {
    return "Completed ✅";
  }
  
  return "In Progress";
};
```

### 6. Update Stats Cards
**File**: `frontend/src/components/smv/SMVStatsCards.jsx`

**Add new stats**:
- Average Tab 1 completion
- Average Tab 2 completion  
- Average Tab 3 completion
- Average Tab 4 completion
- LGUs with Timeline set vs not set

---

## 📊 Visual Examples

### Progress Bar Display:
```
Main Table Row for "Tandag City":

Progress Column:
┌──────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░  45%  │  ← Overall (weighted)
│ [█][███████░░][██░░][░]          │  ← 4 segments (hover to see %)
└──────────────────────────────────┘
Hover: "Timeline: 100% | Dev: 60% | Proposed: 25% | Review: 0%"

Stage Column:
"Dev - Data Collection"
```

### Modal Tab Navigation:
```
When BLGF Notice Date is NOT set:
┌───────────┬────────────────────────────────────────┬────────────────────┬──────────────────┐
│ Timeline  │ 🔒 Development (grayed out, disabled) │ 🔒 Proposed (lock) │ 🔒 Review (lock) │
└───────────┴────────────────────────────────────────┴────────────────────┴──────────────────┘
Hover over locked tab: "Please set BLGF Notice Date in Timeline tab first"

When BLGF Notice Date IS set:
┌───────────┬────────────────┬───────────────┬──────────────────┐
│ Timeline  │ Development    │ Proposed Pub. │ Review & Pub.    │
└───────────┴────────────────┴───────────────┴──────────────────┘
All tabs clickable
```

---

## 🎯 User Experience Flow

1. **User opens SMV modal for an LGU**
   - Only Timeline tab is accessible
   - Other tabs are grayed out with lock icons
   
2. **User fills BLGF Notice Date in Timeline tab**
   - All tabs unlock immediately
   - Modal shows feedback (could add toast: "Other tabs now unlocked!")
   
3. **User switches between tabs**
   - Each tab has its own completion tracking
   - Changes in any tab set `hasChanges` flag
   
4. **User clicks "Save All Changes"**
   - All 4 tabs' data saved together
   - Table updates to show new progress bars
   
5. **User sees updated table**
   - Segmented progress bar shows visual breakdown
   - Stage column shows where they are in the process
   - Hover reveals exact percentages

---

## 🔧 Implementation Order

1. ✅ Create SMVProgressBar component
2. ✅ Add tab locking to modal
3. ⏳ Calculate 4-tab progress in SMVMonitoringPage.jsx
4. ⏳ Update SMVCompactTable to use new progress bar
5. ⏳ Update SMVSummaryTable to use new progress bar
6. ⏳ Update Stage column logic
7. ⏳ Test with real data
8. ⏳ Update stats cards (optional enhancement)

---

## 📝 Testing Checklist

- [ ] Timeline tab always accessible
- [ ] Other tabs locked when no BLGF Notice Date
- [ ] Other tabs unlock when BLGF Notice Date is set
- [ ] Tooltip appears on hover over locked tabs
- [ ] Tab 1 progress: 0% when empty, 100% when filled
- [ ] Tab 2 progress: Calculates from stageMap activities
- [ ] Tab 3 progress: Calculates from proposedPublicationActivities
- [ ] Tab 4 progress: Calculates from reviewPublicationActivities
- [ ] Segmented progress bar displays correctly
- [ ] Hover tooltip shows all 4 percentages
- [ ] Stage column shows current active stage
- [ ] Overall progress uses weighted average
- [ ] Saves all tabs data correctly
- [ ] Page refresh preserves progress state

---

Ready to implement steps 3-6! Let me know when to proceed.
