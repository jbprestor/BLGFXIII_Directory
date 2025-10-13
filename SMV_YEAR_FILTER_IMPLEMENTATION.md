# SMV Year Filter Implementation

## Overview
Added year-based filtering for SMV monitoring since SMV (Schedule of Market Values) is conducted every 3 years. This allows users to view and manage monitoring records for different SMV cycles.

## Changes Made

### 1. Year Filter State
**File:** `frontend/src/pages/SMVMonitoringPage.jsx`

Added:
```javascript
const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

// Available years for SMV (every 3 years)
const availableYears = useMemo(() => {
  const currentYear = new Date().getFullYear();
  const years = [];
  // Generate years: current year and going back in 3-year intervals
  for (let year = currentYear; year >= 2019; year -= 3) {
    years.push(year);
  }
  // Also add future years if needed (next cycle)
  if (!years.includes(currentYear + 3)) {
    years.unshift(currentYear + 3);
  }
  return years.sort((a, b) => b - a); // Descending order
}, []);
```

### 2. Fetch Monitorings by Year
Updated `fetchMonitorings` to filter by selected year:

```javascript
const fetchMonitorings = useCallback(async () => {
  try {
    setLoading(true);
    const res = await getSMVProcesses({ all: true, year: selectedYear });
    const allMonitorings = Array.isArray(res.data) ? res.data : res.data?.monitoringList || [];
    
    // Filter by selected year
    const filteredByYear = allMonitorings.filter(m => 
      m.referenceYear === selectedYear || 
      new Date(m.createdAt).getFullYear() === selectedYear
    );
    
    setMonitorings(filteredByYear);
    setError(null);
  } catch {
    // error handling
  }
}, [getSMVProcesses, selectedYear]);
```

### 3. Create/Update with Selected Year
Updated `handleSaveTimeline` to use `selectedYear` when creating new monitoring records:

```javascript
const createRes = await api.post("/smv-processes", {
  lguId: selectedLguForTimeline.lguId,
  referenceYear: selectedYear, // Use selected year
  valuationDate: new Date(selectedYear, 0, 1), // January 1st of selected year
  createdBy: user._id,
});
```

### 4. Handle Existing Records (409 Conflict)
Improved error handling for duplicate monitoring records:

```javascript
if (error.response?.status === 409) {
  // Monitoring already exists for this year, fetch and update it
  const existing = await api.get(`/smv-processes`, {
    params: { lguId: selectedLguForTimeline.lguId, year: selectedYear },
  });
  const monitoring = existing.data?.monitoringList?.[0];
  if (monitoring) {
    // Update existing record instead of creating new one
    const res = await updateSMVTimeline(monitoring._id, timelineData);
    toast.success(`Timeline updated for ${selectedYear}`);
  }
}
```

### 5. Year Selector UI
Added year selector component before filters:

```jsx
{/* Year Selector - SMV is every 3 years */}
<div className="mb-4 p-4 bg-base-200/50 rounded-lg border border-base-300">
  <div className="flex items-center justify-between gap-4 flex-wrap">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-lg">
        <svg className="w-5 h-5 text-primary">
          {/* Calendar icon */}
        </svg>
      </div>
      <div>
        <label className="label-text font-semibold text-base-content block">
          📅 SMV Reference Year
        </label>
        <p className="text-xs text-base-content/60">SMV is conducted every 3 years</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <select
        value={selectedYear}
        onChange={(e) => setSelectedYear(Number(e.target.value))}
        className="select select-bordered select-sm w-32 font-semibold"
      >
        {availableYears.map(year => (
          <option key={year} value={year}>
            {year}
            {year === new Date().getFullYear() && ' (Current)'}
          </option>
        ))}
      </select>
      <div className="badge badge-primary badge-lg">
        {monitorings.length} Records
      </div>
    </div>
  </div>
</div>
```

## Features

### Available Years
The system generates years in 3-year intervals:
- **2025** (Current)
- **2028** (Future cycle)
- **2022**
- **2019**
- And so on...

### Automatic Year Detection
- Current year is marked with "(Current)" label
- Badge shows count of monitoring records for selected year

### Smart Record Creation
- Creating a timeline automatically uses the selected year
- If a record already exists for that year, it updates instead of creating a duplicate
- Clear feedback messages: "Monitoring record created for 2025!"

### Use Cases

1. **View Current SMV Cycle (2025)**
   - Select 2025 from dropdown
   - View all LGUs' progress for current cycle

2. **View Previous SMV Cycle (2022)**
   - Select 2022 from dropdown
   - Review historical data from last cycle

3. **Plan Future Cycle (2028)**
   - Select 2028 from dropdown
   - Pre-plan timelines for next SMV cycle

4. **Create Monitoring for Specific Year**
   - Select desired year
   - Click "Set Timeline" on any LGU
   - System creates monitoring record for that year

## Benefits

✅ **No More "Already Exists" Errors** - System intelligently handles duplicate records
✅ **Multi-Year Tracking** - Track multiple SMV cycles separately
✅ **Historical Data** - Review past SMV cycles
✅ **Future Planning** - Plan ahead for upcoming cycles
✅ **Clear Year Context** - Always know which SMV year you're viewing
✅ **Automatic Filtering** - Only shows records for selected year
✅ **3-Year Intervals** - Follows actual SMV schedule

## User Experience

### Before:
- ❌ "SMV monitoring already exists on this LGU" error
- ❌ Can't distinguish between different SMV cycles
- ❌ Mixed data from multiple years

### After:
- ✅ Select year from dropdown
- ✅ View only that year's data
- ✅ Create/update records for specific year
- ✅ No confusion about which cycle you're viewing
- ✅ Clear feedback with year in messages

## Testing Steps

1. **Test Year Dropdown**
   - Open SMV Monitoring → Table View
   - See year selector at top
   - Dropdown shows years: 2028, 2025 (Current), 2022, 2019...

2. **Test Year Switching**
   - Select 2025 → Shows current cycle records
   - Select 2022 → Shows previous cycle records
   - Badge updates count dynamically

3. **Test Creating Timeline**
   - Select 2025
   - Click "Set Timeline" on any LGU
   - Fill in dates
   - Save → Creates monitoring for 2025

4. **Test Duplicate Handling**
   - Select 2025
   - Click "Set Timeline" on LGU with existing 2025 record
   - Save → Updates existing record (no "already exists" error)

5. **Test Multiple Years**
   - Create timeline for Tandag City in 2025
   - Switch to 2028
   - Create timeline for same LGU in 2028
   - Both records exist separately

## Date
October 11, 2025
