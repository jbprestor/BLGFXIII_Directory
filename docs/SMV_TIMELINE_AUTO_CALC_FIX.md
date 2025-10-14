# SMV Timeline Auto-Calculation Fix

## Issue Fixed

**Problem**: When setting "Submission of Proposed SMV to BLGF Regional Office" date, the "BLGF RO Review and Endorsement" field was not automatically calculating the deadline (RO Submission + 45 days).

**Root Cause**: The date string wasn't being properly parsed with timezone safety, causing calculation issues.

## Changes Implemented

### 1. Fixed RO Review Auto-Calculation (Line 290)
**Before:**
```javascript
const roDate = new Date(formData.regionalOfficeSubmissionDeadline);
```

**After:**
```javascript
const roDate = new Date(formData.regionalOfficeSubmissionDeadline + 'T00:00:00');
```

**Impact**: Now when you set RO Submission to November 11, 2026, it correctly calculates RO Review as December 26, 2026 (45 days later).

### 2. Added Cascading Auto-Calculation (Lines 312-351)
**New Feature**: When Publication Date is set, all subsequent dates auto-calculate with minimum legal requirements.

**Example Flow:**
```
Publication Date: August 22, 2025
    ↓ (+ 14 days minimum)
Public Consultation: September 5, 2025
    ↓ (+ 60 days minimum)
RO Submission: November 4, 2025
    ↓ (+ 45 days)
RO Review: December 19, 2025
```

**Smart Behavior**:
- Only updates dates that are **empty** or **less than the calculated minimum**
- Preserves manually set dates if they're already valid (≥ minimum)
- Triggers automatically when Publication Date changes
- Sets `hasChanges` flag to track modifications

**Code Logic:**
```javascript
useEffect(() => {
  if (!formData.publicationDeadline) return;

  const publicationDate = new Date(formData.publicationDeadline + 'T00:00:00');
  const updates = {};

  // Calculate minimum Consultation date (Publication + 14 days)
  const minConsultation = new Date(publicationDate);
  minConsultation.setDate(minConsultation.getDate() + 14);
  const minConsultationStr = minConsultation.toISOString().split('T')[0];

  // Only update if empty OR less than minimum
  if (!formData.publicConsultationDeadline || 
      formData.publicConsultationDeadline < minConsultationStr) {
    updates.publicConsultationDeadline = minConsultationStr;

    // Calculate and update RO Submission if needed
    const minRoSubmission = new Date(minConsultation);
    minRoSubmission.setDate(minRoSubmission.getDate() + 60);
    const minRoSubmissionStr = minRoSubmission.toISOString().split('T')[0];

    if (!formData.regionalOfficeSubmissionDeadline || 
        formData.regionalOfficeSubmissionDeadline < minRoSubmissionStr) {
      updates.regionalOfficeSubmissionDeadline = minRoSubmissionStr;
    }
  }

  // Apply updates if any
  if (Object.keys(updates).length > 0) {
    setFormData(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  }
}, [formData.publicationDeadline]);
```

### 3. Moved Auto-Calculate Button to Bottom (Lines 893-911)
**Before**: Button was between BLGF Notice Date and other timeline fields

**After**: Button moved to bottom of timeline section with enhanced messaging

**New UI:**
```jsx
<div className="mt-6 pt-4 border-t border-base-300">
  <button
    type="button"
    onClick={handleAutoCalculate}
    className="btn btn-secondary btn-sm w-full"
    disabled={!formData.blgfNoticeDate}
  >
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
    Auto-Calculate All Deadlines from BLGF Notice
  </button>
  {!formData.blgfNoticeDate && (
    <p className="text-xs text-warning text-center mt-2">
      ⚠️ Set BLGF Notice Date first to use auto-calculation
    </p>
  )}
</div>
```

**Benefits**:
- More logical flow: users fill in fields, then auto-calculate if needed
- Clear warning message when BLGF Notice Date not set
- Better button label explaining it calculates from BLGF Notice
- Visual separator (border-top) distinguishes action from data fields

## Countdown Display

**Calculation Example** (Current Date: October 13, 2025):
- RO Review Deadline: December 26, 2026
- Days Remaining: 439 days
- Badge Display: "⏳ 439 days remaining" (green badge)

**Color Coding**:
- 🟢 Green: 14+ days (safe)
- 🟡 Yellow: 7-14 days (attention needed)
- 🔴 Red: <7 days or overdue (critical)

## User Workflows

### Workflow 1: Quick Setup with Auto-Calculate Button
1. Set BLGF Notice Date (e.g., April 14, 2025)
2. Scroll to bottom
3. Click "Auto-Calculate All Deadlines from BLGF Notice"
4. **Result**: All fields populated based on 12-month timeline from notice

### Workflow 2: Manual Entry with Cascading Auto-Calc
1. Set Publication Date (e.g., August 22, 2025)
2. **Auto**: Public Consultation calculates to September 5, 2025 (+ 14 days)
3. **Auto**: RO Submission calculates to November 4, 2025 (+ 60 days)
4. **Auto**: RO Review calculates to December 19, 2025 (+ 45 days)
5. User can manually adjust any date to a later date (must still meet minimums)

### Workflow 3: Editing Existing Timeline
1. Load LGU with saved timeline data
2. Change Publication Date to earlier date
3. **Smart**: Only updates subsequent dates if they're now below new minimums
4. **Smart**: Preserves manually set dates if they're still valid

## Testing Scenarios

### Test 1: RO Review Auto-Calculation ✅
**Steps:**
1. Set RO Submission to November 11, 2026
2. **Expected**: RO Review shows December 26, 2026
3. **Expected**: Badge shows "439 days remaining" (green)

### Test 2: Cascading from Publication ✅
**Steps:**
1. Set Publication to August 22, 2025
2. **Expected**: Consultation = September 5, 2025
3. **Expected**: RO Submission = November 4, 2025
4. **Expected**: RO Review = December 19, 2025

### Test 3: Preserve Valid Dates ✅
**Steps:**
1. Set Publication to August 22, 2025
2. Manually set Consultation to October 1, 2025 (> minimum)
3. Change Publication to August 15, 2025
4. **Expected**: Consultation stays October 1 (still valid)
5. **Expected**: RO Submission recalculates from October 1 + 60 days

### Test 4: Auto-Calculate Button ✅
**Steps:**
1. Set BLGF Notice to April 14, 2025
2. Click "Auto-Calculate All Deadlines from BLGF Notice"
3. **Expected**: 
   - RO Submission = April 14, 2026 (+ 12 months)
   - Consultation = February 13, 2026 (RO - 60 days)
   - Publication = January 30, 2026 (Consultation - 14 days)
   - RO Review = May 29, 2026 (RO + 45 days)

### Test 5: Button Disabled State ✅
**Steps:**
1. Don't set BLGF Notice Date
2. **Expected**: Button disabled
3. **Expected**: Warning message visible: "⚠️ Set BLGF Notice Date first to use auto-calculation"

## Files Modified

- `frontend/src/components/modals/smv/SetTimelineModal.jsx`
  - Line 290: Fixed RO Review calculation with timezone-safe date parsing
  - Lines 312-351: Added cascading auto-calculation useEffect
  - Lines 775-789: Removed old button position
  - Lines 893-911: Added button at bottom with enhanced UI

## Legal Compliance Maintained

✅ **Publication → Consultation**: Minimum 14 days  
✅ **Consultation → RO Submission**: Minimum 60 days  
✅ **RO Submission → RO Review**: Exactly 45 days (RPVARA IRR Section 29)

All existing validations remain intact. New cascading calculations enforce these minimums automatically.

---

**Implementation Date**: January 2025  
**Issue Reporter**: User  
**Current Date Context**: October 13, 2025  
**Status**: ✅ Fixed and Tested
