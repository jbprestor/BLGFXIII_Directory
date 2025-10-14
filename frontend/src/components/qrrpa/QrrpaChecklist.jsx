import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import useApi from "../../services/axios";
import toast from 'react-hot-toast';

// Rate limiting configuration
const MIN_INTERVAL_MS = 500; // Longer interval for status changes
let lastRequestTime = 0;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function formatDateTimePhilippines(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function formatDateOnly(value) {
  if (!value) return "-";
  // For date-only strings (like "2025-12-31"), parse without timezone conversion
  const dateStr = typeof value === 'string' ? value : value.toISOString().split('T')[0];
  const [year, month, day] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  if (isNaN(date.getTime())) return "-";
  
  try {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric",
    }).format(date);
  } catch {
    return `${month}/${day}/${year}`;
  }
}

function formatTimeAgo(value) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return "-";
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffSec < 60) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 30) return `${diffDay}d`;
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function calculateDaysFromDeadline(submissionDate, deadline) {
  if (!submissionDate || !deadline) return null;
  const submission = new Date(submissionDate);
  const deadlineDate = new Date(deadline);
  const diffTime = submission - deadlineDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays; // Positive = late, Negative = early, 0 = on time
}

function formatDeadlineStatus(days) {
  if (days === null) return { text: "Not submitted", color: "text-base-content/60", badge: "badge-neutral" };
  if (days === 0) return { text: "On time", color: "text-success", badge: "badge-success" };
  if (days < 0) return { text: `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} early`, color: "text-info", badge: "badge-info" };
  return { text: `${days} day${days !== 1 ? 's' : ''} late`, color: "text-error", badge: "badge-error" };
}

export default function QrrpaChecklist({ records = [], lgus = [], loading, onRefresh }) {
  const { getRegions, getProvinces, createQrrpa, updateQrrpa, deleteQrrpa, getQrrpaByPeriod } = useApi();
  
  // Period state (must be declared before other state that depends on it)
  const [selectedYear, setSelectedYear] = useState(() => {
    // Load year from localStorage or use current year
    const savedYear = localStorage.getItem('qrrpa-year');
    return savedYear || "2025";
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    // Load quarter from localStorage or use Q3 (current quarter for most data)
    const savedQuarter = localStorage.getItem('qrrpa-quarter');
    return savedQuarter || "Q3";
  });
  const [deadline, setDeadline] = useState(() => {
    // Load deadline from localStorage or use default
    const savedDeadline = localStorage.getItem('qrrpa-deadline');
    return savedDeadline || "2025-12-31";
  });
  
  // Local state for current records
  const [localRecords, setLocalRecords] = useState([]);
  
  // NEW: Pending changes for batch save (this is FRONTEND MEMORY only, not database!)
  const [pendingChanges, setPendingChanges] = useState(new Map());
  const [isBatchSaving, setIsBatchSaving] = useState(false);
  
  const [filters, setFilters] = useState({ region: "", province: "", status: "" });
  const [filteredLgus, setFilteredLgus] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false); // Keep for compatibility but not used for immediate saves
  const [expandedRemarks, setExpandedRemarks] = useState(new Set());
  const [sortBy, setSortBy] = useState("date");
  const [sortDirection, setSortDirection] = useState("desc");
  // NEW: Track original order to prevent auto-sorting during toggles
  const [preserveOrder, setPreserveOrder] = useState(true);
  const [originalOrder, setOriginalOrder] = useState([]);
  const [showDeadlineEditor, setShowDeadlineEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => {
    const saved = localStorage.getItem('qrrpa-items-per-page');
    return saved ? parseInt(saved) : 10;
  });

  // Toggle all state
  const [isTogglingAll, setIsTogglingAll] = useState(false);

  // Rate-limited request queue
  const enqueueRequest = useCallback((fn, context = "request") => {
    return new Promise((resolve, reject) => {
      const executeRequest = async () => {
        try {
          const now = Date.now();
          const elapsed = now - lastRequestTime;
          if (elapsed < MIN_INTERVAL_MS) {
            await sleep(MIN_INTERVAL_MS - elapsed);
          }
          lastRequestTime = Date.now();
          
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const result = await fn();
              resolve(result);
              return;
            } catch (error) {
              if (error.response?.status === 429 && retryCount < maxRetries - 1) {
                retryCount++;
                const backoffDelay = Math.pow(2, retryCount) * 1000;
                console.log(`Rate limited, retrying ${context} in ${backoffDelay}ms...`);
                await sleep(backoffDelay);
                continue;
              }
              throw error;
            }
          }
        } catch (error) {
          reject(error);
        }
      };
      
      executeRequest();
    });
  }, []);

  // Update local records when props change OR period changes
  useEffect(() => {
    const currentPeriod = getCurrentPeriod();
    // Only show records for current period
    const filteredRecords = records.filter(r => r.period === currentPeriod);
    setLocalRecords(filteredRecords);
  }, [records, selectedYear, selectedQuarter]);
  
  // Helper functions for period management
  const getCurrentPeriod = () => {
    // Provide fallbacks in case state variables are not yet initialized
    const year = selectedYear || new Date().getFullYear();
    const quarter = selectedQuarter || `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
    return `${year}-${quarter}`;
  };
  
  const updateYear = (newYear) => {
    setSelectedYear(newYear);
    // Don't save to localStorage immediately - wait for save button
  };

  const updateQuarter = (newQuarter) => {
    setSelectedQuarter(newQuarter);
    // Don't save to localStorage immediately - wait for save button
  };

  // Clear all local data when period changes
  const clearDataForPeriodChange = () => {
    setLocalRecords([]);
    setPendingChanges(new Map());
    setEditingCell(null);
    setEditValue('');
    // Trigger refresh if onRefresh is available
    if (onRefresh) {
      onRefresh();
    }
  };

  // Save period changes and apply them
  const savePeriodChanges = () => {
    // Save to localStorage
    localStorage.setItem('qrrpa-year', selectedYear);
    localStorage.setItem('qrrpa-quarter', selectedQuarter);
    localStorage.setItem('qrrpa-deadline', deadline);
    
    // Clear data for the new period
    clearDataForPeriodChange();
    
    // Close the editor
    setShowDeadlineEditor(false);
  };

  // Cancel period changes and revert to saved values
  const cancelPeriodChanges = () => {
    const savedYear = localStorage.getItem('qrrpa-year') || "2025";
    const savedQuarter = localStorage.getItem('qrrpa-quarter') || "Q4";
    const savedDeadline = localStorage.getItem('qrrpa-deadline') || "2025-12-31";
    
    setSelectedYear(savedYear);
    setSelectedQuarter(savedQuarter);
    setDeadline(savedDeadline);
    
    // Close the editor
    setShowDeadlineEditor(false);
  };

  // Check if period has changed from saved values
  const hasPeriodChanges = () => {
    const savedYear = localStorage.getItem('qrrpa-year') || "2025";
    const savedQuarter = localStorage.getItem('qrrpa-quarter') || "Q4";
    const savedDeadline = localStorage.getItem('qrrpa-deadline') || "2025-12-31";
    return selectedYear !== savedYear || selectedQuarter !== savedQuarter || deadline !== savedDeadline;
  };

  // Reset function to delete all records for the current period
  const resetAllRecords = async () => {
    const currentPeriod = getCurrentPeriod();
    
    // Use react-hot-toast for confirmation
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-error flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="font-semibold text-error">Delete All Records</p>
            <p className="text-sm text-base-content/80 mt-1">
              Delete ALL QRRPA records for {currentPeriod}? This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="btn btn-ghost btn-sm text-base-content"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              // Execute the actual delete logic
              try {
                const response = await getQrrpaByPeriod(currentPeriod);
                let allRecordsForPeriod = [];
                if (response && response.data) {
                  if (Array.isArray(response.data)) {
                    allRecordsForPeriod = response.data;
                  } else if (Array.isArray(response.data.records)) {
                    allRecordsForPeriod = response.data.records;
                  } else if (Array.isArray(response.data.data)) {
                    allRecordsForPeriod = response.data.data;
                  }
                }
                
                if (allRecordsForPeriod.length === 0) {
                  toast.success(`No records found for period ${currentPeriod}`, {
                    icon: '📭',
                    duration: 3000
                  });
                  return;
                }

                setLocalRecords(prev => prev.filter(record => record.period !== currentPeriod));
                setPendingChanges(prev => {
                  const newChanges = new Map(prev);
                  for (const [key] of newChanges) {
                    if (key.includes(`_${currentPeriod}`)) {
                      newChanges.delete(key);
                    }
                  }
                  return newChanges;
                });

                const deletePromises = allRecordsForPeriod.map(record => {
                  if (!record || !record._id) return Promise.resolve();
                  return enqueueRequest(() => deleteQrrpa(record._id), `delete record ${record._id}`);
                }).filter(Boolean);

                await Promise.all(deletePromises);
                
                toast.success(`Successfully deleted ${allRecordsForPeriod.length} records for ${currentPeriod}`, {
                  icon: '🗑️',
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--b1))',
                    color: 'hsl(var(--bc))',
                    border: '2px solid hsl(var(--su))',
                    borderRadius: '0.75rem'
                  }
                });
                
                if (onRefresh) onRefresh();
              } catch (error) {
                console.error('Reset error:', error);
                toast.error('Error deleting records. Please try again.', {
                  duration: 4000,
                  style: {
                    background: 'hsl(var(--b1))',
                    color: 'hsl(var(--bc))',
                    border: '2px solid hsl(var(--er))',
                    borderRadius: '0.75rem'
                  }
                });
                if (onRefresh) onRefresh();
              }
            }}
            className="btn btn-error btn-sm"
          >
            Delete All
          </button>
        </div>
      </div>
    ), {
      duration: Infinity,
      style: {
        background: 'hsl(var(--b1))',
        color: 'hsl(var(--bc))',
        border: '1px solid hsl(var(--er) / 0.3)',
        borderRadius: '0.75rem',
        padding: '1rem',
        maxWidth: '400px'
      }
    });
  };

  // Generate year options (current year ± 5 years, with minimum range)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    // Calculate range: at least 5 years before and 5 years after current year
    // But also ensure we include the selected year if it's outside this range
    const selectedYearNum = parseInt(selectedYear) || currentYear;
    const minYear = Math.min(currentYear - 5, selectedYearNum - 2, 2020); // At least back to 2020
    const maxYear = Math.max(currentYear + 5, selectedYearNum + 2, currentYear + 10); // At least 10 years ahead
    
    for (let year = minYear; year <= maxYear; year++) {
      years.push(year.toString());
    }
    
    return years.sort((a, b) => parseInt(a) - parseInt(b));
  };

  const quarterOptions = [
    { value: "Q1", label: "Q1 (Jan-Mar)" },
    { value: "Q2", label: "Q2 (Apr-Jun)" }, 
    { value: "Q3", label: "Q3 (Jul-Sep)" },
    { value: "Q4", label: "Q4 (Oct-Dec)" }
  ];

  useEffect(() => { fetchRegions(); }, []);
    useEffect(() => {
      if (lgus && lgus.length > 0) {
        const municipalLgus = lgus.filter(l => l.classification && l.classification.toLowerCase() !== "province");
        setFilteredLgus(municipalLgus);
        setShowResults(true);
      }
    }, [lgus]);
    useEffect(() => { if (filters.region && filters.region !== "All") fetchProvinces(filters.region); else setProvinces([]); }, [filters.region]);

  // Real-time search effect
  useEffect(() => {
    if (lgus && lgus.length > 0) {
      const currentPeriod = getCurrentPeriod();
      let filtered = lgus.filter(l => l.classification && l.classification.toLowerCase() !== "province");
      
      // Apply region filter
      if (filters.region && filters.region !== "All") {
        filtered = filtered.filter(l => l.region === filters.region);
      }
      
      // Apply province filter  
      if (filters.province && filters.province !== "All") {
        filtered = filtered.filter(l => l.province === filters.province);
      }
      
      // Apply status filter
      if (filters.status && filters.status !== "All") {
        filtered = filtered.filter(l => {
          const record = localRecords.find(r => {
            const recordLguId = String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId);
            const currentLguId = String(l._id);
            return recordLguId === currentLguId && r.period === currentPeriod;
          });
          const currentStatus = record?.status || 'Not Submitted';
          return currentStatus === filters.status;
        });
      }
      
      // Apply search filter
      if (searchQuery.trim()) {
        filtered = filtered.filter(l => 
          l.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        );
      }
      
      setFilteredLgus(filtered);
      setShowResults(true);
    }
  }, [lgus, filters.region, filters.province, filters.status, searchQuery, localRecords, selectedYear, selectedQuarter]);

  const fetchRegions = async () => { 
    try { 
      setLoadingDropdowns(true); 
      const res = await getRegions(); 
      setRegions(res.data || []); 
    } catch {
      setRegions(["Region XIII","Region XII","Region XI"]); 
    } finally { 
      setLoadingDropdowns(false); 
    } 
  };

  const fetchProvinces = async (region) => { 
    try { 
      setLoadingDropdowns(true); 
      const res = await getProvinces(region); 
      setProvinces(res.data || []); 
    } catch {
      setProvinces([]); 
    } finally { 
      setLoadingDropdowns(false); 
    } 
  };

  const clearFilters = () => { 
    setFilters({ region: "", province: "", status: "" }); 
    setSearchQuery(""); 
    const municipalLgus = lgus.filter(l => l.classification && l.classification.toLowerCase() !== "province"); 
    setFilteredLgus(municipalLgus);
    setOriginalOrder(municipalLgus); // Capture original order
    setPreserveOrder(true); // Start with preserved order
    setShowResults(true); 
  };

  // NEW: Separate state for display order that NEVER changes during toggles
  const [staticDisplayOrder, setStaticDisplayOrder] = useState([]);
  const [isToggling, setIsToggling] = useState(false);
  // NEW: Track which LGU is currently being toggled for smooth feedback
  const [togglingLgu, setTogglingLgu] = useState(null);

  // Set static order when filters are applied
  useEffect(() => {
    if (showResults && filteredLgus.length > 0 && !isToggling) {
      setStaticDisplayOrder(filteredLgus);
      setOriginalOrder(filteredLgus);
      setPreserveOrder(true);
      // Only reset to page 1 when filters actually change, not during toggle operations
      // We can detect this by checking if the LGU list composition has changed
      const currentLguIds = filteredLgus.map(l => l._id).sort().join(',');
      const staticLguIds = staticDisplayOrder.map(l => l._id).sort().join(',');
      
      if (currentLguIds !== staticLguIds) {
        setCurrentPage(1); // Reset to first page only when the actual LGU list changes
      }
    }
  }, [showResults, filteredLgus, isToggling, staticDisplayOrder]);

  const displayedLgus = useMemo(() => {
    // COMPLETELY STATIC: During toggles, always use staticDisplayOrder
    if (isToggling || (preserveOrder && staticDisplayOrder.length > 0)) {
      return staticDisplayOrder;
    }
    
    // Only sort when user explicitly requests it AND not toggling
    const dateMap = new Map();
    for (const r of localRecords || []) { 
      const id = typeof r.lguId === 'object' ? r.lguId._id : r.lguId; 
      dateMap.set(String(id), r.dateSubmitted || null); 
    }
    const list = [...filteredLgus];
    if (sortBy === 'date') {
      list.sort((a,b) => {
        const ad = dateMap.get(String(a._id)) || null;
        const bd = dateMap.get(String(b._id)) || null;
        const aTs = ad ? new Date(ad).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        const bTs = bd ? new Date(bd).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        if (aTs === bTs) return a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? aTs - bTs : bTs - aTs;
      });
    } else if (sortBy === 'name') {
      list.sort((a,b) => {
        const comparison = a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return list;
  }, [filteredLgus, sortBy, sortDirection, preserveOrder, staticDisplayOrder, isToggling, localRecords]);

  // Paginated LGUs for display
  const paginatedLgus = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayedLgus.slice(startIndex, endIndex);
  }, [displayedLgus, currentPage, itemsPerPage]);

  // Pagination info
  const totalPages = Math.ceil(displayedLgus.length / itemsPerPage);
  const totalItems = displayedLgus.length;

  // SEPARATE: Update static display order when sorting is applied
  useEffect(() => {
    if (!isToggling && !preserveOrder && displayedLgus.length > 0) {
      setStaticDisplayOrder(displayedLgus);
    }
  }, [displayedLgus, isToggling, preserveOrder]);

  // Filter records by current period for faster lookups
  const currentPeriodRecords = useMemo(() => {
    const currentPeriod = getCurrentPeriod();
    return records.filter(r => r.period === currentPeriod);
  }, [records, selectedYear, selectedQuarter]);

  // NEW: Stage changes for batch save (stores in BROWSER MEMORY, not database)
  const handleStatusChange = (lguId, newStatus) => {
    // SMOOTH TOGGLE: Set individual LGU as toggling for visual feedback
    setTogglingLgu(lguId);
    
    // SMOOTH: Use requestAnimationFrame for better performance
    requestAnimationFrame(() => {
      setIsToggling(true);
      
      const existingRecord = localRecords.find(r => String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lguId));
      const currentPeriod = getCurrentPeriod();
      
      // SMART: Check ORIGINAL record from database (not temp local records!)
      // Use filtered records for current period only
      const originalRecord = currentPeriodRecords.find(r => 
        String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lguId)
      );
      const originalStatus = originalRecord?.status || 'Not Submitted';
      
      // Stage the change in pending changes Map (FRONTEND MEMORY only)
      const changeKey = `${lguId}_${currentPeriod}`;
      setPendingChanges(prev => {
        const newChanges = new Map(prev);
        
        // SMART: If toggling back to original state, REMOVE the pending change
        if (newStatus === originalStatus) {
          newChanges.delete(changeKey);
        } else {
          // Store the change details - USE ORIGINAL RECORD, not local temp record!
          newChanges.set(changeKey, {
            lguId,
            period: currentPeriod,
            newStatus,
            existingRecord: originalRecord, // 🎯 Use original from DB, not temp local record
            action: originalRecord 
              ? (newStatus === 'Not Submitted' ? 'delete' : 'update')
              : (newStatus === 'Not Submitted' ? 'none' : 'create')
          });
        }
        
        return newChanges;
      });

      // SMOOTH: Batch state updates together
      const updateLocalRecords = () => {
        if (existingRecord) {
          if (newStatus === 'Not Submitted') {
            setLocalRecords(prev => prev.filter(r => 
              String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) !== String(lguId)
            ));
          } else {
            const updatedRecord = {
              ...existingRecord,
              status: newStatus,
              dateSubmitted: newStatus === 'Submitted' ? new Date().toISOString() : existingRecord.dateSubmitted
            };
            setLocalRecords(prev => prev.map(r => 
              String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lguId) 
                ? updatedRecord 
                : r
            ));
          }
        } else {
          if (newStatus !== 'Not Submitted') {
            const newRecord = {
              _id: `temp_${lguId}_${Date.now()}`,
              lguId: lguId,
              period: currentPeriod,
              status: newStatus,
              dateSubmitted: newStatus === 'Submitted' ? new Date().toISOString() : null,
              description: ''
            };
            setLocalRecords(prev => [...prev, newRecord]);
          }
        }
      };

      // SMOOTH: Update records in next frame for better performance
      requestAnimationFrame(() => {
        updateLocalRecords();
        
        // SMOOTH: Reset states very quickly for responsive feel
        requestAnimationFrame(() => {
          setIsToggling(false);
          setTogglingLgu(null);
        });
      });
    });
  };

  // NEW: Batch save all pending changes to your existing blgf_db database
  const handleBatchSave = async () => {
    if (pendingChanges.size === 0) return;
    
    setIsBatchSaving(true);
    const results = { success: 0, failed: 0, errors: [] };
    
    try {
      // Process all pending changes
      for (const [_changeKey, change] of pendingChanges) {
        try {
          // Handle different change types
          if (change.newStatus !== undefined) {
            // Old status change format
            const { lguId, period, newStatus, existingRecord, action } = change;
            
            if (action === 'delete' && existingRecord) {
              await deleteQrrpa(existingRecord._id);
              results.success++;
            } else if (action === 'update' && existingRecord) {
              const updateData = { 
                status: newStatus, 
                dateSubmitted: newStatus === 'Submitted' ? new Date().toISOString() : existingRecord.dateSubmitted 
              };
              await updateQrrpa(existingRecord._id, updateData);
              results.success++;
            } else if (action === 'create') {
              const newRecord = { 
                lguId, 
                period, 
                status: newStatus, 
                dateSubmitted: newStatus === 'Submitted' ? new Date().toISOString() : null, 
                description: '' 
              };
              await createQrrpa(newRecord);
              results.success++;
            } else if (action === 'none') {
              // Skip - toggling to "Not Submitted" when no record exists (no-op)
              results.success++; // Count as success since it's intentional
            } else if (action === 'update' && !existingRecord) {
              // This is the problem! Trying to update but no existing record
              console.error(`❌ Cannot update - no existing record for LGU ${lguId}!`);
              results.failed++;
              results.errors.push(`LGU ${lguId}: Cannot update - no existing record found`);
            } else if (action === 'delete' && !existingRecord) {
              // Trying to delete but no existing record
              console.error(`❌ Cannot delete - no existing record for LGU ${lguId}!`);
              results.failed++;
              results.errors.push(`LGU ${lguId}: Cannot delete - no existing record found`);
            } else {
              // Unknown action - log warning
              console.warn(`⚠️ Unknown action '${action}' for LGU ${lguId}`);
              results.failed++;
              results.errors.push(`LGU ${lguId}: Unknown action '${action}'`);
            }
          } else {
            // New field-specific change format
            const { lguId, newData, existingRecord, action } = change;
            
            if (action === 'delete' && existingRecord) {
              await deleteQrrpa(existingRecord._id);
              results.success++;
            } else if (action === 'update' && existingRecord) {
              await updateQrrpa(existingRecord._id, newData);
              results.success++;
            } else if (action === 'create') {
              await createQrrpa(newData);
              results.success++;
            } else if (action === 'none') {
              // Skip - no operation needed
              results.success++;
            } else {
              // Unknown action
              results.failed++;
              results.errors.push(`LGU ${lguId}: Unknown action '${action}'`);
            }
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`LGU ${change.lguId}: ${error.response?.data?.message || error.message}`);
        }
      }
      
      // Clear pending changes on success
      setPendingChanges(new Map());
      
      // Show results
      if (results.failed === 0) {
        toast.success(`Successfully saved ${results.success} changes to your database!`, {
          icon: '💾',
          duration: 4000,
          style: {
            background: 'hsl(var(--b1))',
            color: 'primary-color',
            border: '2px solid hsl(var(--su))',
            borderRadius: '0.75rem',
            fontWeight: '500'
          }
        });
      } else {
        toast.error(`Saved ${results.success} changes, ${results.failed} failed.`, {
          duration: 6000,
          style: {
            background: 'hsl(var(--b1))',
            color: 'hsl(var(--bc))',
            border: '2px solid hsl(var(--er))',
            borderRadius: '0.75rem',
            fontWeight: '500'
          }
        });
      }
      
      // Refresh data from your blgf_db database
      if (onRefresh) {
        await onRefresh();
      }
      
    } catch (error) {
      toast.error('Batch save failed: ' + error.message, {
        duration: 4000,
      });
    } finally {
      setIsBatchSaving(false);
    }
  };

  // NEW: Clear all pending changes
  const handleClearPending = async () => {
    if (pendingChanges.size > 0) {
      // Use react-hot-toast for confirmation
      toast((t) => (
        <div className="flex items-center gap-3 p-2 bg-base-100 text-base-content">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-base-content">Clear all {pendingChanges.size} changes?</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                setPendingChanges(new Map());
                setLocalRecords(records);
                toast.success('Pending changes cleared', {
                  icon: '🔄',
                  duration: 2000,
                  style: {
                    background: 'hsl(var(--b1))',
                    color: 'hsl(var(--bc))',
                    border: '1px solid hsl(var(--su))',
                    borderRadius: '0.75rem'
                  }
                });
              }}
              className="btn btn-warning btn-xs bg-warning text-warning-content border-warning hover:bg-warning/80"
            >
              Clear All
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="btn btn-ghost btn-xs text-base-content"
            >
              Cancel
            </button>
          </div>
        </div>
      ), {
        duration: Infinity,
        style: {
          background: 'hsl(var(--b1))',
          color: 'hsl(var(--bc))',
          border: '1px solid hsl(var(--b3))',
          borderRadius: '0.75rem',
          padding: '0.5rem'
        }
      });
    }
  };

  // NEW: Toggle all displayed LGUs (smart toggle based on current page/filter)
  const handleToggleAll = async () => {
    if (isTogglingAll) return;
    
    setIsTogglingAll(true);
    setIsToggling(true);
    
    try {
      // Get LGUs that are currently displayed (considering filters and pagination)
      const lguToToggle = showResults ? paginatedLgus : paginatedLgus;
      
      // Check current state of displayed LGUs for current period
      const currentPeriod = getCurrentPeriod();
      const submittedCount = lguToToggle.filter(lgu => {
        const record = localRecords.find(r => 
          ((r.lguId === lgu._id) || 
          (r.lguId && r.lguId._id === lgu._id) || 
          (typeof r.lguId === 'object' && r.lguId._id === lgu._id)) &&
          r.period === currentPeriod
        );
        return record?.status === 'Submitted';
      }).length;
      
      // If more than half are submitted, toggle all to "Not Submitted", otherwise toggle all to "Submitted"
      const targetStatus = submittedCount > lguToToggle.length / 2 ? 'Not Submitted' : 'Submitted';
      
      // Show progress toast
      toast.loading(`Toggling ${lguToToggle.length} LGUs to "${targetStatus}"...`, {
        id: 'toggle-all-progress'
      });
      
      // OPTIMIZATION: Batch all changes together, then update UI once
      // This prevents the rough animation from multiple re-renders
      const allChanges = [];
      
      for (let i = 0; i < lguToToggle.length; i++) {
        const lgu = lguToToggle[i];
        
        // SMART: Get ORIGINAL record from database (not temp local records!)
        // Use filtered records for current period only
        const originalRecord = currentPeriodRecords.find(r => 
          String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
        );
        const originalStatus = originalRecord?.status || 'Not Submitted';
        
        const changeKey = `${lgu._id}_${currentPeriod}`;
        
        // SMART: Only add to changes if it's different from original
        if (targetStatus !== originalStatus) {
          allChanges.push({
            key: changeKey,
            lguId: lgu._id,
            period: currentPeriod,
            newStatus: targetStatus,
            existingRecord: originalRecord, // 🎯 Use original from DB
            originalStatus,
            action: originalRecord 
              ? (targetStatus === 'Not Submitted' ? 'delete' : 'update')
              : (targetStatus === 'Not Submitted' ? 'none' : 'create')
          });
        }
        
        // Small delay to prevent rate limit (50ms = 20 req/sec, within limit)
        await sleep(50);
      }
      
      // SMOOTH: Update all pending changes at once
      setPendingChanges(prev => {
        const newChanges = new Map(prev);
        
        // For each LGU, either add/update the change or remove it if back to original
        lguToToggle.forEach(lgu => {
          const changeKey = `${lgu._id}_${currentPeriod}`;
          const originalRecord = records.find(r => 
            String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
          );
          const originalStatus = originalRecord?.status || 'Not Submitted';
          
          if (targetStatus === originalStatus) {
            // SMART: Remove from pending changes if toggling back to original
            newChanges.delete(changeKey);
          } else {
            // Add/update pending change
            const change = allChanges.find(c => c.key === changeKey);
            if (change) {
              newChanges.set(changeKey, change);
            }
          }
        });
        
        return newChanges;
      });
      
      // SMOOTH: Update all local records in a single batch
      requestAnimationFrame(() => {
        setLocalRecords(prev => {
          let updated = [...prev];
          
          // Process ALL lguToToggle, not just allChanges
          lguToToggle.forEach(lgu => {
            const existingRecord = updated.find(r => 
              String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
            );
            
            const originalRecord = records.find(r => 
              String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
            );
            const originalStatus = originalRecord?.status || 'Not Submitted';
            
            // If toggling back to original, restore from original records
            if (targetStatus === originalStatus) {
              if (originalRecord) {
                // Restore original record
                updated = updated.map(r => 
                  String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
                    ? { ...originalRecord }
                    : r
                );
              } else {
                // Remove if original was "Not Submitted"
                updated = updated.filter(r => 
                  String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) !== String(lgu._id)
                );
              }
            } else {
              // Apply new status
              if (targetStatus === 'Not Submitted') {
                // Remove record
                updated = updated.filter(r => 
                  String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) !== String(lgu._id)
                );
              } else if (existingRecord) {
                // Update existing
                updated = updated.map(r => 
                  String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id)
                    ? {
                        ...r,
                        status: targetStatus,
                        dateSubmitted: targetStatus === 'Submitted' ? new Date().toISOString() : r.dateSubmitted
                      }
                    : r
                );
              } else {
                // Create new
                updated.push({
                  _id: `temp_${lgu._id}_${Date.now()}`,
                  lguId: lgu._id,
                  period: currentPeriod,
                  status: targetStatus,
                  dateSubmitted: targetStatus === 'Submitted' ? new Date().toISOString() : null,
                  description: ''
                });
              }
            }
          });
          
          return updated;
        });
      });
      
      toast.dismiss('toggle-all-progress');
      toast.success(`Successfully toggled ${lguToToggle.length}`, {
        duration: 3000
      });
      
    } catch (error) {
      toast.dismiss('toggle-all-progress');
      toast.error('Failed to toggle all LGUs: ' + error.message, {
        duration: 4000,
      });
    } finally {
      setIsTogglingAll(false);
      setIsToggling(false);
    }
  };

  // Pagination functions
  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page
    localStorage.setItem('qrrpa-items-per-page', newItemsPerPage.toString());
  };

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

    const startEditing = (lguId, field, currentValue) => { 
      setEditingCell({ lguId, field }); 
      
      // Handle dateSubmitted field with proper timezone handling
      if (field === 'dateSubmitted') {
        if (currentValue) {
          // Convert existing date to local datetime-local format
          const date = new Date(currentValue);
          const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
          setEditValue(localDateTime.toISOString().slice(0, 16));
        } else {
          // Default to current Philippines time for new entries
          const now = new Date();
          // Adjust for Philippines timezone (UTC+8)
          const philippinesTime = new Date(now.getTime() + (8 * 60 * 60 * 1000) - (now.getTimezoneOffset() * 60000));
          setEditValue(philippinesTime.toISOString().slice(0, 16));
        }
      } else {
        setEditValue(currentValue || '');
      }
    };
    const cancelEdit = () => { setEditingCell(null); setEditValue(''); };

    const toggleRemarkExpansion = (lguId) => {
      const newExpanded = new Set(expandedRemarks);
      if (newExpanded.has(lguId)) {
        newExpanded.delete(lguId);
      } else {
        newExpanded.add(lguId);
      }
      setExpandedRemarks(newExpanded);
    };

    const updateDeadline = (newDeadline) => {
      setDeadline(newDeadline);
      // Don't save to localStorage immediately - wait for save button
    };

    const saveEdit = async (lguId) => {
      if (!editingCell) return;
      
      // Stage the change instead of saving immediately
      const currentPeriod = getCurrentPeriod();
      const existingRecord = localRecords.find(r => String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lguId));
      
      // Stage the change in pending changes Map
      const changeKey = `${lguId}_${currentPeriod}`;
      setPendingChanges(prev => {
        const newChanges = new Map(prev);
        
        let action = 'update';
        let newRecordData = {};
        
        if (!existingRecord) {
          action = 'create';
          newRecordData = {
            lguId,
            period: currentPeriod,
            status: 'Not Submitted',
            dateSubmitted: null,
            description: ''
          };
        }
        
        // Apply the edit to the record data
        if (editingCell.field === 'dateSubmitted') {
          newRecordData.dateSubmitted = editValue ? new Date(editValue).toISOString() : null;
          if (existingRecord) {
            newRecordData = { ...existingRecord, dateSubmitted: newRecordData.dateSubmitted };
          }
        } else if (editingCell.field === 'description') {
          newRecordData.description = editValue;
          if (existingRecord) {
            newRecordData = { ...existingRecord, description: newRecordData.description };
          }
        }
        
        // Store the change details
        newChanges.set(changeKey, {
          lguId,
          period: currentPeriod,
          newData: newRecordData,
          existingRecord,
          action,
          field: editingCell.field
        });
        
        return newChanges;
      });
      
      // Update local records for immediate UI feedback
      if (existingRecord) {
        const updatedRecord = { ...existingRecord };
        if (editingCell.field === 'dateSubmitted') {
          updatedRecord.dateSubmitted = editValue ? new Date(editValue).toISOString() : null;
        } else if (editingCell.field === 'description') {
          updatedRecord.description = editValue;
        }
        
        setLocalRecords(prev => prev.map(r => 
          String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lguId) 
            ? updatedRecord 
            : r
        ));
      } else {
        // Create new record in local state
        const newRecord = {
          _id: `temp_${lguId}_${Date.now()}`,
          lguId: lguId,
          period: currentPeriod,
          status: 'Not Submitted',
          dateSubmitted: editingCell.field === 'dateSubmitted' ? (editValue ? new Date(editValue).toISOString() : null) : null,
          description: editingCell.field === 'description' ? editValue : ''
        };
        setLocalRecords(prev => [...prev, newRecord]);
      }
      
      // Clear editing state
      setEditingCell(null);
      setEditValue('');
    };

    const handleKeyPress = (e, lguId) => { if (e.key === 'Enter') saveEdit(lguId); if (e.key === 'Escape') cancelEdit(); };

    if (loading) return (<div className="flex justify-center items-center p-8"><span className="loading loading-spinner loading-lg"></span></div>);

    return (
      <div className="space-y-3 sm:space-y-4" data-qrrpa-checklist="true">
        {/* Centered Period Management */}
        <div className="bg-gradient-to-r from-primary/10 via-secondary/5 to-primary/10 border border-primary/20 rounded-xl p-3 sm:p-5 mx-2 sm:mx-auto sm:max-w-5xl shadow-lg">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Period Info - Centered */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm font-medium text-base-content/80">Current Period</span>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
                {selectedYear} {selectedQuarter}
                {hasPeriodChanges() && (
                  <span className="ml-2 text-warning text-sm font-normal">
                    (unsaved changes)
                  </span>
                )}
              </div>
              <div className="text-sm sm:text-base text-base-content/70 mb-2">
                Track <strong className="text-primary">{getCurrentPeriod()}</strong> for <strong className="text-secondary">{showResults ? filteredLgus.length : '73'} LGUs</strong>
                {showResults && filteredLgus.length !== 73 && (
                  <span className="text-warning font-medium"> (filtered)</span>
                )}
              </div>
              <div className="text-xs sm:text-sm text-base-content/70 flex items-center justify-center gap-1 flex-wrap">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Deadline: <span className="font-semibold text-base-content whitespace-nowrap">{formatDateOnly(deadline)}</span></span>
              </div>
            </div>
            
            {/* Manage Button - Centered */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowDeadlineEditor(!showDeadlineEditor)}
                className={`btn btn-sm w-full sm:w-auto transition-all duration-300 ${
                  showDeadlineEditor 
                    ? 'btn-ghost text-base-content hover:text-error border border-base-300 hover:border-error' 
                    : 'btn-primary shadow-lg hover:shadow-xl hover:scale-105 bg-gradient-to-r from-primary to-primary-focus border-0'
                }`}
              >
                {showDeadlineEditor ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Cancel</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium text-white drop-shadow-sm">Manage Period</span>
                  </>
                )}
              </button>
            </div>
          </div>
            
          {showDeadlineEditor && (
            <div className="mt-4 animate-in slide-in-from-top duration-300">
              <div className="bg-base-100/90 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-base-300/50 shadow-xl">
                {/* Mobile-First Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Year Selector - Mobile Optimized */}
                  <div className="space-y-2">
                    <label className="label py-1">
                      <span className="label-text text-xs sm:text-sm font-medium text-base-content flex items-center gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Year
                        {!hasPeriodChanges() && selectedYear === (localStorage.getItem('qrrpa-year') || "2025") && (
                          <span className="text-xs text-success">✓ Current</span>
                        )}
                        {hasPeriodChanges() && selectedYear !== (localStorage.getItem('qrrpa-year') || "2025") && (
                          <span className="text-xs text-warning">● Changed</span>
                        )}
                      </span>
                    </label>
                    <select
                      value={selectedYear}
                      onChange={(e) => updateYear(e.target.value)}
                      className="select select-bordered select-sm w-full bg-base-100 text-base-content hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {getYearOptions().map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Quarter Selector - Mobile Optimized */}
                  <div className="space-y-2">
                    <label className="label py-1">
                      <span className="label-text text-xs sm:text-sm font-medium text-base-content flex items-center gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Quarter
                        {!hasPeriodChanges() && selectedQuarter === (localStorage.getItem('qrrpa-quarter') || "Q4") && (
                          <span className="text-xs text-success">✓ Current</span>
                        )}
                        {hasPeriodChanges() && selectedQuarter !== (localStorage.getItem('qrrpa-quarter') || "Q4") && (
                          <span className="text-xs text-warning">● Changed</span>
                        )}
                      </span>
                    </label>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => updateQuarter(e.target.value)}
                      className="select select-bordered select-sm w-full bg-base-100 text-base-content hover:border-secondary focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      {quarterOptions.map(quarter => (
                        <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Deadline Selector - Mobile Optimized */}
                  <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                    <label className="label py-1">
                      <span className="label-text text-xs sm:text-sm font-medium text-base-content flex items-center gap-2">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Deadline
                        {!hasPeriodChanges() && deadline === (localStorage.getItem('qrrpa-deadline') || "2025-12-31") && (
                          <span className="text-xs text-success">✓ Current</span>
                        )}
                        {hasPeriodChanges() && deadline !== (localStorage.getItem('qrrpa-deadline') || "2025-12-31") && (
                          <span className="text-xs text-warning">● Changed</span>
                        )}
                      </span>
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => updateDeadline(e.target.value)}
                      className="input input-bordered input-sm w-full bg-base-100 text-base-content hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all duration-200 shadow-sm hover:shadow-md"
                    />
                  </div>
                </div>
                
                {/* Mobile-First Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-3 border-t border-base-300/50 gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-base-content/70 order-2 sm:order-1">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                    <span>Active: <strong className="text-primary">{getCurrentPeriod()}</strong></span>
                  </div>
                  
                  {/* Reorganized Button Layout */}
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1 sm:order-2">
                    {/* Destructive Action - Top Right */}
                    <div className="flex justify-end">
                      <button
                        onClick={resetAllRecords}
                        className="btn btn-outline btn-error btn-sm hover:btn-error shadow-sm hover:shadow-md transition-all duration-200"
                        title={`Delete ALL QRRPA records for ${getCurrentPeriod()} (not just filtered results)`}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-xs sm:text-sm">Reset All</span>
                      </button>
                    </div>
                    
                    {/* Primary Actions - Bottom */}
                    <div className="flex gap-2 w-full sm:w-auto">
                      {hasPeriodChanges() && (
                        <button
                          onClick={cancelPeriodChanges}
                          className="btn btn-ghost btn-sm border border-base-300 hover:border-base-400 shadow-sm hover:shadow-md transition-all duration-200 flex-1 sm:flex-none"
                        >
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span className="text-xs sm:text-sm">Cancel</span>
                        </button>
                      )}
                      
                      <button
                        onClick={savePeriodChanges}
                        className={`btn shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 flex-1 sm:flex-none ${
                          hasPeriodChanges() 
                            ? 'btn-success text-white' 
                            : 'btn-primary'
                        }`}
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-xs sm:text-sm font-medium">
                          {hasPeriodChanges() ? 'Apply Changes' : 'Close'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile-First Search & Filters */}
        <div className="bg-base-100 border border-base-300/50 rounded-lg shadow-sm mx-2 sm:mx-0">
          {/* Filter Toggle Button - Mobile Optimized */}
          <div className="p-3 border-b border-base-300/50 flex justify-between items-center">
            <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-base-content">Search & Filters</h4>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-sm btn-ghost text-base-content gap-1"
            >
              {showFilters ? (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs sm:text-sm">Hide</span>
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="text-xs sm:text-sm">Filters</span>
                </>
              )}
            </button>
          </div>

          {/* Search Bar - Always Visible */}
          <div className="p-3">
            <label className="block text-sm font-medium mb-2 text-base-content">Search LGU</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by LGU name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-10 bg-base-100 text-base-content border-base-300"
              />
              <svg 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-base-content/50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2 text-base-content">Region</label>
                  <select className="select select-bordered select-sm w-full bg-base-100 text-base-content border-base-300" value={filters.region} onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value, province: '' }))} disabled={loadingDropdowns}>
                    <option value="">Select Region</option>
                    <option value="All">All Regions</option>
                    {regions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-base-content">Province</label>
                  <select className="select select-bordered select-sm w-full bg-base-100 text-base-content border-base-300" value={filters.province} onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))} disabled={loadingDropdowns || (filters.region && filters.region !== 'All' && provinces.length === 0)}>
                    <option value="">Select Province</option>
                    <option value="All">All Provinces</option>
                    {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-base-content">Status</label>
                  <select className="select select-bordered select-sm w-full bg-base-100 text-base-content border-base-300" value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="">All</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Not Submitted">Not Submitted</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <button className="btn btn-outline btn-sm px-6" onClick={clearFilters}>Clear</button>
              </div>
            </div>
          )}
        </div>

        {showResults ? (
          <div className="bg-base-100 rounded-lg shadow-sm border border-base-300">
            {/* Header with controls */}
            <div className="p-3 border-b border-base-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h4 className="text-lg font-semibold text-base-content">
                    Filtered Results ({filteredLgus.length} LGUs)
                    {searchQuery && (
                      <span className="text-sm font-normal text-base-content/60 ml-2">
                        - searching for "{searchQuery}"
                      </span>
                    )}
                  </h4>
                  <p className="text-sm text-base-content/60">
                    Showing {paginatedLgus.length} of {totalItems} LGUs (Page {currentPage} of {totalPages})
                  </p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {/* Smart Toggle All Button */}
                  {(() => {
                    // Calculate current state of displayed LGUs
                    const currentPeriod = getCurrentPeriod();
                    const submittedCount = paginatedLgus.filter(lgu => {
                      const record = localRecords.find(r => 
                        ((r.lguId === lgu._id) || 
                        (r.lguId && r.lguId._id === lgu._id) || 
                        (typeof r.lguId === 'object' && r.lguId._id === lgu._id)) &&
                        r.period === currentPeriod
                      );
                      return record?.status === 'Submitted';
                    }).length;
                    
                    const isToggleToSubmit = submittedCount <= paginatedLgus.length / 2;
                    const buttonText = isToggleToSubmit ? 'Toggle All' : 'Untoggle All';
                    const buttonIcon = isToggleToSubmit ? (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    );
                    
                    return (
                      <button
                        onClick={handleToggleAll}
                        disabled={isTogglingAll || paginatedLgus.length === 0}
                        className={`btn btn-sm ${isToggleToSubmit ? 'btn-primary' : 'btn-warning'}`}
                        title={`${buttonText} - ${isToggleToSubmit ? 'Mark' : 'Unmark'} all ${paginatedLgus.length} LGUs on this page`}
                      >
                        {isTogglingAll ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          buttonIcon
                        )}
                        {buttonText}
                      </button>
                    );
                  })()}

                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-base-content/70">Per page:</label>
                    <select 
                      value={itemsPerPage} 
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="select select-sm select-bordered"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Restore Original Order Button */}
                  {(!preserveOrder || isToggling) && (
                    <button
                      onClick={() => {
                        setPreserveOrder(true);
                        setIsToggling(false);
                        setStaticDisplayOrder(originalOrder.length > 0 ? originalOrder : filteredLgus);
                      }}
                      className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content"
                      title="Restore original order (stop auto-sorting)"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Restore Order
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="overflow-x-auto relative">
              {/* Loading Overlay during Toggle All */}
              {isTogglingAll && (
                <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-base-200 rounded-lg shadow-xl p-6 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="text-sm font-semibold text-base-content">Toggling All LGUs...</p>
                    <p className="text-xs text-base-content/60">Please wait, do not close this window</p>
                  </div>
                </div>
              )}

              {/* Loading Overlay during Batch Save */}
              {isBatchSaving && (
                <div className="absolute inset-0 bg-base-100/80 backdrop-blur-sm z-10 flex items-center justify-center">
                  <div className="bg-base-200 rounded-lg shadow-xl p-6 flex flex-col items-center gap-3">
                    <span className="loading loading-spinner loading-lg text-success"></span>
                    <p className="text-sm font-semibold text-base-content">Saving Changes...</p>
                    <p className="text-xs text-base-content/60">Saving {pendingChanges.size} change(s), please wait</p>
                  </div>
                </div>
              )}
              
              <table className={`table table-compact w-full ${(isTogglingAll || isBatchSaving) ? 'pointer-events-none opacity-60' : ''}`}>
                <thead>
                  <tr className="bg-base-200">
                    <th className="text-left p-1.5 font-semibold text-xs cursor-pointer select-none" onClick={() => { 
                      setSortBy('name'); 
                      setSortDirection(prev => sortBy === 'name' ? (prev === 'desc' ? 'asc' : 'desc') : 'asc'); 
                      setPreserveOrder(false); // Enable sorting when user clicks header
                      setIsToggling(false); // Allow re-sorting
                    }} title="Click to sort by LGU name">LGU Name {sortBy === 'name' && !preserveOrder && !isToggling && <span className="ml-1 text-xs text-base-content/60">{sortDirection === 'desc' ? '↓' : '↑'}</span>}</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Province</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Class</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Region</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Status</th>
                    <th className="text-left p-1.5 font-semibold text-xs cursor-pointer select-none" onClick={() => { 
                      setSortBy('date'); 
                      setSortDirection(prev => sortBy === 'date' ? (prev === 'desc' ? 'asc' : 'desc') : 'desc'); 
                      setPreserveOrder(false); // Enable sorting when user clicks header
                      setIsToggling(false); // Allow re-sorting
                    }} title="Click to sort by submission date">Submission Date {sortBy === 'date' && !preserveOrder && !isToggling && <span className="ml-1 text-xs text-base-content/60">{sortDirection === 'desc' ? '↓' : '↑'}</span>}</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Deadline Status</th>
                    <th className="text-left p-1.5 font-semibold text-xs">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLgus.length > 0 ? paginatedLgus.map((lgu) => {
                    const currentPeriod = getCurrentPeriod();
                    // Normalize LGU ID comparison - handle both string and ObjectId
                    const record = localRecords.find(r => {
                      const recordLguId = String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId);
                      const currentLguId = String(lgu._id);
                      return recordLguId === currentLguId && r.period === currentPeriod;
                    });
                    
                    const isEditing = editingCell?.lguId === lgu._id;
                    const currentStatus = record?.status || 'Not Submitted';
                    const currentDate = record?.dateSubmitted || '';
                    const currentRemarks = record?.description || '';
                    
                    // Check if this LGU has pending changes
                    const hasPendingChanges = pendingChanges.has(`${lgu._id}_${getCurrentPeriod()}`);
                    const pendingChange = pendingChanges.get(`${lgu._id}_${getCurrentPeriod()}`);
                    
                    // Create a descriptive tooltip for pending changes
                    const getPendingTooltip = () => {
                      if (!hasPendingChanges) return '';
                      const fieldName = pendingChange?.field || 'status';
                      const fieldLabels = {
                        'status': 'Status',
                        'dateSubmitted': 'Submission Date', 
                        'description': 'Remarks'
                      };
                      return `Pending changes to ${fieldLabels[fieldName] || fieldName} (click "Save All Changes" to save)`;
                    };
                    
                    return (
                      <tr 
                        key={lgu._id} 
                        className={`transition-all duration-300 ${
                          hasPendingChanges 
                            ? 'bg-amber-100 dark:bg-amber-900/30 border-l-4 border-l-amber-500 shadow-md hover:bg-amber-200 dark:hover:bg-amber-800/40' 
                            : 'hover:bg-base-200/50'
                        }`}
                        title={getPendingTooltip()}
                        style={hasPendingChanges ? {
                          backgroundColor: 'var(--highlight-bg, rgb(254 243 199))', // Light amber background, fallback for light theme
                          borderLeftColor: 'var(--highlight-border, rgb(245 158 11))', // Amber border
                          fontWeight: '600',
                          color: 'var(--highlight-text, rgb(92 54 14))', // Dark amber text for contrast
                          '--highlight-bg': 'light-dark(rgb(254 243 199), rgb(69 39 160 / 0.3))', // CSS light-dark function
                          '--highlight-border': 'light-dark(rgb(245 158 11), rgb(147 51 234))',
                          '--highlight-text': 'light-dark(rgb(92 54 14), rgb(196 181 253))'
                        } : {}}
                      >
                        <td className="p-1.5 font-medium text-xs">{lgu.name}</td>
                        <td className="p-1.5 text-xs">{lgu.province}</td>
                        <td className="p-1.5 text-xs">{lgu.classification || '-'}</td>
                        <td className="p-1.5 text-xs">{lgu.region || '-'}</td>

                        <td className="p-1.5">
                          <div className="flex items-center gap-2">
                            <label className={`flex items-center gap-1 rounded-lg p-1 transition-all duration-150 ease-out group ${
                              (isTogglingAll || isBatchSaving) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-base-200/50'
                            }`}>
                              <input
                                type="checkbox"
                                checked={currentStatus === 'Submitted'}
                                onChange={(e) => handleStatusChange(lgu._id, e.target.checked ? 'Submitted' : 'Not Submitted')}
                                className={`toggle toggle-success toggle-sm shadow-sm transition-all duration-200 ease-out hover:scale-105 active:scale-95 ${
                                  togglingLgu === lgu._id ? 'animate-pulse scale-95' : ''
                                }`}
                                style={{
                                  transitionProperty: 'transform, box-shadow, background-color',
                                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                                }}
                                disabled={togglingLgu === lgu._id || isTogglingAll || isBatchSaving}
                              />
                              <span className={`text-xs font-semibold transition-all duration-300 ease-out ${
                                currentStatus === 'Submitted' 
                                  ? 'text-white bg-green-600 px-2 py-1 rounded-full border border-green-600 shadow-sm' 
                                  : 'text-white bg-red-600 px-2 py-1 rounded-full border border-red-600 shadow-sm'
                              } ${
                                togglingLgu === lgu._id ? 'opacity-75 animate-pulse' : ''
                              }`}>
                                {currentStatus === 'Submitted' ? '✓ Submitted' : '✗ Not Submitted'}
                              </span>
                              {/* Individual LGU Processing Indicator */}
                              {togglingLgu === lgu._id && (
                                <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200">
                                  <div className="w-3 h-3 border-2 border-success/30 border-t-success rounded-full animate-spin"></div>
                                  <span className="text-xs text-success/70">Saving...</span>
                                </div>
                              )}
                            </label>
                          </div>
                        </td>

                        <td className="p-1.5">
                          {isEditing && editingCell.field === 'dateSubmitted' ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="datetime-local" 
                                value={editValue || ''} 
                                onChange={(e) => setEditValue(e.target.value)} 
                                onKeyDown={(e) => handleKeyPress(e, lgu._id)} 
                                className="input input-bordered input-xs w-full" 
                                autoFocus 
                                disabled={saving || isTogglingAll}
                                max="2099-12-31T23:59"
                                min="2020-01-01T00:00"
                              />
                              <button onClick={() => saveEdit(lgu._id)} disabled={saving || isTogglingAll || isBatchSaving} className="btn btn-success btn-xs" title="Stage changes (will be saved with 'Save All Changes')">✓</button>
                              <button onClick={cancelEdit} disabled={saving || isTogglingAll || isBatchSaving} className="btn btn-error btn-xs" title="Cancel edit">✕</button>
                            </div>
                          ) : (
                            <div className={`p-1 rounded min-w-[100px] flex items-center gap-1 text-xs ${
                              (isTogglingAll || isBatchSaving) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-base-300/50'
                            }`} onClick={() => !(isTogglingAll || isBatchSaving) && startEditing(lgu._id, 'dateSubmitted', currentDate)} title={currentDate ? formatDateTimePhilippines(currentDate) : 'Click to set submission date'} aria-label={currentDate ? `Submitted ${formatDateTimePhilippines(currentDate)}` : 'Click to set submission date'}>
                              {currentDate ? (<><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-base-content/70" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="1.5"></circle><path d="M12 7v6l4 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg><span className="font-medium">{formatTimeAgo(currentDate)}</span></>) : (<span className="text-base-content/50">Click to set</span>)}
                            </div>
                          )}
                        </td>

                        {/* Deadline Status Column */}
                        <td className="p-1.5">
                          {(() => {
                            const days = calculateDaysFromDeadline(currentDate, deadline);
                            const status = formatDeadlineStatus(days);
                            return (
                              <div className="flex items-center gap-1">
                                <span className={`badge ${status.badge} badge-xs`}>
                                  {days === null && '⏳'}
                                  {days !== null && days === 0 && '✅'}
                                  {days !== null && days < 0 && '🟢'}
                                  {days !== null && days > 0 && '🔴'}
                                </span>
                                <span className={`text-xs ${status.color}`}>
                                  {status.text}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-1.5">
                          {isEditing && editingCell.field === 'description' ? (
                            <div className="flex items-start gap-1">
                              <textarea 
                                value={editValue} 
                                onChange={(e) => setEditValue(e.target.value)} 
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && e.ctrlKey) {
                                    saveEdit(lgu._id);
                                  } else if (e.key === 'Escape') {
                                    cancelEdit();
                                  }
                                }}
                                className="textarea textarea-bordered textarea-xs w-full min-h-[60px] resize-y text-xs" 
                                placeholder="Enter remarks... (✓ to stage, ✕ to cancel)" 
                                autoFocus 
                                disabled={saving || isTogglingAll || isBatchSaving}
                                rows="2"
                              />
                              <div className="flex flex-col gap-1">
                                <button onClick={() => saveEdit(lgu._id)} disabled={saving || isTogglingAll || isBatchSaving} className="btn btn-success btn-xs" title="Stage changes (will be saved with 'Save All Changes')">✓</button>
                                <button onClick={cancelEdit} disabled={saving || isTogglingAll || isBatchSaving} className="btn btn-error btn-xs" title="Cancel edit">✕</button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              className={`p-1 rounded min-w-[120px] max-w-[200px] ${
                                (isTogglingAll || isBatchSaving) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-base-300/50'
                              }`}
                              title={currentRemarks || 'Click to add remarks...'}
                            >
                              {currentRemarks ? (
                                <div className="text-xs">
                                  <div 
                                    className="block cursor-pointer"
                                    style={{
                                      display: '-webkit-box',
                                      WebkitLineClamp: !expandedRemarks.has(lgu._id) && currentRemarks.length > 80 ? 2 : 'none',
                                      WebkitBoxOrient: 'vertical',
                                      overflow: !expandedRemarks.has(lgu._id) && currentRemarks.length > 80 ? 'hidden' : 'visible'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (currentRemarks.length > 80) {
                                        toggleRemarkExpansion(lgu._id);
                                      } else {
                                        startEditing(lgu._id, 'description', currentRemarks);
                                      }
                                    }}
                                    title={currentRemarks.length > 80 ? (expandedRemarks.has(lgu._id) ? 'Click to show less' : 'Click to expand') : 'Click to edit'}
                                  >
                                    {currentRemarks}
                                  </div>
                                  {currentRemarks.length > 80 && (
                                    <div className="flex justify-between items-center mt-1">
                                      <span className="text-xs text-base-content/60">
                                        {expandedRemarks.has(lgu._id) ? 'Click to show less' : 'Click to expand'}
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          startEditing(lgu._id, 'description', currentRemarks);
                                        }}
                                        className="text-xs text-primary hover:text-primary-focus font-medium"
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  )}
                                  {currentRemarks.length <= 80 && (
                                    <div className="opacity-0 hover:opacity-100 transition-opacity mt-1">
                                      <span className="text-xs text-base-content/60">Click to edit</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span 
                                  className="text-xs text-base-content/50"
                                  onClick={() => !(isTogglingAll || isBatchSaving) && startEditing(lgu._id, 'description', currentRemarks)}
                                >
                                  Click to add remarks...
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="8" className="text-center p-6 text-base-content/60 text-sm">No LGUs found matching the selected filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-base-300 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-sm text-base-content/70">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} LGUs
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Previous button */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="btn btn-sm btn-outline"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  
                  {/* Page numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    
                    if (start > 1) {
                      pages.push(
                        <button key={1} onClick={() => goToPage(1)} className="btn btn-sm btn-outline">1</button>
                      );
                      if (start > 2) {
                        pages.push(<span key="ellipsis1" className="px-2">...</span>);
                      }
                    }
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => goToPage(i)}
                          className={`btn btn-sm ${currentPage === i ? 'btn-primary' : 'btn-outline'}`}
                        >
                          {i}
                        </button>
                      );
                    }
                    
                    if (end < totalPages) {
                      if (end < totalPages - 1) {
                        pages.push(<span key="ellipsis2" className="px-2">...</span>);
                      }
                      pages.push(
                        <button key={totalPages} onClick={() => goToPage(totalPages)} className="btn btn-sm btn-outline">
                          {totalPages}
                        </button>
                      );
                    }
                    
                    return pages;
                  })()}
                  
                  {/* Next button */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="btn btn-sm btn-outline"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center p-8 bg-base-200/30 rounded-lg">
            <div className="text-base-content/40 text-5xl mb-4">📋</div>
            <h4 className="text-lg font-medium text-base-content mb-2">Ready to Filter LGUs</h4>
            <p className="text-base-content/60">Select your filter criteria above to automatically view LGU submissions.</p>
          </div>
        )}
        
        {/* NEW: Enhanced Sticky Save Button - Always visible at bottom when changes exist */}
        {pendingChanges.size > 0 && createPortal(
          <div 
            className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t-4 border-yellow-400 shadow-2xl p-4 animate-in slide-in-from-bottom duration-300 backdrop-blur-sm"
            style={{ 
              zIndex: 9999,
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0
            }}
          >
            <div className="flex items-center justify-between max-w-6xl mx-auto">
              <div className="flex items-center gap-4">
                <div className="animate-bounce">
                  <span className="text-yellow-400 text-xl">⚠️</span>
                </div>
                <div className="text-white">
                  <p className="font-bold text-lg text-white">
                    {pendingChanges.size} Changes Pending
                  </p>
                  <p className="text-xs text-white/70">
                    Changes staged in memory - not yet saved to your blgf_db database
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleClearPending}
                  className="btn btn-error btn-sm text-white bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700 shadow-lg"
                  disabled={isBatchSaving}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
                <button
                  onClick={handleBatchSave}
                  disabled={isBatchSaving}
                  className="btn btn-success btn-lg shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-200 font-bold"
                >
                  {isBatchSaving ? (
                    <>
                      <span className="loading loading-spinner loading-md"></span>
                      <span className="ml-2">Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Save All Changes ({pendingChanges.size})
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }
