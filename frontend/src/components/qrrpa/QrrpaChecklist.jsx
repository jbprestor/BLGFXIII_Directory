import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import useApi from "../../services/axios";
import toast from 'react-hot-toast';
import { Save, XCircle } from "../common/Icon";

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
    const savedYear = localStorage.getItem('qrrpa-year');
    return savedYear || "2025";
  });
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const savedQuarter = localStorage.getItem('qrrpa-quarter');
    return savedQuarter || "Q3";
  });
  const [deadline, setDeadline] = useState(() => {
    const savedDeadline = localStorage.getItem('qrrpa-deadline');
    return savedDeadline || "2025-12-31";
  });

  // Draft state for period selection before applying
  const [draftYear, setDraftYear] = useState(() => localStorage.getItem('qrrpa-year') || "2025");
  const [draftQuarter, setDraftQuarter] = useState(() => localStorage.getItem('qrrpa-quarter') || "Q3");

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
    setDraftYear(newYear);
  };

  const updateQuarter = (newQuarter) => {
    setDraftQuarter(newQuarter);
  };

  // Clear all local data when period changes
  const clearDataForPeriodChange = () => {
    setLocalRecords([]);
    setPendingChanges(new Map());
    setEditingCell(null);
    setEditValue('');
    if (onRefresh) {
      onRefresh();
    }
  };

  // Save period changes and apply them
  const savePeriodChanges = () => {
    setSelectedYear(draftYear);
    setSelectedQuarter(draftQuarter);
    
    // Save to localStorage
    localStorage.setItem('qrrpa-year', draftYear);
    localStorage.setItem('qrrpa-quarter', draftQuarter);
    localStorage.setItem('qrrpa-deadline', deadline);

    // Clear data for the new period
    clearDataForPeriodChange();

    // Close the editor
    setShowDeadlineEditor(false);
  };

  // Cancel period changes and revert to saved values
  const cancelPeriodChanges = () => {
    setDraftYear(selectedYear);
    setDraftQuarter(selectedQuarter);
    
    const savedDeadline = localStorage.getItem('qrrpa-deadline') || "2025-12-31";
    setDeadline(savedDeadline);

    // Close the editor
    setShowDeadlineEditor(false);
  };

  // Check if period has changed from saved values
  const hasPeriodChanges = () => {
    const savedDeadline = localStorage.getItem('qrrpa-deadline') || "2025-12-31";
    return draftYear !== selectedYear || draftQuarter !== selectedQuarter || deadline !== savedDeadline;
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

  // Generate year options (current year only starting 2025)
  const getYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    
    for (let year = 2025; year <= currentYear; year++) {
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
      setRegions(["Region XIII", "Region XII", "Region XI"]);
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
      list.sort((a, b) => {
        const ad = dateMap.get(String(a._id)) || null;
        const bd = dateMap.get(String(b._id)) || null;
        const aTs = ad ? new Date(ad).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        const bTs = bd ? new Date(bd).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        if (aTs === bTs) return a.name.localeCompare(b.name);
        return sortDirection === 'asc' ? aTs - bTs : bTs - aTs;
      });
    } else if (sortBy === 'name') {
      list.sort((a, b) => {
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
    <div className="space-y-4" data-qrrpa-checklist="true">
      <div className="flex flex-col gap-4">
        {/* ── Unified Control Panel ── */}
        <div className="bg-base-100 border border-base-200 rounded-lg">
          <div className="flex flex-col xl:flex-row gap-4 p-4 justify-between items-start xl:items-center">

            {/* Left: Period & Context */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full xl:w-auto">
              <div className="flex items-center gap-2">
                <select
                  value={draftYear}
                  onChange={(e) => updateYear(e.target.value)}
                  className="select select-bordered select-sm font-medium rounded-md w-24"
                >
                  {getYearOptions().map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <select
                  value={draftQuarter}
                  onChange={(e) => updateQuarter(e.target.value)}
                  className="select select-bordered select-sm font-medium rounded-md w-36"
                >
                  {quarterOptions.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>

                {hasPeriodChanges() && (
                  <div className="flex items-center gap-1 ml-1 animate-in zoom-in-95 duration-200">
                    <button
                      onClick={savePeriodChanges}
                      className="btn btn-sm btn-primary rounded-md px-3"
                    >
                      Apply
                    </button>
                    <button
                      onClick={cancelPeriodChanges}
                      className="btn btn-sm btn-ghost rounded-md px-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 group">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-base-content/50 leading-none">Submission Deadline</span>
                  <span className={`text-sm font-semibold mt-0.5 ${new Date() > new Date(deadline) ? 'text-error' : 'text-base-content'}`}>
                    {formatDateOnly(deadline)}
                  </span>
                </div>
                <button
                  onClick={() => setShowDeadlineEditor(!showDeadlineEditor)}
                  className="btn btn-xs btn-circle btn-ghost text-base-content/50 hover:text-primary transition-all"
                  title="Change Deadline"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>

            {/* Right: Search & Filters */}
            <div className="flex flex-wrap gap-2 w-full xl:w-auto xl:justify-end">
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <input
                  type="text"
                  placeholder="Find an LGU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-bordered input-sm w-full pl-8 rounded-md font-normal"
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto">
                <select
                  className="select select-bordered select-sm flex-1 sm:w-32 rounded-md font-normal"
                  value={filters.region}
                  onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value, province: '' }))}
                >
                  <option value="">All Regions</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>

                <select
                  className="select select-bordered select-sm flex-1 sm:w-36 rounded-md font-normal"
                  value={filters.province}
                  onChange={(e) => setFilters(prev => ({ ...prev, province: e.target.value }))}
                >
                  <option value="">All Provinces</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>

                <select
                  className="select select-bordered select-sm flex-1 sm:w-28 rounded-md font-normal"
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Not Submitted">Missing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Deadline Editor Expansion */}
          {showDeadlineEditor && (
            <div className="p-4 border-t border-base-200 bg-base-50/50">
              <div className="flex items-end gap-3 max-w-xs">
                <div className="form-control w-full">
                  <label className="label py-1"><span className="label-text text-[10px] font-bold uppercase text-base-content/50">Update Deadline</span></label>
                  <input type="date" value={deadline} onChange={(e) => updateDeadline(e.target.value)} className="input input-bordered input-sm w-full rounded-md" />
                </div>
                <button onClick={() => setShowDeadlineEditor(false)} className="btn btn-sm btn-primary rounded-md font-medium">Done</button>
              </div>
            </div>
          )}
        </div>

      {showResults ? (
          <div className="bg-base-100 rounded-lg border border-base-200 overflow-hidden">
            {/* Header with controls */}
            <div className="px-4 py-3 border-b border-base-200 bg-base-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-base-content">
                  Checklist
                </h4>
                <span className="badge badge-neutral badge-sm rounded bg-base-200 text-base-content/70 border-none font-medium">
                  {filteredLgus.length} LGUs
                </span>
              </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Smart Toggle All Button */}
                  {(() => {
                    const currentPeriod = getCurrentPeriod();
                    const submittedCount = paginatedLgus.filter(lgu => {
                      const record = localRecords.find(r =>
                        String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId) === String(lgu._id) &&
                        r.period === currentPeriod
                      );
                      return record?.status === 'Submitted';
                    }).length;

                    const isToggleToSubmit = submittedCount <= paginatedLgus.length / 2;
                    const buttonText = isToggleToSubmit ? 'Mark Page' : 'Unmark Page';
                    const buttonIcon = isToggleToSubmit ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                    );

                    return (
                      <button
                        onClick={handleToggleAll}
                        disabled={isTogglingAll || paginatedLgus.length === 0}
                        className={`btn btn-sm px-3 rounded-md border-none font-medium text-xs ${isToggleToSubmit ? 'bg-primary text-white hover:bg-primary/90' : 'bg-warning text-warning-content hover:bg-warning/90'}`}
                      >
                        {isTogglingAll ? <span className="loading loading-spinner loading-xs"></span> : buttonIcon}
                        <span>{buttonText}</span>
                      </button>
                    );
                  })()}

                  <div className="h-6 w-px bg-base-300 hidden sm:block"></div>

                  <div className="flex items-center gap-2">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(parseInt(e.target.value))}
                      className="select select-sm select-bordered rounded-md font-medium text-xs h-8 min-h-0"
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
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
                      className="btn btn-ghost btn-xs text-base-content/60 hover:text-base-content h-10 px-3 rounded-xl"
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

              <table className={`table table-pin-rows w-full ${(isTogglingAll || isBatchSaving || hasPeriodChanges()) ? 'pointer-events-none opacity-60 transition-opacity duration-300' : 'transition-opacity duration-300'}`}>
                <thead>
                  <tr className="bg-base-50/80 border-b border-base-200 z-30 sticky top-0 backdrop-blur-sm">
                    <th className="text-base-content/60 font-semibold p-3 text-xs uppercase tracking-wider bg-transparent">LGU / Province</th>
                    <th className="text-base-content/60 font-semibold p-3 text-xs uppercase tracking-wider bg-transparent hidden lg:table-cell">Region</th>
                    <th className="text-base-content/60 font-semibold p-3 text-xs uppercase tracking-wider bg-transparent">Status</th>
                    <th className="text-base-content/60 font-semibold p-3 text-xs uppercase tracking-wider bg-transparent">Date</th>
                    <th className="text-base-content/60 font-semibold p-3 text-xs uppercase tracking-wider bg-transparent hidden sm:table-cell">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLgus.length > 0 ? paginatedLgus.map((lgu, index) => {
                    const currentPeriod = getCurrentPeriod();
                    // Normalize LGU ID comparison - handle both string and ObjectId
                    const record = localRecords.find(r => {
                      const recordLguId = String(typeof r.lguId === 'object' ? r.lguId._id : r.lguId);
                      const currentLguId = String(lgu._id);
                      return recordLguId === currentLguId && r.period === currentPeriod;
                    });

                    // Group Header Detection
                    const showGroupHeader = sortBy === 'province' && (index === 0 || paginatedLgus[index - 1].province !== lgu.province);

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
                      return `Pending changes to ${fieldName} (click "Save All Changes" to save)`;
                    };

                    return [
                      showGroupHeader && (
                        <tr key={`group-${lgu.province}-${index}`} className="bg-base-200/40">
                          <td colSpan="5" className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary/70 bg-base-200/40 sticky top-28 z-20 backdrop-blur-sm shadow-sm hidden md:table-cell">
                            {lgu.province}
                          </td>
                        </tr>
                      ),
                      <tr
                        key={lgu._id}
                        className={`hover:bg-base-200/50 transition-all border-b border-base-200/60 ${hasPendingChanges ? 'border-l-4 border-l-warning bg-warning/5' : ''}`}
                        title={getPendingTooltip()}
                      >
                        <td className="px-4 sm:px-6 py-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-base-content text-sm leading-tight">{lgu.name}</span>
                            <span className="text-[11px] text-base-content/60 mt-0.5">{lgu.province} {lgu.classification ? `• ${lgu.classification}` : ''}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 text-xs text-base-content/60 hidden lg:table-cell">{lgu.region || '-'}</td>

                        <td className="px-4 sm:px-6 py-3">
                          <div
                            onClick={() => !(isTogglingAll || isBatchSaving) && handleStatusChange(lgu._id, currentStatus === 'Submitted' ? 'Not Submitted' : 'Submitted')}
                            className={`group inline-flex items-center gap-1.5 cursor-pointer px-2.5 py-1 rounded-full transition-colors border select-none sm:w-auto w-full justify-center ${currentStatus === 'Submitted'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-base-100 border-base-300 text-base-content/50 hover:bg-base-200'
                              } ${togglingLgu === lgu._id ? 'opacity-70 cursor-wait' : ''}`}
                          >
                            <div className="flex items-center gap-1.5">
                              {togglingLgu === lgu._id ? (
                                <span className="loading loading-spinner loading-xs text-current"></span>
                              ) : (
                                currentStatus === 'Submitted'
                                  ? <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                  : <div className="w-2.5 h-2.5 rounded-full border border-current"></div>
                              )}
                              <span className="font-medium text-xs whitespace-nowrap">{currentStatus === 'Submitted' ? 'Submitted' : 'Pending'}</span>
                            </div>
                            {hasPendingChanges && <span className="w-1.5 h-1.5 rounded-full bg-warning" title="Staged change"></span>}
                          </div>
                        </td>

                        <td className="px-4 sm:px-6 py-3">
                          {isEditing && editingCell.field === 'dateSubmitted' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="datetime-local"
                                value={editValue || ''}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => handleKeyPress(e, lgu._id)}
                                className="input input-bordered input-sm w-full min-w-[140px] text-xs bg-base-100"
                                autoFocus
                                disabled={saving || isTogglingAll}
                              />
                              <div className="flex flex-col sm:flex-row gap-1">
                                <button onClick={() => saveEdit(lgu._id)} disabled={saving} className="btn btn-square btn-success btn-xs">✓</button>
                                <button onClick={cancelEdit} disabled={saving} className="btn btn-square btn-ghost btn-xs">✕</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`group/date flex items-center gap-1.5 text-xs transition-colors cursor-pointer whitespace-nowrap ${currentDate ? 'text-base-content/80' : 'text-base-content/30'}`}
                              onClick={() => !(isTogglingAll || isBatchSaving) && startEditing(lgu._id, 'dateSubmitted', currentDate)}
                            >
                              <svg className="w-3 h-3 opacity-50 group-hover/date:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              {currentDate ? formatDateTimePhilippines(currentDate) : 'Set'}
                            </div>
                          )}
                        </td>

                        <td className="px-4 sm:px-6 py-3 hidden sm:table-cell">
                          {isEditing && editingCell.field === 'description' ? (
                            <div className="flex bg-base-100 border border-base-300 rounded p-1">
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && saveEdit(lgu._id) || e.key === 'Escape' && cancelEdit()}
                                className="textarea textarea-xs w-full min-h-[36px] bg-transparent focus:outline-none resize-none px-1"
                                placeholder="..."
                                autoFocus
                              />
                              <div className="flex flex-col gap-0.5 ml-1">
                                <button onClick={() => saveEdit(lgu._id)} className="btn btn-ghost btn-xs text-success h-5 min-h-0 px-1">✓</button>
                                <button onClick={cancelEdit} className="btn btn-ghost btn-xs text-error h-5 min-h-0 px-1">✕</button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`text-xs max-w-[150px] truncate py-1 px-2 rounded cursor-pointer ${currentRemarks ? 'bg-base-200 text-base-content/80' : 'text-base-content/40 hover:bg-base-200/50'}`}
                              onClick={() => !(isTogglingAll || isBatchSaving) && startEditing(lgu._id, 'description', currentRemarks)}
                            >
                              {currentRemarks || 'Add...'}
                            </div>
                          )}
                        </td>
                      </tr>
                    ];
                  }) : (
                    <tr>
                      <td colSpan="5" className="text-center p-8 bg-base-100">
                        <div className="flex flex-col items-center justify-center opacity-50">
                          <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                          <span>No LGUs found. Try adjusting filters.</span>
                        </div>
                      </td>
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
            className="fixed bottom-0 left-0 right-0 lg:left-64 z-[100] p-4 animate-in slide-in-from-bottom duration-500 ease-out"
          >
            <div className="max-w-5xl mx-auto">
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-5 overflow-hidden relative">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -ml-10 -mb-10"></div>

                <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center relative">
                       <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] font-black text-slate-900 items-center justify-center">
                          {pendingChanges.size}
                        </span>
                      </span>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-white font-black text-lg tracking-tight leading-none uppercase italic">Changes Detected</h3>
                      <p className="text-white/40 text-xs font-bold uppercase tracking-widest mt-1.5">Staged {pendingChanges.size} record(s) for the current period</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={handleClearPending}
                      className="btn bg-transparent border-2 border-white/20 !text-white font-black px-6 rounded-2xl h-12 hover:bg-white/10 hover:border-white/40 transition-all flex-1 md:flex-none uppercase text-xs tracking-widest"
                      disabled={isBatchSaving}
                    >
                      Discard
                    </button>
                    <button
                      onClick={handleBatchSave}
                      className="btn bg-white hover:bg-white/90 text-slate-900 border-none rounded-2xl flex-1 md:flex-none h-12 shadow-2xl shadow-white/20 font-black px-12 transition-all active:scale-95 group uppercase text-xs tracking-widest"
                      disabled={isBatchSaving}
                    >
                      {isBatchSaving ? <span className="loading loading-spinner loading-sm"></span> : (
                        <>
                          <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Spacer for fixed bottom bar */}
        {pendingChanges.size > 0 && <div className="h-24"></div>}
      </div>
    </div>
  );
}
