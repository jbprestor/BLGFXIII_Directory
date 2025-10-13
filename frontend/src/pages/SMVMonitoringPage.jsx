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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState("table");
  
  // Timeline modal state
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [selectedLguForTimeline, setSelectedLguForTimeline] = useState(null);
  
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
      
      // Filter by selected year
      const filteredByYear = allMonitorings.filter(m => 
        m.referenceYear === selectedYear || 
        new Date(m.createdAt).getFullYear() === selectedYear
      );
      
      setMonitorings(filteredByYear);
      setError(null);
    } catch {
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
      const monitoring =
        monitorings.find((m) => m.lguId?._id === lgu._id) || {};
      
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
    console.log('handleSetTimeline received rowData:', rowData);
    console.log('rowData.stageMap:', rowData.stageMap);
    setSelectedLguForTimeline(rowData);
    setTimelineModalOpen(true);
  };

  // Handle saving timeline
  const handleSaveTimeline = async (allData) => {
    const loadingToastId = toast.loading(`Saving data for ${selectedLguForTimeline.lguName}...`);
    
    try {
      let monitoringId = selectedLguForTimeline?.monitoringId;

      // If no monitoring exists, create one first
      if (!monitoringId) {
        const createRes = await api.post("/smv-processes", {
          lguId: selectedLguForTimeline.lguId,
          referenceYear: selectedYear,
          valuationDate: new Date(selectedYear, 0, 1),
          createdBy: user._id,
        });
        
        monitoringId = createRes.data._id;
        setMonitorings((prev) => [...prev, createRes.data]);
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
      
      if (error.response?.status === 409) {
        // Monitoring already exists for this year, try to fetch and update it
        try {
          const existing = await api.get(`/smv-processes`, {
            params: { lguId: selectedLguForTimeline.lguId, year: selectedYear },
          });
          const monitoring = existing.data?.monitoringList?.[0];
          if (monitoring) {
            setMonitorings((prev) => [...prev, monitoring]);
            
            // Prepare the update data (same as above)
            const updateData = {};
            
            if (allData.timeline) {
              const timeline = {};
              Object.keys(allData.timeline).forEach(key => {
                if (allData.timeline[key]) {
                  const value = allData.timeline[key];
                  timeline[key] = value.includes('T') ? value : new Date(value).toISOString();
                }
              });
              updateData.timeline = timeline;
            }
            
            if (allData.stageMap) {
              // Clean stageMap - remove MongoDB-specific fields and placeholders
              const cleanedStageMap = {};
              Object.keys(allData.stageMap).forEach(stage => {
                const stageActivities = allData.stageMap[stage];
                if (Array.isArray(stageActivities)) {
                  cleanedStageMap[stage] = stageActivities
                    .filter(activity => !activity.placeholder)
                    .map(activity => ({
                      name: activity.name,
                      status: activity.status || 'Not Started',
                      dateCompleted: activity.dateCompleted || '',
                      remarks: activity.remarks || ''
                    }));
                }
              });
              updateData.stageMap = cleanedStageMap;
              
              // Convert stageMap to activities array
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
              updateData.proposedPublicationActivities = allData.proposedPublicationActivities.map(activity => ({
                name: activity.name,
                status: activity.status || 'Not Completed',
                dateCompleted: activity.dateCompleted || '',
                remarks: activity.remarks || '',
                isHeader: activity.isHeader || false,
                isNote: activity.isNote || false
              }));
            }
            
            // Handle review publication activities - clean data
            if (allData.reviewPublicationActivities) {
              updateData.reviewPublicationActivities = allData.reviewPublicationActivities.map(activity => ({
                name: activity.name,
                status: activity.status || 'Not Completed',
                dateCompleted: activity.dateCompleted || '',
                remarks: activity.remarks || ''
              }));
            }
            
            // Try to update the existing monitoring
            const res = await api.put(`/smv-processes/${monitoring._id}`, updateData);
            setMonitorings((prev) =>
              prev.map((m) => (m._id === monitoring._id ? res.data : m))
            );
            
            // IMPORTANT: Update selectedLguForTimeline with fresh data
            setSelectedLguForTimeline(res.data);
            console.log("🔄 SMVMonitoringPage: Updated selectedLguForTimeline with fresh data (409 recovery)");
            
            // Success toast now handled by modal component
            // Modal stays open for continued editing
            return;
          }
        } catch (fetchError) {
          console.error("Error fetching existing monitoring:", fetchError);
          toast.error("Failed to update existing monitoring record. Please try again.");
          return;
        }
      }
      
      // Show error toast for other errors
      const errorMessage = error.response?.data?.message || error.message || "Failed to save timeline";
      toast.error(`Error: ${errorMessage}`);
      console.error("Save timeline error:", error);
      console.error("Backend error response:", error.response?.data);
      console.error("Status code:", error.response?.status);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchMonitorings} />;

  return (
    <div className="min-h-screen bg-base-200/30">
      {/* Tab Navigation - Like QRRPA */}
      <div className="px-2 pt-2 pb-3 sm:px-4">
        <div className="flex bg-base-100 rounded-xl p-1 shadow-lg border border-base-300/50 max-w-sm mx-auto sm:max-w-4xl backdrop-blur-sm">
          <button 
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === "dashboard" 
                ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]" 
                : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
            }`} 
            onClick={() => setActiveTab("dashboard")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Dashboard</span>
            </div>
          </button>
          <button 
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === "table" 
                ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]" 
                : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
            }`} 
            onClick={() => setActiveTab("table")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Table View</span>
            </div>
          </button>
          <button 
            className={`flex-1 py-3 px-2 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 ${
              activeTab === "analytics" 
                ? "bg-primary text-primary-content shadow-lg transform scale-[1.02]" 
                : "text-base-content/70 hover:text-base-content hover:bg-base-200/50 hover:scale-[1.01]"
            }`} 
            onClick={() => setActiveTab("analytics")}
          >
            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center sm:gap-2">
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
        <div className="bg-base-100/95 backdrop-blur-sm rounded-xl shadow-xl border border-base-300/50 min-h-[calc(100vh-200px)] max-w-sm mx-auto sm:max-w-7xl overflow-hidden">
          
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

          {/* Table View Tab */}
          {activeTab === "table" && (
            <section className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl font-bold text-base-content">SMV Monitoring Table</h3>
                  <p className="text-sm text-base-content/60">Detailed progress tracking by stage</p>
                </div>
                <div className="badge badge-primary badge-lg">{filteredTableData.length} LGUs</div>
              </div>

              {/* RA 12001 Timeline Info Banner */}
              <div className="alert bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30 mb-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1 text-xs sm:text-sm">
                    <p className="font-bold text-primary mb-1">📋 RA 12001 Timeline Tracking</p>
                    <p className="text-base-content/80 leading-relaxed">
                      <span className="font-semibold text-primary">Day 0</span> starts when BLGF Central Office issues the notice to prepare SMV 
                      (e.g., <span className="font-semibold">April 14, 2025</span>). The <span className="font-semibold text-warning">"Days"</span> column shows:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-base-content/70">
                      <li><span className="font-semibold">Day X</span> = Days since BLGF Notice received</li>
                      <li><span className="font-semibold text-success">Green countdown</span> = Days until next deadline (30+ days)</li>
                      <li><span className="font-semibold text-warning">Yellow countdown</span> = Urgent deadline (&lt;30 days)</li>
                      <li><span className="font-semibold text-error">Red ⏰</span> = Overdue deadline</li>
                    </ul>
                    <p className="text-base-content/60 text-[10px] mt-2">
                      💡 Click any row to expand and view detailed timeline milestones (RO Submission, Publication, Sanggunian, etc.)
                    </p>
                  </div>
                </div>
              </div>

              {/* Year Selector - SMV is every 3 years */}
              <div className="mb-4 p-4 bg-base-200/50 rounded-lg border border-base-300">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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

              {/* Filters */}
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
              />

              {/* Summary Table - Dashboard Card Style */}
              <SMVSummaryTable
                filteredTableData={filteredTableData}
                stages={stages}
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
