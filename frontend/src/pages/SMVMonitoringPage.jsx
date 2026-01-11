import { useEffect, useState, useCallback, useMemo } from "react";
import useApi from "../services/axios.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ErrorDisplay from "../components/common/ErrorDisplay.jsx";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext.jsx";
import SMVStatsCards from "../components/smv/SMVStatsCards.jsx";
import SMVTimelineAlerts from "../components/smv/SMVTimelineAlerts.jsx";
import SMVFilters from "../components/smv/SMVFilters.jsx";
import SMVSummaryTable from "../components/smv/SMVSummaryTable.jsx";
import SMVActivityTimeline from "../components/smv/SMVActivityTimeline.jsx";
import SetTimelineModal from "../components/modals/smv/SetTimelineModal.jsx";

export default function SMVMonitoringPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const { getAllLgus, getSMVProcesses, updateSMVTimeline, api } = useApi();

  const [monitorings, setMonitorings] = useState([]);
  const [lgus, setLGUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("Caraga");
  const [searchQuery, setSearchQuery] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [progressFilter, setProgressFilter] = useState("all");
  const [selectedYear, setSelectedYear] = useState(2025);
  const [activeTab, setActiveTab] = useState("table");
  const [viewMode, setViewMode] = useState("detailed"); // 'detailed' or 'simple'

  // Timeline modal state
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedLguForTimeline, setSelectedLguForTimeline] = useState(null);

  // Available years for SMV
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    // Allow selecting past 5 years and next year
    for (let i = -1; i < 5; i++) {
      years.push(currentYear - i);
    }
    return years.sort((a, b) => b - a); // Descending order
  }, []);

  const stages = [
    "Preparatory",
    "Data Collection",
    "Data Analysis",
    "Preparation of Proposed SMV",
    "Valuation Testing",
    "Finalization",
  ];

  // Fetch LGUs
  const fetchLGUs = useCallback(async () => {
    try {
      const res = await getAllLgus({ all: true });
      setLGUs(Array.isArray(res.data) ? res.data : res.data?.lgus || []);
      setError(null);
    } catch {
      setLGUs([]);
      setError("Failed to load LGUs");
      toast.error("Failed to fetch LGUs");
    }
  }, [getAllLgus]);

  // Fetch Monitorings - filtered by selected year
  const fetchMonitorings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSMVProcesses({ all: true, year: selectedYear });
      const allMonitorings = Array.isArray(res.data) ? res.data : res.data?.monitoringList || [];

      console.log(`📊 Fetched ${allMonitorings.length} monitoring records for year ${selectedYear}`);

      // Log each monitoring record to debug Surigao del Sur issue
      allMonitorings.forEach(m => {
        const lguName = m.lguId?.name || 'Unknown';
        const lguId = m.lguId?._id || m.lguId;
        console.log(`  - ${lguName} (LGU ID: ${lguId}, Monitoring ID: ${m._id})`);
      });

      // Filter by selected year
      const filteredByYear = allMonitorings.filter(m =>
        m.referenceYear === selectedYear ||
        new Date(m.createdAt).getFullYear() === selectedYear
      );

      console.log(`✅ After year filter: ${filteredByYear.length} records`);

      setMonitorings(filteredByYear);
      setError(null);
    } catch (error) {
      console.error('❌ Error fetching monitorings:', error);
      setMonitorings([]);
      setError("Failed to load SMV monitorings");
      toast.error("Failed to fetch SMV monitoring");
    } finally {
      setLoading(false);
    }
  }, [getSMVProcesses, selectedYear]);

  useEffect(() => {
    fetchLGUs();
    fetchMonitorings();
  }, []);

  // Filter LGUs by region and classification
  const filteredLGUs = useMemo(() => {
    return lgus
      .filter(
        (l) =>
          ["Province", "City"].includes(l.classification) &&
          (selectedRegion === "all" || l.region === selectedRegion)
      )
      .sort((a, b) =>
        a.region === "Caraga" ? -1 : b.region === "Caraga" ? 1 : 0
      );
  }, [lgus, selectedRegion]);

  // Merge LGUs with monitoring data
  const tableData = useMemo(() => {
    return filteredLGUs.map((lgu) => {
      // Find monitoring - handle both populated (m.lguId._id) and unpopulated (m.lguId as string) cases
      const monitoring = monitorings.find((m) => {
        const monitoringLguId = m.lguId?._id || m.lguId; // Handle both populated and string ID
        return monitoringLguId === lgu._id || monitoringLguId === lgu._id.toString();
      }) || {};

      console.log(`🔍 Matching for ${lgu.name}:`, {
        lguId: lgu._id,
        foundMonitoring: !!monitoring._id,
        monitoringId: monitoring._id,
        monitoringLguId: monitoring.lguId
      });

      // Try to use saved stageMap first, otherwise construct from activities
      let stageMap;
      if (monitoring.stageMap && Object.keys(monitoring.stageMap).length > 0) {
        // Use saved stageMap
        stageMap = monitoring.stageMap;
      } else {
        // Fallback: construct from activities array
        const activities = monitoring.activities || [];
        stageMap = stages.reduce((acc, stage) => {
          const stageActivities = activities.filter((a) => a.category === stage);
          acc[stage] =
            stageActivities.length > 0
              ? stageActivities
              : [
                {
                  _id: `placeholder-${lgu._id}-${stage}`,
                  category: stage,
                  status: "Not Started",
                  placeholder: true,
                },
              ];
          return acc;
        }, {});
      }

      // Calculate Tab 1 Progress: Timeline (100% if BLGF Notice Date is set)
      const tab1Progress = monitoring.timeline?.blgfNoticeDate ? 100 : 0;

      // Calculate Tab 2 Progress: Development activities
      const devActivities = Object.values(stageMap).flat().filter(a => !a.placeholder);
      const devCompleted = devActivities.filter(a => a.status === "Completed").length;
      const tab2Progress = devActivities.length > 0
        ? Math.round((devCompleted / devActivities.length) * 100)
        : 0;

      // Calculate Tab 3 Progress: Proposed Publication activities
      const proposedAct = monitoring.proposedPublicationActivities || [];
      const proposedCompleted = proposedAct.filter(a => a.status === "Completed").length;
      const tab3Progress = proposedAct.length > 0
        ? Math.round((proposedCompleted / proposedAct.length) * 100)
        : 0;

      // Calculate Tab 4 Progress: Review & Publication activities
      const reviewAct = monitoring.reviewPublicationActivities || [];
      const reviewCompleted = reviewAct.filter(a => a.status === "Completed").length;
      const tab4Progress = reviewAct.length > 0
        ? Math.round((reviewCompleted / reviewAct.length) * 100)
        : 0;

      // Calculate overall progress (weighted average)
      const overallProgress = Math.round(
        (tab1Progress * 0.1) +  // Timeline: 10% weight
        (tab2Progress * 0.6) +  // Development: 60% weight
        (tab3Progress * 0.2) +  // Proposed Publication: 20% weight
        (tab4Progress * 0.1)    // Review & Publication: 10% weight
      );

      // Determine current stage/phase
      let currentStage = "Timeline Setup";
      if (tab1Progress === 100) {
        if (tab2Progress > 0 && tab2Progress < 100) {
          // Find first incomplete stage in Development
          for (const stage of stages) {
            const activities = stageMap[stage] || [];
            const completed = activities.filter(a => a.status === "Completed").length;
            const total = activities.filter(a => !a.placeholder).length;
            if (completed < total && total > 0) {
              currentStage = `Dev - ${stage}`;
              break;
            }
          }
        } else if (tab2Progress === 100 && tab3Progress < 100) {
          currentStage = "Proposed Publication";
        } else if (tab3Progress === 100 && tab4Progress < 100) {
          currentStage = "Review & Publication";
        } else if (tab4Progress === 100) {
          currentStage = "Completed ✅";
        } else if (tab2Progress === 100) {
          currentStage = "Development Complete";
        }
      }

      return {
        lguName: lgu.name,
        lguId: lgu._id,
        monitoringId: monitoring._id,
        stageMap,
        totalPercent: monitoring.progressPercent || 0, // Keep old for backward compatibility
        // New 4-tab progress tracking
        tab1Progress,
        tab2Progress,
        tab3Progress,
        tab4Progress,
        overallProgress,
        currentStage,
        // Timeline & Compliance data
        complianceStatus: monitoring.complianceStatus || "On Track",
        daysElapsed: monitoring.daysElapsed || 0,
        daysRemaining: monitoring.daysRemaining,
        alerts: monitoring.alerts || [],
        timeline: monitoring.timeline || {},
        // Tab 3 & 4 data
        proposedPublicationActivities: monitoring.proposedPublicationActivities || [],
        reviewPublicationActivities: monitoring.reviewPublicationActivities || [],
      };
    });
  }, [filteredLGUs, monitorings]);

  // Apply search and filters
  const filteredTableData = useMemo(() => {
    let filtered = [...tableData];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(row =>
        row.lguName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Compliance filter
    if (complianceFilter !== "all") {
      filtered = filtered.filter(row => row.complianceStatus === complianceFilter);
    }

    // Progress range filter
    if (progressFilter !== "all") {
      const [min, max] = progressFilter.split("-").map(Number);
      filtered = filtered.filter(row =>
        row.totalPercent >= min && row.totalPercent <= max
      );
    }

    return filtered;
  }, [tableData, searchQuery, complianceFilter, progressFilter]);

  const uniqueRegions = useMemo(
    () => ["all", ...new Set(lgus.map((l) => l.region).filter(Boolean))],
    [lgus]
  );

  const handleCheckboxToggle = async (monitoringId, activity, lguId) => {
    if (!isAdmin) return;

    try {
      let newMonitoringId = monitoringId;

      // Auto-create monitoring if it doesn’t exist
      if (!monitoringId) {
        try {
          const res = await api.post("/smv-processes", {
            lguId,
            referenceYear: new Date().getFullYear(),
            valuationDate: new Date(),
            createdBy: user._id,
          });
          newMonitoringId = res.data._id;
          setMonitorings((prev) => [...prev, res.data]);

          toast.success("Monitoring created. Now click again to update stage.");
          return;
        } catch (err) {
          if (err.response?.status === 409) {
            // Monitoring already exists → fetch it
            const existing = await api.get(`/smv-processes`, {
              params: { lguId, year: new Date().getFullYear() },
            });
            const monitoring = existing.data?.monitoringList?.[0];
            if (monitoring) {
              newMonitoringId = monitoring._id;
              setMonitorings((prev) => [...prev, monitoring]);
              toast.success(
                "Existing monitoring found. Now click again to update stage."
              );
              return;
            }
          }
          throw err;
        }
      }

      // Skip placeholder activities
      if (activity.placeholder) {
        toast.error("This stage has no activity yet. Please retry.");
        return;
      }

      // Toggle status
      const newStatus =
        activity.status === "Completed" ? "Not Started" : "Completed";

      const res = await api.patch(
        `/smv-processes/${newMonitoringId}/activities/${activity._id}`,
        { status: newStatus }
      );

      // Update state with fresh monitoring from backend
      setMonitorings((prev) =>
        prev.map((m) => (m._id === newMonitoringId ? res.data : m))
      );

      toast.success(`Updated ${activity.category}`);
    } catch (err) {
      toast.error(`Failed: ${err.response?.data?.message || err.message}`);
    }
  };

  // Handle opening timeline modal
  const handleSetTimeline = (rowData) => {
    console.log('🎯 handleSetTimeline received rowData:', {
      lguName: rowData.lguName,
      lguId: rowData.lguId,
      monitoringId: rowData.monitoringId,
      hasTimeline: !!rowData.timeline,
      timelineKeys: rowData.timeline ? Object.keys(rowData.timeline) : [],
      hasStageMap: !!rowData.stageMap,
      stageMapKeys: rowData.stageMap ? Object.keys(rowData.stageMap) : []
    });

    if (rowData.monitoringId) {
      console.log('✅ Monitoring exists in database with ID:', rowData.monitoringId);
    } else {
      console.log('⚠️ No monitoring ID - will check database or create new');
    }

    setSelectedLguForTimeline(rowData);
    setTimelineModalOpen(true);
  };

  // Handle saving timeline
  const handleSaveTimeline = async (allData) => {
    const loadingToastId = toast.loading(`Saving data for ${selectedLguForTimeline.lguName}...`);

    try {
      let monitoringId = selectedLguForTimeline?.monitoringId;

      // If no monitoring ID, check database first before creating
      if (!monitoringId) {
        try {
          // First, check if monitoring already exists in DB
          const existingCheck = await api.get("/smv-processes", {
            params: { lguId: selectedLguForTimeline.lguId, year: selectedYear },
          });

          const existing = existingCheck.data?.monitoringList?.[0];
          if (existing) {
            // Found existing monitoring, use it
            monitoringId = existing._id;
            setMonitorings((prev) => {
              const alreadyExists = prev.some(m => m._id === existing._id);
              return alreadyExists ? prev : [...prev, existing];
            });
            console.log("✅ Found existing monitoring for", selectedLguForTimeline.lguName);
          } else {
            // No existing monitoring, create new one
            const createRes = await api.post("/smv-processes", {
              lguId: selectedLguForTimeline.lguId,
              referenceYear: selectedYear,
              valuationDate: new Date(selectedYear, 0, 1),
              createdBy: user._id,
            });

            monitoringId = createRes.data._id;
            setMonitorings((prev) => [...prev, createRes.data]);
            console.log("✅ Created new monitoring for", selectedLguForTimeline.lguName);
          }
        } catch (checkError) {
          // If check fails, try to create (might get 409 if exists)
          if (checkError.response?.status === 409) {
            // 409 means it exists, fetch it
            const existingRes = await api.get("/smv-processes", {
              params: { lguId: selectedLguForTimeline.lguId, year: selectedYear },
            });
            const existing = existingRes.data?.monitoringList?.[0];
            if (existing) {
              monitoringId = existing._id;
              setMonitorings((prev) => {
                const alreadyExists = prev.some(m => m._id === existing._id);
                return alreadyExists ? prev : [...prev, existing];
              });
              console.log("✅ Found existing monitoring after 409");
            } else {
              throw new Error("Monitoring exists but couldn't fetch it");
            }
          } else {
            throw checkError;
          }
        }
      }

      // Prepare the update data
      const updateData = {};

      // Handle timeline data (convert to ISO dates if needed)
      if (allData.timeline) {
        const timeline = {};
        Object.keys(allData.timeline).forEach(key => {
          if (allData.timeline[key]) {
            // Check if it's already a date string or needs conversion
            const value = allData.timeline[key];
            timeline[key] = value.includes('T') ? value : new Date(value).toISOString();
          }
        });
        updateData.timeline = timeline;
      }

      // Handle activities (stageMap) - Convert stageMap to activities array
      if (allData.stageMap) {
        // Clean stageMap - remove MongoDB-specific fields and placeholders
        const cleanedStageMap = {};
        Object.keys(allData.stageMap).forEach(stage => {
          const stageActivities = allData.stageMap[stage];
          if (Array.isArray(stageActivities)) {
            cleanedStageMap[stage] = stageActivities
              .filter(activity => !activity.placeholder) // Remove placeholders
              .map(activity => ({
                name: activity.name,
                status: activity.status || 'Not Started',
                dateCompleted: activity.dateCompleted || '',
                remarks: activity.remarks || ''
              }));
          }
        });
        updateData.stageMap = cleanedStageMap;

        // Also convert stageMap to activities array for backend compatibility
        // Map frontend stage names to backend enum values
        const stageNameMap = {
          "Finalization of Proposed SMV": "Finalization",
          // Add other mappings if needed
        };

        const activitiesArray = [];
        Object.keys(allData.stageMap).forEach(stage => {
          const stageActivities = allData.stageMap[stage];
          if (Array.isArray(stageActivities)) {
            stageActivities.forEach(activity => {
              // Skip placeholder activities
              if (!activity.placeholder) {
                // Map stage name to backend enum value
                const backendCategory = stageNameMap[stage] || stage;

                const activityData = {
                  name: activity.name,
                  category: backendCategory,
                  status: activity.status || 'Not Started',
                  remarks: activity.remarks || ''
                };

                // Only include dateCompleted if it has a valid value
                if (activity.dateCompleted && activity.dateCompleted !== '') {
                  // Convert to Date object if it's a string
                  const dateObj = new Date(activity.dateCompleted);
                  // Only add if it's a valid date
                  if (!isNaN(dateObj.getTime())) {
                    activityData.dateCompleted = dateObj;
                  }
                }

                activitiesArray.push(activityData);
              }
            });
          }
        });
        updateData.activities = activitiesArray;
      }

      // Handle proposed publication activities - clean data
      if (allData.proposedPublicationActivities) {
        console.log("📋 Raw proposedPublicationActivities:", allData.proposedPublicationActivities);
        updateData.proposedPublicationActivities = allData.proposedPublicationActivities.map(activity => ({
          name: activity.name,
          status: activity.status || 'Not Completed',
          dateCompleted: activity.dateCompleted || '',
          remarks: activity.remarks || '',
          isHeader: activity.isHeader || false,
          isNote: activity.isNote || false
        }));
        console.log("✅ Cleaned proposedPublicationActivities:", updateData.proposedPublicationActivities);
      }

      // Handle review publication activities - clean data
      if (allData.reviewPublicationActivities) {
        console.log("📋 Raw reviewPublicationActivities:", allData.reviewPublicationActivities);
        updateData.reviewPublicationActivities = allData.reviewPublicationActivities.map(activity => ({
          name: activity.name,
          status: activity.status || 'Not Completed',
          dateCompleted: activity.dateCompleted || '',
          remarks: activity.remarks || ''
        }));
        console.log("✅ Cleaned reviewPublicationActivities:", updateData.reviewPublicationActivities);
      }

      // Debug: Log the data being sent
      console.log("📤 Sending update data to backend:", JSON.stringify(updateData, null, 2));

      // Save all data using the general update endpoint
      const res = await api.put(`/smv-processes/${monitoringId}`, updateData);

      console.log("✅ SMVMonitoringPage: Received updated data from backend", res.data);

      // Update local state
      setMonitorings((prev) =>
        prev.map((m) => (m._id === monitoringId ? res.data : m))
      );

      // IMPORTANT: Update selectedLguForTimeline so the modal shows fresh data
      setSelectedLguForTimeline(res.data);
      console.log("🔄 SMVMonitoringPage: Updated selectedLguForTimeline with fresh data");

      // Dismiss loading - don't close modal, let user continue editing
      toast.dismiss(loadingToastId);
      // Success toast now handled by modal component
    } catch (error) {
      toast.dismiss(loadingToastId);

      // Show error toast
      const errorMessage = error.response?.data?.message || error.message || "Failed to save timeline";
      toast.error(`Error: ${errorMessage}`);
      console.error("❌ Save timeline error:", error);
      console.error("Backend error response:", error.response?.data);
      console.error("Status code:", error.response?.status);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchMonitorings} />;

  return (
    <div className="min-h-screen bg-base-200/30">
      {/* Tab Navigation - Like QRRPA */}
      <div className="px-3 pt-3 pb-4 sm:px-6">
        <div className="flex bg-base-100 rounded-xl p-1 shadow-lg border border-base-300/50 w-full max-w-4xl mx-auto backdrop-blur-sm" role="tablist" aria-label="SMV Tabs">
          <button
            role="tab"
            aria-selected={activeTab === "dashboard"}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${activeTab === "dashboard"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Dashboard</span>
            </div>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "table"}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${activeTab === "table"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setActiveTab("table")}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Table View</span>
            </div>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === "analytics"}
            className={`flex-1 py-3 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${activeTab === "analytics"
              ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]"
              : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
              }`}
            onClick={() => setActiveTab("analytics")}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>Analytics</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-2 pb-4 sm:px-4">
        <div className="bg-base-100/95 backdrop-blur-sm rounded-xl shadow-xl border border-base-300/50 min-h-[calc(100vh-180px)] w-full max-w-7xl mx-auto overflow-hidden">

          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">SMV Dashboard</h3>
                  <p className="text-sm text-base-content/60">Overview & Compliance Analytics</p>
                </div>
              </div>

              {/* Stats Dashboard */}
              <SMVStatsCards tableData={tableData} loading={loading} />

              {/* Timeline Alerts */}
              <SMVTimelineAlerts tableData={tableData} />
            </section>
          )}

          {/* Table View Tab - Simplified */}
          {activeTab === "table" && (
            <section className="p-3 sm:p-4 lg:p-6">
              {/* Enhanced Header with Count */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-xl">
                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-base-content">
                      LGU Monitoring
                    </h3>
                    <p className="text-xs text-base-content/60 font-medium">
                      Track SMV development progress across all LGUs
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="stats shadow-md bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="stat py-3 px-4">
                      <div className="stat-title text-[10px] font-bold uppercase tracking-wide">Total</div>
                      <div className="stat-value text-2xl text-primary">{filteredTableData.length}</div>
                      <div className="stat-desc text-[10px] font-medium">{filteredTableData.length === 1 ? 'LGU' : 'LGUs'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filters Only */}
              <SMVFilters
                selectedRegion={selectedRegion}
                setSelectedRegion={setSelectedRegion}
                uniqueRegions={uniqueRegions}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                complianceFilter={complianceFilter}
                setComplianceFilter={setComplianceFilter}
                progressFilter={progressFilter}
                setProgressFilter={setProgressFilter}
                viewMode={viewMode}
                setViewMode={setViewMode}
              />

              {/* Summary Table - Dashboard Card Style */}
              <SMVSummaryTable
                filteredTableData={filteredTableData}
                stages={stages}
                viewMode={viewMode}
                isAdmin={isAdmin}
                onSetTimeline={handleSetTimeline}
              />
            </section>
          )}

          {/* Analytics Tab */}
          {activeTab === "analytics" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">Activity Timeline & Analytics</h3>
                  <p className="text-sm text-base-content/60">Monitor activity completion patterns and stage durations</p>
                </div>
              </div>

              {/* Activity Timeline Component */}
              <SMVActivityTimeline tableData={tableData} />
            </section>
          )}

        </div>
      </div>

      {/* Set Timeline Modal */}
      <SetTimelineModal
        isOpen={timelineModalOpen}
        onClose={() => setTimelineModalOpen(false)}
        lguData={selectedLguForTimeline}
        onSave={handleSaveTimeline}
      />
    </div>
  );
}
