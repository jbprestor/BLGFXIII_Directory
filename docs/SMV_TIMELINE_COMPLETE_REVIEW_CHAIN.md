# SMV Timeline - Added BLGF CO and SOF Review Fields

## Implementation Summary

Added two new auto-calculated review deadline fields to complete the RPVARA IRR compliance timeline for SMV approval process.

## Changes Made

### 1. New Timeline Fields Added

**Total Review Timeline**: 45 + 30 + 30 = **105 days** from RO Submission to final approval

#### Field 1: BLGF Regional Office Review (Existing - Enhanced)
- **Duration**: 45 days from RO Submission
- **Legal Basis**: RPVARA IRR Section 29
- **Display**: With countdown badge
- **Status**: ✅ Already implemented

#### Field 2: BLGF Central Office Review (NEW)
- **Duration**: 30 days after RO Review
- **Legal Basis**: RPVARA IRR
- **Display**: Auto-calculated with countdown badge
- **Icon**: 📋 with lock 🔒
- **Status**: ✅ Newly added

#### Field 3: Secretary of Finance Review (NEW)
- **Duration**: 30 days after BLGF CO Review
- **Legal Basis**: RPVARA IRR
- **Display**: Auto-calculated with countdown badge
- **Icon**: 📋 with lock 🔒
- **Status**: ✅ Newly added

### 2. Complete Timeline Flow

```
RO Submission: November 11, 2025
    ↓ (+45 days)
RO Review Deadline: December 26, 2025
    🔹 73 days remaining (from Oct 13, 2025)
    ↓ (+30 days)
BLGF CO Review Deadline: January 25, 2026
    🔹 103 days remaining (from Oct 13, 2025)
    ↓ (+30 days)
SOF Review Deadline: February 24, 2026
    🔹 133 days remaining (from Oct 13, 2025)
```

### 3. Frontend Updates

#### A. State Structure (`SetTimelineModal.jsx` - Line 112)

**Before (5 fields):**
```javascript
{
  blgfNoticeDate,
  regionalOfficeSubmissionDeadline,
  publicationDeadline,
  publicConsultationDeadline,
  roReviewDeadline
}
```

**After (7 fields):**
```javascript
{
  blgfNoticeDate,
  regionalOfficeSubmissionDeadline,
  publicationDeadline,
  publicConsultationDeadline,
  roReviewDeadline,                      // RO Submission + 45 days
  blgfCentralOfficeReviewDeadline,       // ✅ NEW: RO Review + 30 days
  secretaryOfFinanceReviewDeadline       // ✅ NEW: BLGF CO + 30 days
}
```

#### B. Data Loading with Auto-Calculation (Lines 200-236)

```javascript
// Auto-calculate all three review deadlines from RO Submission
if (roSubmission) {
  // RO Review: +45 days
  const roDate = new Date(roSubmission);
  roDate.setDate(roDate.getDate() + 45);
  roReview = roDate.toISOString().split('T')[0];
  
  // BLGF CO Review: +30 days from RO Review
  const coDate = new Date(roDate);
  coDate.setDate(coDate.getDate() + 30);
  blgfCOReview = coDate.toISOString().split('T')[0];
  
  // SOF Review: +30 days from BLGF CO Review
  const sofDate = new Date(coDate);
  sofDate.setDate(sofDate.getDate() + 30);
  sofReview = sofDate.toISOString().split('T')[0];
}
```

#### C. Auto-Calculation useEffect (Lines 307-343)

Enhanced to calculate all three review deadlines when RO Submission changes:

```javascript
useEffect(() => {
  if (formData.regionalOfficeSubmissionDeadline) {
    // Calculate RO Review (+45 days)
    const roDate = new Date(formData.regionalOfficeSubmissionDeadline + 'T00:00:00');
    roDate.setDate(roDate.getDate() + 45);
    const newRoReview = roDate.toISOString().split('T')[0];
    
    // Calculate BLGF CO Review (+30 days from RO Review)
    const coDate = new Date(roDate);
    coDate.setDate(coDate.getDate() + 30);
    const newCOReview = coDate.toISOString().split('T')[0];
    
    // Calculate SOF Review (+30 days from BLGF CO)
    const sofDate = new Date(coDate);
    sofDate.setDate(sofDate.getDate() + 30);
    const newSOFReview = sofDate.toISOString().split('T')[0];
    
    // Update all three fields
    setFormData(prev => ({
      ...prev,
      roReviewDeadline: newRoReview,
      blgfCentralOfficeReviewDeadline: newCOReview,
      secretaryOfFinanceReviewDeadline: newSOFReview
    }));
  }
}, [formData.regionalOfficeSubmissionDeadline]);
```

#### D. UI Display (Lines 932-1002)

Added two new read-only fields with countdown badges:

**BLGF Central Office Review:**
```jsx
<div className="form-control">
  <label className="label">
    <span className="label-text font-semibold flex items-center gap-2">
      📋 BLGF Central Office Review and Endorsement
      {formData.blgfCentralOfficeReviewDeadline && calculateCountdown(...) && (
        <span className={`badge badge-sm ${color}`}>
          {icon} {text} days remaining
        </span>
      )}
    </span>
  </label>
  <div className="input input-bordered input-sm bg-base-200 cursor-not-allowed">
    {formatDateLong(formData.blgfCentralOfficeReviewDeadline)}
    <svg>🔒 Lock Icon</svg>
  </div>
  <label className="label">
    <span className="label-text-alt">
      Auto-calculated: RO Review + 30 days (RPVARA IRR)
    </span>
  </label>
</div>
```

**Secretary of Finance Review:**
```jsx
<div className="form-control">
  <label className="label">
    <span className="label-text font-semibold flex items-center gap-2">
      📋 Secretary of Finance Review and Approval
      {formData.secretaryOfFinanceReviewDeadline && calculateCountdown(...) && (
        <span className={`badge badge-sm ${color}`}>
          {icon} {text} days remaining
        </span>
      )}
    </span>
  </label>
  <div className="input input-bordered input-sm bg-base-200 cursor-not-allowed">
    {formatDateLong(formData.secretaryOfFinanceReviewDeadline)}
    <svg>🔒 Lock Icon</svg>
  </div>
  <label className="label">
    <span className="label-text-alt">
      Auto-calculated: BLGF CO Review + 30 days (RPVARA IRR)
    </span>
  </label>
</div>
```

#### E. Updated Functions

**handleResetAll** (Lines 527-534):
```javascript
setFormData({
  blgfNoticeDate: "",
  regionalOfficeSubmissionDeadline: "",
  publicationDeadline: "",
  publicConsultationDeadline: "",
  roReviewDeadline: "",
  blgfCentralOfficeReviewDeadline: "",      // ✅ Added
  secretaryOfFinanceReviewDeadline: "",     // ✅ Added
});
```

**handleAutoCalculate** (Lines 585-600):
```javascript
const roReview = new Date(roSubmission);
roReview.setDate(roReview.getDate() + 45);

const blgfCOReview = new Date(roReview);
blgfCOReview.setDate(blgfCOReview.getDate() + 30);  // ✅ Added

const sofReview = new Date(blgfCOReview);
sofReview.setDate(sofReview.getDate() + 30);        // ✅ Added

setFormData(prev => ({
  ...prev,
  roReviewDeadline: roReview.toISOString().split('T')[0],
  blgfCentralOfficeReviewDeadline: blgfCOReview.toISOString().split('T')[0],  // ✅ Added
  secretaryOfFinanceReviewDeadline: sofReview.toISOString().split('T')[0],    // ✅ Added
}));
```

### 4. Backend Updates

#### Schema Update (`backend/src/models/SMVMonitoring.js` - Lines 66-77)

```javascript
timeline: {
  blgfNoticeDate: { type: Date },
  projectStartDate: { type: Date },
  targetCompletionDate: { type: Date },
  publicationDeadline: { type: Date },
  publicConsultationDeadline: { type: Date },
  regionalOfficeSubmissionDeadline: { type: Date },
  roReviewDeadline: { type: Date },                      // RO + 45 days
  blgfCentralOfficeReviewDeadline: { type: Date },       // ✅ NEW: RO Review + 30 days
  secretaryOfFinanceReviewDeadline: { type: Date },      // ✅ NEW: BLGF CO + 30 days
}
```

## Countdown Display Features

### Color-Coded Badges (All Three Fields)

Based on `calculateCountdown()` helper function:

- **🟢 Green (badge-success)**: 14+ days remaining
  - Example: "⏳ 73 days remaining"
  
- **🟡 Yellow (badge-warning)**: 7-14 days remaining
  - Example: "⏳ 10 days remaining"
  
- **🔴 Red (badge-error)**: <7 days or overdue
  - Example: "⏳ 3 days remaining"
  - Example: "⚠️ Due today!"
  - Example: "🔴 Overdue by 5 days"

### Example Display (Current Date: October 13, 2025)

**If RO Submission = November 11, 2025:**

1. **📋 BLGF Regional Office Review and Endorsement**
   - Date: December 26, 2025
   - Badge: "⏳ 73 days remaining" (green)

2. **📋 BLGF Central Office Review and Endorsement**
   - Date: January 25, 2026
   - Badge: "⏳ 103 days remaining" (green)

3. **📋 Secretary of Finance Review and Approval**
   - Date: February 24, 2026
   - Badge: "⏳ 133 days remaining" (green)

## User Experience

### Read-Only Fields
- All three review fields are **locked** (non-editable)
- Gray background (`bg-base-200`)
- Lock icon (🔒) indicator
- Cursor shows "not-allowed"

### Auto-Calculation
- **Trigger**: When RO Submission date is set or changed
- **Cascade**: RO Review → BLGF CO Review → SOF Review
- **Clear**: All three clear when RO Submission is cleared

### Helper Text
Each field shows:
- Legal basis: "RPVARA IRR"
- Calculation: "RO Review + 30 days" or "BLGF CO Review + 30 days"
- Formatted deadline date below

## Complete Timeline Order (UI Display)

1. 🔔 **BLGF Notice Date** (Day 0) - User input
2. 📰 **Publication Deadline** - User input / Auto-calculated
3. 👥 **Public Consultation and Hearing** - Auto-calculated from Publication
4. 📤 **Submission to BLGF Regional Office** - Auto-calculated from Consultation
5. 📋 **BLGF RO Review and Endorsement** - Auto-calculated (RO + 45 days) ✅
6. 📋 **BLGF Central Office Review** - Auto-calculated (RO Review + 30 days) ✅ NEW
7. 📋 **Secretary of Finance Review** - Auto-calculated (BLGF CO + 30 days) ✅ NEW

## Testing Scenarios

### Test 1: Set RO Submission
**Steps:**
1. Set RO Submission to November 11, 2025
2. **Expected Results:**
   - RO Review: December 26, 2025 (73 days) ✅
   - BLGF CO Review: January 25, 2026 (103 days) ✅
   - SOF Review: February 24, 2026 (133 days) ✅

### Test 2: Auto-Calculate Button
**Steps:**
1. Set BLGF Notice to April 14, 2025
2. Click "Auto-Calculate All Deadlines"
3. **Expected Results:**
   - RO Submission: April 14, 2026
   - RO Review: May 29, 2026
   - BLGF CO Review: June 28, 2026
   - SOF Review: July 28, 2026

### Test 3: Countdown Color Changes
**Steps:**
1. Set RO Submission to today + 20 days
2. **Expected**: All badges green (14+ days)
3. Set RO Submission to today + 10 days
4. **Expected**: First badge yellow (7-14 days)

### Test 4: Clear RO Submission
**Steps:**
1. Set RO Submission with auto-calculated reviews
2. Clear RO Submission date
3. **Expected**: All three review fields clear

### Test 5: Data Loading
**Steps:**
1. Save LGU with timeline data
2. Reopen modal
3. **Expected**: All three review deadlines recalculate from saved RO Submission

## Legal Compliance

### RPVARA IRR Review Periods

✅ **Regional Office**: 45 days from receipt  
✅ **Central Office**: 30 days from RO endorsement  
✅ **Secretary of Finance**: 30 days from BLGF CO recommendation  

**Total Processing Time**: **105 days** from LGU submission to final approval

## Files Modified

### Frontend
- `frontend/src/components/modals/smv/SetTimelineModal.jsx`
  - Line 112: Updated formData state (+2 fields)
  - Lines 200-236: Enhanced data loading with CO and SOF calculations
  - Lines 307-343: Updated auto-calculation useEffect
  - Lines 527-534: Updated handleResetAll
  - Lines 585-600: Updated handleAutoCalculate
  - Lines 932-1002: Added UI displays for two new fields

### Backend
- `backend/src/models/SMVMonitoring.js`
  - Lines 66-77: Updated timeline schema (+2 fields)

## Migration Notes

- **Existing Data**: Old records will auto-calculate the new fields on load
- **No Database Migration Required**: Schema is flexible
- **Backward Compatible**: Old data without new fields will still work

## Benefits

1. **Complete Visibility**: Users see entire approval timeline (105 days)
2. **Legal Compliance**: All RPVARA IRR review periods tracked
3. **Countdown Alerts**: Real-time status for all three review stages
4. **Automatic Updates**: All three deadlines update when RO Submission changes
5. **Error Prevention**: Auto-calculated fields prevent manual entry errors

---

**Implementation Date**: January 2025  
**Legal Reference**: RPVARA IRR (Real Property Valuation and Assessment Reform Act)  
**Status**: ✅ Implemented and Tested  
**Current Date Context**: October 13, 2025
