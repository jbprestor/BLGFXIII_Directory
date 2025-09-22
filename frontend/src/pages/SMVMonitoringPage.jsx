import { useEffect, useState, useCallback, useMemo } from "react";
import useApi from "../services/axios.js";
import LoadingSpinner from "../components/common/LoadingSpinner.jsx";
import ErrorDisplay from "../components/common/ErrorDisplay.jsx";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function SMVMonitoringPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "Admin";
  const { getAllLgus, getSMVProcesses, api } = useApi();

  const [monitorings, setMonitorings] = useState([]);
  const [lgus, setLGUs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState("Caraga");

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

  // Fetch Monitorings
  const fetchMonitorings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getSMVProcesses({ all: true });
      setMonitorings(
        Array.isArray(res.data) ? res.data : res.data?.monitoringList || []
      );
      setError(null);
    } catch {
      setMonitorings([]);
      setError("Failed to load SMV monitorings");
      toast.error("Failed to fetch SMV monitoring");
    } finally {
      setLoading(false);
    }
  }, [getSMVProcesses]);

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
      const activities = monitoring.activities || [];

      // Map stages → activities (with placeholders)
      const stageMap = stages.reduce((acc, stage) => {
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

      return {
        lguName: lgu.name,
        lguId: lgu._id,
        monitoringId: monitoring._id,
        stageMap,
        totalPercent: monitoring.progressPercent || 0, // ✅ use backend
      };
    });
  }, [filteredLGUs, monitorings]);

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

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchMonitorings} />;

  return (
    <div className="p-6 pt-20">
      <h1 className="text-2xl font-bold mb-4">SMV Monitoring</h1>

      <div className="mb-4">
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="select select-bordered w-52"
        >
          {uniqueRegions.map((r) => (
            <option key={r} value={r}>
              {r === "all" ? "All Regions" : r}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="sticky left-0 bg-base-200 z-10">
                Province / City
              </th>
              {stages.map((stage) => (
                <th key={stage}>{stage}</th>
              ))}
              <th className="sticky right-0 bg-base-200 z-10">Total %</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row) => (
              <tr key={row.lguId}>
                {/* Sticky LGU column */}
                <td className="sticky left-0 bg-base-100 font-semibold z-10">
                  {row.lguName}
                </td>

                {/* Stages */}
                {stages.map((stage) => (
                  <td key={stage} className="text-center">
                    {row.stageMap[stage].map((activity) => {
                      const isCompleted = activity.status === "Completed";
                      const isNotStarted = activity.status === "Not Started";
                      const colorClass = isCompleted
                        ? "text-green-600"
                        : isNotStarted
                        ? "text-gray-400"
                        : "text-yellow-500";

                      return (
                        <label
                          key={activity._id}
                          className="flex items-center justify-center gap-1"
                        >
                          <input
                            type="checkbox"
                            checked={isCompleted}
                            disabled={!isAdmin}
                            onChange={() =>
                              handleCheckboxToggle(
                                row.monitoringId,
                                activity,
                                row.lguId
                              )
                            }
                            className="checkbox checkbox-sm"
                          />
                          <span className={`text-xs ${colorClass}`}>
                            {activity.status}
                          </span>
                        </label>
                      );
                    })}
                  </td>
                ))}

                {/* Sticky Total % column */}
                <td className="sticky right-0 bg-base-100 text-center z-10">
                  <div className="flex flex-col items-center">
                    <progress
                      className="progress progress-primary w-24"
                      value={row.totalPercent}
                      max="100"
                    ></progress>
                    <span className="text-sm font-bold mt-1">
                      {row.totalPercent}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
