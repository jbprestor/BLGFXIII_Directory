# SMV Day 0 Tracking - RA 12001 Implementation

## 📅 What is "Day 0"?

**Day 0 = BLGF Notice Date** - The date when BLGF Central Office issues the formal notice to prepare the Schedule of Market Values (SMV).

### Example:
- **BLGF Notice Received**: April 14, 2025 ➡️ **This is Day 0**
- **Today** (October 11, 2025): Day 180
- **RO Submission Deadline** (April 14, 2026): Day 365

---

## 🎯 Key RA 12001 Deadlines

Based on BLGF Notice receipt, LGUs must complete these milestones:

| Milestone | Timeline | Status Tracking |
|-----------|----------|----------------|
| **BLGF Notice (Day 0)** | Start date | Receipt document uploaded |
| **Work Plan** | Within 1-2 months | Preparatory stage |
| **Data Collection** | 3-6 months | Multiple stages |
| **Publication** | 2 weeks before consultation | Must be public |
| **Public Consultation** | Within 60 days before RO | Two sessions required |
| **RO Submission** | **Within 12 months** ⚠️ | Critical deadline |
| **Sanggunian Enactment** | Within 5 months after RPTCIS | Legislative approval |
| **BLGF Approval** | Before effectivity | Final certification |
| **Effectivity Date** | January 1 (following year) | SMV takes effect |

---

## 📊 What the Table Shows

### **Days Column Display:**

```
Day 180        ← Days since BLGF Notice (Day 0)
185d 📅        ← Days until next deadline (green = 30+ days)
RO Submission  ← Which deadline is coming
```

### **Color Coding:**
- 🟢 **Green (30+ days)**: On schedule, plenty of time
- 🟡 **Yellow (<30 days)**: Urgent, deadline approaching
- 🔴 **Red ⏰**: Overdue, deadline passed

---

## 🔍 Expanded Row Timeline Details

Click any LGU row to expand and see:

1. **🔔 BLGF NOTICE (DAY 0)** - April 14, 2025
2. **📤 RO SUBMISSION** - Within 12 months deadline
3. **📰 PUBLICATION** - 2 weeks before consultation
4. **👥 PUBLIC CONSULTATION** - 60 days before RO
5. **🏛️ SANGGUNIAN** - Legislative enactment
6. **✅ BLGF APPROVAL** - Final certification
7. **🎯 EFFECTIVITY** - January 1 implementation

Each milestone shows:
- Date deadline
- Days remaining/overdue
- Compliance requirement

---

## 🔧 Backend Implementation

### **New Schema Fields** (`SMVMonitoring.js`):

```javascript
timeline: {
  blgfNoticeDate: Date,                    // 🔹 DAY 0
  projectStartDate: Date,                  // Work plan completion
  regionalOfficeSubmissionDeadline: Date,  // 12 months from Day 0
  publicationDeadline: Date,               // 2 weeks before consultation
  publicConsultationDeadline: Date,        // 60 days before RO
  sanggunianSubmissionDeadline: Date,      // Legislative approval
  blgfApprovalDeadline: Date,              // Final certification
  effectivityDate: Date                    // Jan 1 implementation
}
```

### **Auto-Calculation:**
- System calculates days since BLGF Notice
- Identifies next upcoming deadline
- Tracks overdue deadlines
- Color-codes urgency levels

---

## 💡 Frontend Features

### **SMVCompactTable Component:**

1. **`calculateDaysFromNotice()`**
   - Calculates: Today - BLGF Notice Date
   - Returns: Number of days elapsed

2. **`getNextDeadline()`**
   - Finds nearest upcoming deadline
   - Returns: {name, date, daysUntil}
   - Handles overdue deadlines

3. **Visual Indicators:**
   - Radial progress per stage
   - Heat map row coloring
   - Countdown timers
   - Compliance badges

---

## 📋 Usage Example

### **Setting Up Day 0 for an LGU:**

When BLGF issues the notice:

1. Navigate to SMV Monitoring → Table View
2. Upload BLGF Notice receipt document
3. Set `blgfNoticeDate` = April 14, 2025
4. System automatically calculates:
   - Day count (Day 0, Day 1, Day 2...)
   - RO Submission deadline (April 14, 2026)
   - Other milestone deadlines

### **Monitoring Progress:**

- **Dashboard Tab**: Overview of all LGUs
- **Table View Tab**: Detailed day-by-day tracking
- **Expand Row**: See all timeline milestones
- **Filters**: Find at-risk or overdue LGUs

---

## ⚠️ Critical Alerts

System generates alerts when:

1. **30 days before deadline** - Warning notification
2. **7 days before deadline** - Urgent alert
3. **Past deadline** - Overdue alert (red)
4. **Behind schedule** - Progress < expected

---

## 🎓 Understanding the Timeline

### **Why 12 Months for RO Submission?**

RA 12001 requires LGUs to complete SMV creation within a reasonable period. BLGF typically allows **12 months from notice** to:

1. Prepare work plan and budget
2. Collect market data
3. Analyze and draft SMV
4. Conduct public consultations
5. Submit to Regional Office for review

### **Why January 1 Effectivity?**

Real property taxes are assessed annually. SMV must take effect on **January 1** to align with:
- Tax assessment calendar
- Budget preparation cycles
- Revenue projections

---

## 📈 Compliance Tracking

### **Status Definitions:**

- **✅ On Track**: Meeting expected progress based on days elapsed
- **⚠️ At Risk**: <30 days remaining and behind schedule
- **🟡 Delayed**: Progress 10%+ behind expected
- **🔴 Overdue**: Past deadline and not 100% complete

### **Expected Progress Formula:**

```javascript
expectedProgress = (daysElapsed / totalDays) * 100

Example:
- Day 0: April 14, 2025
- Today: October 11, 2025 (Day 180)
- Deadline: April 14, 2026 (Day 365)
- Expected: (180/365) * 100 = 49.3%
- Actual: 45%
- Status: Delayed (4.3% behind)
```

---

## 🚀 Benefits

1. **Clear Timeline**: Everyone knows Day 0 reference point
2. **Deadline Tracking**: Automatic countdown to critical dates
3. **Early Warnings**: Alerts before deadlines
4. **Compliance**: Ensures RA 12001 requirements met
5. **Transparency**: Visual progress indicators
6. **Accountability**: Clear responsibility tracking

---

## 📝 Notes

- All dates stored in UTC (MongoDB ISODate)
- Frontend converts to Philippine Time (UTC+8)
- Day count updates automatically daily
- Timeline milestones customizable per LGU
- Historical data preserved in audit trail

---

## 🔗 Related Documents

- `SMV_TIMELINE_IMPLEMENTATION.md` - Technical specifications
- `SMV_TIMELINE_SUMMARY.md` - Feature overview
- `backend/src/models/SMVMonitoring.js` - Schema definition
- `frontend/src/components/smv/SMVCompactTable.jsx` - UI implementation

---

**Last Updated**: October 11, 2025
**RA 12001 Compliance**: Fully Implemented
**Status**: Production Ready ✅
