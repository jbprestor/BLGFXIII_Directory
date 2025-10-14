# How to Set Timeline Dates for Each LGU

## 📋 Overview

Each LGU receives their BLGF Notice on different dates, so timeline dates must be set individually for accurate Day 0 tracking.

---

## 🎯 Steps to Set Timeline

### **1. Navigate to SMV Monitoring Page**
- Go to: **SMV Monitoring → Table View**

### **2. Locate the LGU**
- Use search/filters to find the specific LGU
- Each row represents one Province/City

### **3. Click "Set Timeline" Button**
- Look for the calendar icon (📅) button in the Actions column
- **Note**: Only visible to Admin users

### **4. Set BLGF Notice Date (Day 0)**
- Enter the date when BLGF issued the notice
- Example: **April 14, 2025**
- This is the most important field (required)

### **5. Auto-Calculate or Manual Entry**

#### **Option A: Auto-Calculate (Recommended)**
1. After entering BLGF Notice Date
2. Click **"Auto-Calculate All Deadlines"**
3. System generates all dates based on RA 12001:
   - RO Submission: **12 months** from notice
   - Public Consultation: **60 days** before RO
   - Publication: **2 weeks** before consultation
   - Sanggunian: **30 days** before BLGF approval
   - BLGF Approval: **30 days** before effectivity
   - Effectivity: **January 1** of next year

#### **Option B: Manual Entry**
- Set each deadline individually
- Useful for custom timelines or adjustments

### **6. Save Timeline**
- Click **"Save Timeline"** button
- Timeline immediately updates
- Day count starts tracking from Day 0

---

## 📊 What Happens After Setting Timeline

### **Automatic Calculations:**
1. **Day Count**: "Day 0", "Day 1", "Day 180", etc.
2. **Deadline Tracking**: Days until next deadline
3. **Compliance Status**: On Track, At Risk, Delayed, Overdue
4. **Alerts**: Warning notifications for approaching deadlines

### **Visual Indicators:**
- 🟢 **Green (30+ days)**: Safe, on schedule
- 🟡 **Yellow (<30 days)**: Urgent, deadline near
- 🔴 **Red ⏰**: Overdue, past deadline

### **Example Display:**
```
Butuan City
Day 180      ← 180 days since April 14, 2025
185d 📅      ← 185 days until RO Submission
RO Submission ← Next critical deadline
```

---

## 🔄 Updating Timeline

### **To Modify Dates:**
1. Click "Set Timeline" button again
2. Existing dates will pre-populate
3. Change any field
4. Click "Save Timeline"

### **To Recalculate:**
1. Update BLGF Notice Date if incorrect
2. Click "Auto-Calculate" to regenerate all dates
3. Save changes

---

## 📅 RA 12001 Timeline Reference

### **Standard Timeline (12-Month Cycle):**

| Milestone | Timing | Example |
|-----------|--------|---------|
| **BLGF Notice (Day 0)** | Starting point | April 14, 2025 |
| **Work Plan** | Within 1-2 months | May-June 2025 |
| **Data Collection** | 3-6 months | April-September 2025 |
| **Draft SMV** | 6-9 months | Oct-Dec 2025 |
| **Publication** | 2 weeks before consultation | January 2026 |
| **Public Consultation** | 60 days before RO | February 2026 |
| **RO Submission** | **12 months from notice** | **April 14, 2026** ⚠️ |
| **Sanggunian** | After RO review | May-June 2026 |
| **BLGF Approval** | Before effectivity | November 2026 |
| **Effectivity** | January 1 | January 1, 2027 |

---

## 💡 Best Practices

### **1. Set Timeline Immediately**
- As soon as LGU receives BLGF Notice
- Don't wait until work starts

### **2. Use Auto-Calculate First**
- Let system generate compliant timeline
- Adjust manually only if needed

### **3. Review Regularly**
- Check Days column for countdown
- Monitor compliance status changes
- Address At-Risk LGUs promptly

### **4. Update if Timeline Changes**
- BLGF extends deadline → Update RO Submission
- LGU gets approval early → Update actual dates
- Keep timeline accurate for proper tracking

---

## 🚨 Common Issues

### **Problem**: "No monitoring record found"
**Solution**: Create SMV monitoring first by toggling any activity checkbox

### **Problem**: Timeline button not visible
**Solution**: Only Admins can set timelines. Check your user role.

### **Problem**: Day count not showing
**Solution**: Ensure `blgfNoticeDate` is set. This is required for Day 0 tracking.

### **Problem**: Dates seem incorrect
**Solution**: 
1. Check BLGF Notice Date is correct
2. Re-run Auto-Calculate
3. Verify RO Submission is 12 months from notice

---

## 📝 Example Scenarios

### **Scenario 1: New LGU (Butuan City)**
1. Received BLGF Notice: **April 14, 2025**
2. Click "Set Timeline" → Enter April 14, 2025
3. Click "Auto-Calculate"
4. Review generated dates:
   - RO Submission: April 14, 2026
   - Publication: January 31, 2026
   - Consultation: February 14, 2026
5. Adjust if needed → Save

### **Scenario 2: Different Notice Date (Surigao City)**
1. Received BLGF Notice: **May 1, 2025**
2. Set Timeline → Enter May 1, 2025
3. Auto-Calculate generates:
   - RO Submission: May 1, 2026
   - (Other dates adjusted accordingly)
4. Save

### **Scenario 3: Custom Timeline**
1. BLGF gave extended deadline
2. Set BLGF Notice Date normally
3. Manually set RO Submission to extended date
4. Let system calculate compliance from there

---

## 🎓 Understanding Day 0

### **Why "Day 0" Matters:**
- Standard reference point for all LGUs
- Enables fair comparison across provinces
- Tracks actual time elapsed since notice
- Calculates expected vs actual progress

### **Day Count Examples:**
- **Day 0**: April 14, 2025 (notice received)
- **Day 30**: May 14, 2025 (1 month in)
- **Day 180**: October 11, 2025 (6 months in)
- **Day 365**: April 14, 2026 (deadline day)

### **Progress Expectations:**
At **Day 180** (6 months), LGU should be:
- ~50% complete overall
- Finished: Preparatory, Data Collection
- In Progress: Data Analysis, Draft SMV
- Expected progress = (180/365) * 100 = 49.3%

---

## 🔗 Related Features

- **Dashboard Tab**: Overview of all LGUs compliance
- **Alerts**: Auto-generated deadline warnings
- **Filters**: Find LGUs by compliance status
- **Expanded View**: See full timeline milestones

---

## 📞 Support

If you need help:
1. Check this guide first
2. Verify BLGF Notice Date is correct
3. Try Auto-Calculate feature
4. Contact system administrator

---

**Last Updated**: October 11, 2025  
**Feature**: Timeline Management for SMV Monitoring  
**RA 12001 Compliance**: ✅ Full Support
