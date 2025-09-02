// components/SearchFilters.js
export default function SearchFilters({
  searchTerm,
  setSearchTerm,
  selectedLguType,
  setSelectedLguType,
  selectedStatus,
  setSelectedStatus,
  selectedRegion,
  setSelectedRegion,
  uniqueRegions,
  resultCount
}) {
  return (
    <div className="card bg-base-100 shadow-xl border border-base-300">
      <div className="card-body p-4 sm:p-6">
        <h2 className="card-title mb-2 sm:mb-4 text-lg sm:text-xl">Search & Filter</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 sm:gap-4 mb-4">
          {/* Search Input */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs sm:text-sm">Search Personnel</span>
            </label>
            <input
              type="text"
              placeholder="Search by name, LGU, position, or email..."
              className="input input-bordered input-sm sm:input-md w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LGU Type Filter */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs sm:text-sm">LGU Type</span>
            </label>
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedLguType}
              onChange={(e) => setSelectedLguType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="City">City</option>
              <option value="Municipality">Municipality</option>
              <option value="Province">Province</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs sm:text-sm">Appointment Status</span>
            </label>
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Permanent">Permanent</option>
              <option value="Temporary">Temporary</option>
              <option value="Casual">Casual</option>
              <option value="Job Order">Job Order</option>
              <option value="Contractual">Contractual</option>
            </select>
          </div>

          {/* Region Filter */}
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text text-xs sm:text-sm">Region</span>
            </label>
            <select
              className="select select-bordered select-sm sm:select-md w-full"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              <option value="all">All Regions</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="badge badge-neutral badge-sm sm:badge-lg">
            {resultCount} result{resultCount !== 1 ? 's' : ''} found
          </div>
          <button className="btn btn-outline btn-xs sm:btn-sm">
            <span>📊</span>
            Export Results
          </button>
        </div>
      </div>
    </div>
  );
}