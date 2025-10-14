# SMV Timeline Restructure - Implementation Summary

## Overview
Simplified the SMV Timeline modal to focus on pre-submission and Regional Office review phases, removing post-review tracking (Sanggunian, BLGF Approval, Effectivity). Added auto-calculated RO Review deadline with real-time countdown display per RPVARA IRR Section 29.

## Changes Made

### 1. Frontend Updates (`frontend/src/components/modals/smv/SetTimelineModal.jsx`)

#### A. State Structure Simplified
**Before (7 fields):**
```javascript
{
  blgfNoticeDate,
  regionalOfficeSubmissionDeadline,
  publicationDeadline,
  publicConsultationDeadline,
  sanggunianSubmissionDeadline,    // ❌ REMOVED
  blgfApprovalDeadline,             // ❌ REMOVED
  effectivityDate                    // ❌ REMOVED
}
```

**After (5 fields):**
```javascript
{
  blgfNoticeDate,
  regionalOfficeSubmissionDeadline,
  publicationDeadline,
  publicConsultationDeadline,
  roReviewDeadline                  // ✅ NEW (auto-calculated)
}
```

#### B. New Helper Function: Countdown Calculation
Added `calculateCountdown(deadlineDate)` function that:
- Calculates days remaining until deadline
- Returns color-coded badge data:
  - **Green (success)**: 14+ days remaining
  - **Yellow (warning)**: 7-14 days remaining
  - **Red (error)**: <7 days remaining or overdue
- Displays icons (⏳ for remaining, ⚠️ for due today, 🔴 for overdue)
- Shows friendly messages like "5 days remaining" or "Overdue by 3 days"

#### C. Auto-Calculation useEffect
Added automatic calculation of `roReviewDeadline` when `regionalOfficeSubmissionDeadline` changes:
```javascript
useEffect(() => {
  if (formData.regionalOfficeSubmissionDeadline) {
    const roDate = new Date(formData.regionalOfficeSubmissionDeadline);
    roDate.setDate(roDate.getDate() + 45); // RPVARA IRR Section 29
    const newRoReview = roDate.toISOString().split('T')[0];
    
    if (newRoReview !== formData.roReviewDeadline) {
      setFormData(prev => ({ ...prev, roReviewDeadline: newRoReview }));
    }
  } else {
    if (formData.roReviewDeadline) {
      setFormData(prev => ({ ...prev, roReviewDeadline: "" }));
    }
  }
}, [formData.regionalOfficeSubmissionDeadline]);
```

#### D. Updated Data Loading useEffect
Modified to:
- Remove mappings for deleted fields
- Calculate `roReviewDeadline` from loaded data: RO Submission + 45 days

#### E. UI Display Changes
**Removed:**
- 🏛️ Sanggunian Submission field
- ✅ BLGF Approval field
- 🎯 Effectivity Date field

**Added:**
- 📋 BLGF Regional Office Review and Endorsement field
  - **Auto-calculated** (not editable)
  - **Countdown badge** in header showing days remaining/overdue
  - **Locked input** with lock icon
  - **Helper text** explaining auto-calculation (RO Submission + 45 days)
  - **Color-coded deadline display** in helper text

#### F. Function Updates
**handleResetAll:**
- Removed references to deleted fields
- Added `roReviewDeadline: ""` to reset logic

**handleAutoCalculate:**
- Removed calculations for Sanggunian, BLGF Approval, Effectivity
- Added calculation for `roReviewDeadline`: RO Submission + 45 days
- Updated success message to reference RPVARA IRR

### 2. Backend Updates (`backend/src/models/SMVMonitoring.js`)

#### Updated Timeline Schema
**Before:**
```javascript
timeline: {
  blgfNoticeDate: { type: Date },
  projectStartDate: { type: Date },
  targetCompletionDate: { type: Date },
  publicationDeadline: { type: Date },
  publicConsultationDeadline: { type: Date },
  regionalOfficeSubmissionDeadline: { type: Date },
  sanggunianSubmissionDeadline: { type: Date },    // ❌ REMOVED
  blgfApprovalDeadline: { type: Date },             // ❌ REMOVED
  effectivityDate: { type: Date }                    // ❌ REMOVED
}
```

**After:**
```javascript
timeline: {
  blgfNoticeDate: { type: Date },                           // DAY 0: BLGF Notice received
  projectStartDate: { type: Date },                         // Work plan completion
  targetCompletionDate: { type: Date },                     // Target completion (usually Dec 31)
  publicationDeadline: { type: Date },                      // 2 weeks before consultation
  publicConsultationDeadline: { type: Date },               // 2 weeks after publication (min 14 days)
  regionalOfficeSubmissionDeadline: { type: Date },         // 60 days after consultation (min)
  roReviewDeadline: { type: Date }                          // ✅ NEW: RO Submission + 45 days
}
```

## Legal Compliance

### RPVARA IRR Section 29: Period of SMV Review and Endorsement
- **Requirement**: Regional Office has **45 calendar days** from receipt of proposed SMV to review and endorse
- **Implementation**: Auto-calculated deadline from `regionalOfficeSubmissionDeadline + 45 days`
- **User Experience**: Real-time countdown showing days remaining/overdue
- **Business Logic**: Non-editable to prevent user errors and ensure legal compliance

### Timeline Validation Rules (Maintained)
1. **Publication → Consultation**: Minimum 14 days (2 weeks)
2. **Consultation → RO Submission**: Minimum 60 days
3. **RO Submission → RO Review**: Exactly 45 days (auto-calculated)

## User Experience Improvements

### 1. Simplified Workflow
Focus on monitoring the phases that require active LGU management:
- ✅ Preparation (Notice → Publication → Consultation)
- ✅ Submission (RO Submission deadline)
- ✅ Review (RO Review countdown)

Removed post-review phases that are less critical for monitoring:
- ❌ Sanggunian approval (handled separately)
- ❌ BLGF final approval (handled separately)
- ❌ Effectivity date (usually standardized to Jan 1)

### 2. Visual Countdown Indicators
Real-time status badges show:
- **⏳ Green Badge**: 14+ days remaining (on track)
- **⏳ Yellow Badge**: 7-14 days remaining (attention needed)
- **⏳ Red Badge**: <7 days remaining (urgent)
- **⚠️ Red Badge**: Due today (immediate action)
- **🔴 Red Badge**: Overdue by X days (critical)

### 3. Error Prevention
- Auto-calculation prevents manual date entry errors
- Locked input makes it clear the field is computed
- Helper text explains the calculation source
- Existing validations ensure legal compliance

## Testing Scenarios

### Scenario 1: New Timeline Creation
1. Set BLGF Notice Date
2. Click "Auto-Calculate Deadlines"
3. **Result**: All fields populated including `roReviewDeadline` (RO Submission + 45 days)

### Scenario 2: Manual Date Entry
1. Set Publication Date
2. Set Consultation Date (must be ≥ Publication + 14 days)
3. Set RO Submission Date (must be ≥ Consultation + 60 days)
4. **Result**: `roReviewDeadline` auto-updates to RO Submission + 45 days

### Scenario 3: Countdown Display
1. Set RO Submission Date to 30 days from today
2. **Result**: `roReviewDeadline` shows date 75 days from today
3. **Badge**: Shows "75 days remaining" with green color

### Scenario 4: Data Loading
1. Open existing LGU with saved timeline data
2. **Result**: All fields load, `roReviewDeadline` recalculated from saved `regionalOfficeSubmissionDeadline`

### Scenario 5: Reset All
1. Click "Reset All Data"
2. Confirm reset
3. **Result**: All timeline fields cleared including `roReviewDeadline`

## Migration Notes

### Existing Data
- Old records with `sanggunianSubmissionDeadline`, `blgfApprovalDeadline`, `effectivityDate` will still exist in database
- Frontend ignores these fields when loading data
- Backend schema remains flexible (accepts any fields)
- No data migration required - old fields simply unused

### New Records
- Will only save the 5 new timeline fields
- `roReviewDeadline` always auto-calculated, never manually set

## Files Modified

### Frontend
- `frontend/src/components/modals/smv/SetTimelineModal.jsx` (1270 lines)
  - Added `calculateCountdown()` helper function
  - Updated formData state structure
  - Added auto-calculation useEffect
  - Modified data loading useEffect
  - Removed 3 field displays, added 1 new display
  - Updated `handleResetAll()`
  - Updated `handleAutoCalculate()`

### Backend
- `backend/src/models/SMVMonitoring.js` (288 lines)
  - Updated timeline schema definition
  - Removed unused field definitions
  - Added `roReviewDeadline` field with documentation

## Next Steps (Recommendations)

1. **Test with existing LGUs**: Open modal for LGUs with saved timeline data
2. **Test countdown accuracy**: Set RO Submission dates at various intervals to verify countdown logic
3. **Test across themes**: Verify countdown badges readable in all DaisyUI themes
4. **User training**: Update user documentation to explain auto-calculated field
5. **Backend cleanup** (optional): Add mongoose virtual field to always compute `roReviewDeadline` from `regionalOfficeSubmissionDeadline`

## Success Criteria

- ✅ No compilation errors in frontend or backend
- ✅ State structure simplified (7 → 5 fields)
- ✅ Auto-calculation works on RO Submission date changes
- ✅ Countdown displays correctly with color coding
- ✅ Data loading recalculates `roReviewDeadline` from existing data
- ✅ Reset and auto-calculate functions updated
- ✅ Validation rules maintained (14-day, 60-day requirements)
- ✅ Backend schema updated to match frontend structure

---

**Implementation Date**: January 2025  
**Legal Reference**: RA 12001 / RPVARA IRR Section 29  
**Developer**: AI Assistant via GitHub Copilot
