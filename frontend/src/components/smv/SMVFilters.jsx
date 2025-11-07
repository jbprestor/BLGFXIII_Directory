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
  viewMode,
  setViewMode,
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
    <div className="bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 rounded-2xl shadow-lg border-2 border-base-300/30 mb-6 overflow-hidden backdrop-blur-sm">
      <div className="p-4">
        {/* Main Filters Row - Optimized Spacing */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search - Flexible width */}
          <div className="flex-1 lg:max-w-md">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-base-content/40 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search LGU by name..."
                className="input input-bordered w-full pl-11 pr-10 h-10 bg-base-100/80 backdrop-blur-sm focus:bg-base-100 border-2 focus:border-primary transition-all rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/40 hover:text-error transition-colors"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Region Filter - Compact */}
          <div className="w-full lg:w-48">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-base-content/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="select select-bordered w-full h-10 pl-10 bg-base-100/80 backdrop-blur-sm border-2 focus:border-primary rounded-xl transition-all"
              >
                {uniqueRegions.map((r) => (
                  <option key={r} value={r}>
                    {r === "all" ? "All Regions" : r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider (desktop only) */}
          <div className="hidden lg:block w-px h-8 bg-base-300/50" />

          {/* Action Buttons Group */}
          <div className="flex gap-2 items-center">
            {/* View Mode Toggle - Enhanced */}
            <div className="join join-horizontal shadow-md">
              <button
                onClick={() => setViewMode("simple")}
                className={`join-item btn btn-sm h-10 min-h-10 px-4 gap-2 transition-all ${
                  viewMode === "simple" 
                    ? "btn-primary shadow-lg" 
                    : "btn-ghost bg-base-100/80 hover:bg-base-200"
                }`}
                title="Simple view - compact list"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="hidden md:inline font-medium">Simple</span>
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`join-item btn btn-sm h-10 min-h-10 px-4 gap-2 transition-all ${
                  viewMode === "detailed" 
                    ? "btn-primary shadow-lg" 
                    : "btn-ghost bg-base-100/80 hover:bg-base-200"
                }`}
                title="Detailed view - full information"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="hidden md:inline font-medium">Detailed</span>
              </button>
            </div>

            {/* Toggle Advanced Filters - Modern */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`btn btn-sm h-10 min-h-10 px-4 gap-2 shadow-md transition-all ${
                showAdvanced 
                  ? 'btn-secondary' 
                  : 'btn-ghost bg-base-100/80 hover:bg-base-200'
              }`}
            >
              <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="hidden sm:inline font-medium">{showAdvanced ? "Hide Filters" : "More Filters"}</span>
            </button>

            {/* Clear Filters - Enhanced */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-sm h-10 min-h-10 px-4 gap-2 btn-ghost bg-error/10 text-error hover:bg-error/20 shadow-md transition-all"
                aria-label="Clear all filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="hidden sm:inline font-medium">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters - Enhanced Design */}
        {showAdvanced && (
          <>
            <div className="divider my-4 text-xs font-bold text-base-content/50 uppercase tracking-wide">Advanced Filters</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200/30 rounded-xl p-4 border border-base-300/30">
              {/* Compliance Status Filter */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-bold text-base-content/70 uppercase tracking-wide">Compliance Status</span>
                </label>
                <select
                  value={complianceFilter}
                  onChange={(e) => setComplianceFilter(e.target.value)}
                  className="select select-bordered w-full h-10 bg-base-100"
                >
                  {complianceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress Range Filter */}
              <div className="form-control">
                <label className="label pb-1">
                  <span className="label-text text-xs font-bold text-base-content/70 uppercase tracking-wide">Progress Range</span>
                </label>
                <select
                  value={progressFilter}
                  onChange={(e) => setProgressFilter(e.target.value)}
                  className="select select-bordered w-full h-10 bg-base-100"
                >
                  {progressRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}

        {/* Active Filter Tags - Enhanced Design */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t-2 border-primary/10">
            <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">Active:</span>
            {searchQuery && (
              <div className="badge badge-primary badge-lg gap-2 py-3 px-3">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-semibold">"{searchQuery}"</span>
                <button 
                  onClick={() => setSearchQuery("")} 
                  className="hover:bg-primary-content/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove search filter"
                >
                  ✕
                </button>
              </div>
            )}
            {selectedRegion !== "Caraga" && (
              <div className="badge badge-secondary badge-lg gap-2 py-3 px-3">
                <span>📍</span>
                <span className="font-semibold">{selectedRegion}</span>
                <button 
                  onClick={() => setSelectedRegion("Caraga")} 
                  className="hover:bg-secondary-content/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove region filter"
                >
                  ✕
                </button>
              </div>
            )}
            {complianceFilter !== "all" && (
              <div className="badge badge-accent badge-lg gap-2 py-3 px-3">
                <span>📊</span>
                <span className="font-semibold">{complianceFilter}</span>
                <button 
                  onClick={() => setComplianceFilter("all")} 
                  className="hover:bg-accent-content/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove compliance filter"
                >
                  ✕
                </button>
              </div>
            )}
            {progressFilter !== "all" && (
              <div className="badge badge-info badge-lg gap-2 py-3 px-3">
                <span>📈</span>
                <span className="font-semibold">{progressFilter}%</span>
                <button 
                  onClick={() => setProgressFilter("all")} 
                  className="hover:bg-info-content/20 rounded-full p-0.5 transition-colors"
                  aria-label="Remove progress filter"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
