import { useState } from "react";

export default function SMVFilters({
  selectedRegion,
  setSelectedRegion,
  uniqueRegions,
  searchQuery,
  setSearchQuery,
  complianceFilter,
  setComplianceFilter,
  progressFilter,
  setProgressFilter,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const complianceOptions = [
    { value: "all", label: "All Status", icon: "📊" },
    { value: "On Track", label: "On Track", icon: "✅" },
    { value: "At Risk", label: "At Risk", icon: "⚠️" },
    { value: "Delayed", label: "Delayed", icon: "🟡" },
    { value: "Overdue", label: "Overdue", icon: "🔴" },
  ];

  const progressRanges = [
    { value: "all", label: "All Progress" },
    { value: "0-25", label: "0-25%" },
    { value: "26-50", label: "26-50%" },
    { value: "51-75", label: "51-75%" },
    { value: "76-100", label: "76-100%" },
  ];

  const clearFilters = () => {
    setSelectedRegion("Caraga");
    setSearchQuery("");
    setComplianceFilter("all");
    setProgressFilter("all");
  };

  const hasActiveFilters =
    searchQuery ||
    complianceFilter !== "all" ||
    progressFilter !== "all" ||
    selectedRegion !== "Caraga";

  return (
    <div className="card bg-base-100 shadow-lg mb-6">
      <div className="card-body p-4">
        {/* Main Filters Row */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="form-control flex-1 min-w-[200px]">
            <div className="input-group">
              <span className="bg-base-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search LGU..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="btn btn-square btn-ghost"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Region Filter */}
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="select select-bordered w-full sm:w-auto min-w-[150px]"
          >
            {uniqueRegions.map((r) => (
              <option key={r} value={r}>
                {r === "all" ? "🌐 All Regions" : `📍 ${r}`}
              </option>
            ))}
          </select>

          {/* Toggle Advanced Filters */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="btn btn-outline btn-sm gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            {showAdvanced ? "Less Filters" : "More Filters"}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn btn-ghost btn-sm gap-2 text-error"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear All
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="divider my-2"></div>
        )}
        
        {showAdvanced && (
          <div className="flex flex-wrap gap-3">
            {/* Compliance Status Filter */}
            <div className="form-control flex-1 min-w-[200px]">
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">Compliance Status</span>
              </label>
              <select
                value={complianceFilter}
                onChange={(e) => setComplianceFilter(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                {complianceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Progress Range Filter */}
            <div className="form-control flex-1 min-w-[200px]">
              <label className="label py-1">
                <span className="label-text text-xs font-semibold">Progress Range</span>
              </label>
              <select
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                {progressRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-300">
            <span className="text-xs text-base-content/60 font-semibold">Active Filters:</span>
            {searchQuery && (
              <div className="badge badge-primary gap-1">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery("")} className="ml-1">✕</button>
              </div>
            )}
            {selectedRegion !== "Caraga" && (
              <div className="badge badge-secondary gap-1">
                Region: {selectedRegion}
                <button onClick={() => setSelectedRegion("Caraga")} className="ml-1">✕</button>
              </div>
            )}
            {complianceFilter !== "all" && (
              <div className="badge badge-accent gap-1">
                Status: {complianceFilter}
                <button onClick={() => setComplianceFilter("all")} className="ml-1">✕</button>
              </div>
            )}
            {progressFilter !== "all" && (
              <div className="badge badge-info gap-1">
                Progress: {progressFilter}%
                <button onClick={() => setProgressFilter("all")} className="ml-1">✕</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
